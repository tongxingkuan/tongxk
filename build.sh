#!/bin/bash
# 自动构建部署脚本 - tongxk 项目

set -euo pipefail

DEPLOY_LOG_DIR="/var/log/deploy"
PROJECT_DIR="/root/.openclaw/workspace/tongxk"
LOG_FILE=""

# 创建日志目录
mkdir -p "$DEPLOY_LOG_DIR"

# 生成日志文件名（包含时间戳）
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
LOG_FILE="$DEPLOY_LOG_DIR/deploy_$TIMESTAMP.log"

# 日志函数
log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

# 记录部署元数据
log_meta() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] === $1 ===" >> "$LOG_FILE"
}

# 捕获错误
error_exit() {
    log "❌ 部署失败: $1"
    log_meta "部署失败"
    exit 1
}

START_TIME=$(date +%s)

log_meta "开始构建部署"
log "时间: $(date)"
log "日志文件: $LOG_FILE"

# 进入项目目录
cd "$PROJECT_DIR" || error_exit "无法进入项目目录"

# --- 1. 拉取最新代码 ---
log_meta "拉取代码"
log ">>> 拉取最新代码..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "当前分支: $CURRENT_BRANCH"

# 先 stash 本地修改防止 reset 丢失
if ! git diff --quiet || ! git diff --cached --quiet; then
    log "⚠️ 检测到本地未提交的修改，正在执行 stash 保存..."
    git stash push -m "deploy-auto-stash-$(date +%s)" 2>&1 | tee -a "$LOG_FILE" || true
fi

git fetch origin "$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"
git reset --hard "origin/$CURRENT_BRANCH" 2>&1 | tee -a "$LOG_FILE"

CHANGED_FILES=$(git diff --name-only HEAD~1..HEAD 2>/dev/null || echo "")
log "✅ 代码已更新 (commit: $(git log -1 --oneline))"
log "本次变更文件数: $(echo "$CHANGED_FILES" | wc -l)"

# --- 2. 检查哪些模块有变更 ---
NESTJS_CHANGED=false
CONTENT_CHANGED=false
CHATS_CHANGED=false
for file in $CHANGED_FILES; do
    case "$file" in
        apps/my-nestjs/*)    NESTJS_CHANGED=true  ;;
        apps/my-blog/src/content/*|apps/my-blog/src/pages/*|apps/my-blog/nuxt.config.ts) CONTENT_CHANGED=true ;;
        apps/my-chats/*)     CHATS_CHANGED=true   ;;
    esac
done

# --- 3. 安装依赖 ---
log_meta "安装依赖"
log ">>> 安装依赖..."
pnpm install --no-frozen-lockfile 2>&1 | tee -a "$LOG_FILE" || pnpm install 2>&1 | tee -a "$LOG_FILE"
log "✅ 依赖安装完成"

# --- 4. 构建 shared 包 ---
log_meta "构建共享包"
log ">>> 构建 shared 包..."
if ! pnpm --filter shared build 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "shared 包构建失败，中止部署（服务未受影响）"
fi
log "✅ shared 包构建完成"

# --- 构建结果跟踪 ---
BLOG_BUILD_OK=false
VITE_BUILD_OK=false
REACT_BUILD_OK=false
VUE2_BUILD_OK=false
NESTJS_BUILD_OK=false
CHATS_BUILD_OK=false

# --- 5. 构建各应用（串行执行，控制内存峰值）---
log_meta "构建 Blog (Nuxt SSR)"
log ">>> 构建 Blog..."
rm -rf "$PROJECT_DIR/apps/my-blog/.nuxt/content-cache" 2>/dev/null || true
# Nuxt SSR 构建是内存大户，用 NODE_OPTIONS 限制堆内存为 1.5G（防止 OOM）
cd "$PROJECT_DIR/apps/my-blog"
if NODE_OPTIONS="--max-old-space-size=1536" pnpm build 2>&1 | tee -a "$LOG_FILE"; then
    if [ -f "$PROJECT_DIR/apps/my-blog/.output/server/index.mjs" ]; then
        BLOG_BUILD_OK=true
        log "✅ Blog 构建完成"
    else
        log "❌ Blog 构建产物 .output/server/index.mjs 不存在，构建可能不完整"
    fi
else
    log "❌ Blog 构建失败"
fi

# Blog 是主站点，构建失败则中止（此时尚未停止任何服务，不会影响线上）
if [ "$BLOG_BUILD_OK" = false ]; then
    error_exit "Blog (主站点) 构建失败，中止部署（服务未受影响）"
fi

# 释放内存
sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
sleep 2

log_meta "构建 Vite 应用"
log ">>> 构建 Vite 应用..."
cd "$PROJECT_DIR/apps/my-vite-app"
if npx vite build --mode production 2>&1 | tee -a "$LOG_FILE"; then
    VITE_BUILD_OK=true
    log "✅ Vite 构建完成"
else
    log "⚠️ Vite 构建失败，将跳过 Vite 部署"
fi

log_meta "构建 React 应用"
log ">>> 构建 React 应用..."
cd "$PROJECT_DIR/apps/my-react-app"
if pnpm build 2>&1 | tee -a "$LOG_FILE"; then
    REACT_BUILD_OK=true
    log "✅ React 构建完成"
else
    log "⚠️ React 构建失败，将跳过 React 部署"
fi

log_meta "构建 Vue2 应用"
log ">>> 构建 Vue2 应用..."
cd "$PROJECT_DIR/apps/my-vue2-app"
if pnpm build 2>&1 | tee -a "$LOG_FILE"; then
    VUE2_BUILD_OK=true
    log "✅ Vue2 构建完成"
else
    log "⚠️ Vue2 构建失败，将跳过 Vue2 部署"
fi

# --- 6. 构建 NestJS 后端 ---
log_meta "构建 NestJS 后端"
log ">>> 构建 NestJS..."
cd "$PROJECT_DIR/apps/my-nestjs"
if [ "$NESTJS_CHANGED" = true ] || [ ! -d "dist" ]; then
    rm -rf dist
    if node_modules/.bin/nest build 2>&1 | tee -a "$LOG_FILE"; then
        NESTJS_BUILD_OK=true
        log "✅ NestJS 构建完成（重新构建）"
    else
        log "⚠️ NestJS 构建失败，将跳过 NestJS 重启（保持现有服务运行）"
    fi
else
    NESTJS_BUILD_OK=true
    log "⏩ NestJS 代码未变更，跳过构建"
fi

# --- 7. 部署前停止服务 ---
# 安全策略：只为构建成功的服务执行停机重启，构建失败的服务保持现状
log_meta "停止服务"
log ">>> 停止运行中的服务，准备部署..."

if [ "$BLOG_BUILD_OK" = true ] && pm2 show my-blog > /dev/null 2>&1; then
    pm2 stop my-blog 2>&1 | tee -a "$LOG_FILE"
    log "✅ my-blog (SSR) 已停止 (PM2)"
fi

if [ "$NESTJS_BUILD_OK" = true ] && pm2 show my-nestjs > /dev/null 2>&1; then
    pm2 stop my-nestjs 2>&1 | tee -a "$LOG_FILE"
    log "✅ my-nestjs 已停止 (PM2)"
elif [ "$NESTJS_BUILD_OK" = false ]; then
    log "⏩ NestJS 构建失败，跳过停止 my-nestjs（保持现有服务）"
fi

# 清理可能残留的裸进程（仅 Blog 相关）
if [ "$BLOG_BUILD_OK" = true ]; then
    pkill -f "node.*\.output/server/index\.mjs" 2>/dev/null || true
fi
sleep 2

# 验证端口已释放
for port in 3000 3101; do
    if ss -tlnp | grep -q ":$port "; then
        log "⚠️ 端口 $port 仍在占用，强制释放..."
        fuser -k "$port/tcp" 2>/dev/null || true
        sleep 2
    fi
done
log "✅ 端口已就绪"

# --- 8. 部署静态资源 ---
log_meta "部署文件"
log ">>> 部署文件..."

if [ "$VITE_BUILD_OK" = true ] && [ -d "$PROJECT_DIR/apps/my-vite-app/dist" ]; then
    rm -rf /usr/share/nginx/child/vite-dist/*
    cp -r "$PROJECT_DIR/apps/my-vite-app/dist/"* /usr/share/nginx/child/vite-dist/
    log "✅ Vite 已部署到 /usr/share/nginx/child/vite-dist"
else
    log "⏩ Vite 构建失败或无产物，跳过部署（保留现有文件）"
fi

if [ "$REACT_BUILD_OK" = true ] && [ -d "$PROJECT_DIR/apps/my-react-app/dist" ]; then
    rm -rf /usr/share/nginx/child/react-dist/*
    cp -r "$PROJECT_DIR/apps/my-react-app/dist/"* /usr/share/nginx/child/react-dist/
    log "✅ React 已部署到 /usr/share/nginx/child/react-dist"
else
    log "⏩ React 构建失败或无产物，跳过部署（保留现有文件）"
fi

if [ "$VUE2_BUILD_OK" = true ] && [ -d "$PROJECT_DIR/apps/my-vue2-app/dist" ]; then
    rm -rf /usr/share/nginx/child/vue2-dist/*
    cp -r "$PROJECT_DIR/apps/my-vue2-app/dist/"* /usr/share/nginx/child/vue2-dist/
    log "✅ Vue2 已部署到 /usr/share/nginx/child/vue2-dist"
else
    log "⏩ Vue2 构建失败或无产物，跳过部署（保留现有文件）"
fi

# --- 9. 重载 Nginx ---
log_meta "重载 Nginx"
log ">>> 重载 Nginx..."
/usr/sbin/nginx -s reload 2>&1 || true
log "✅ Nginx 已重载"

# --- 10. 部署主站点 .output ---
log_meta "部署主站点"
log ">>> 部署 .output 到 /usr/share/nginx/.output..."
if [ "$BLOG_BUILD_OK" = true ] && [ -d "$PROJECT_DIR/apps/my-blog/.output" ]; then
    rm -rf /usr/share/nginx/.output
    cp -r "$PROJECT_DIR/apps/my-blog/.output" /usr/share/nginx/.output
    chown -R nginx:nginx /usr/share/nginx/.output
    log "✅ 主站点已部署"
else
    error_exit "Blog 产物不存在，无法部署主站点"
fi


# --- 11. 启动 SSR 服务（PM2）---
log_meta "启动 SSR 服务"
log ">>> 启动 Nuxt SSR 服务 (PM2)..."

if pm2 show my-blog > /dev/null 2>&1; then
    pm2 restart my-blog --update-env 2>&1 | tee -a "$LOG_FILE"
else
    pm2 start /usr/share/nginx/.output/server/index.mjs \
        --name my-blog \
        --cwd /usr/share/nginx \
        -o /var/log/nuxt-ssr.log \
        -e /var/log/nuxt-ssr.log \
        2>&1 | tee -a "$LOG_FILE"
fi

# 等待 SSR 服务就绪（最多 30 秒）
log ">>> 等待 SSR 服务就绪..."
for i in $(seq 1 30); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200\|302\|301"; then
        log "✅ SSR 服务就绪 (端口 3000)"
        break
    fi
    if [ $i -eq 30 ]; then
        log "⚠️ SSR 服务启动超时，请检查日志: /var/log/nuxt-ssr.log"
    fi
    sleep 1
done

# --- 12. 启动 NestJS 后端 ---
if [ "$NESTJS_BUILD_OK" = true ]; then
    log_meta "部署 NestJS 后端"
    log ">>> 部署 NestJS 后端..."

    cd "$PROJECT_DIR/apps/my-nestjs"

    # 删除旧的 PM2 app，用正确的环境变量重新启动
    pm2 delete my-nestjs 2>/dev/null || true

    NODE_ENV=production DB_TYPE=mongodb PORT=3101 pm2 start dist/main.js \
        --name my-nestjs \
        -o /var/log/nestjs-out.log \
        -e /var/log/nestjs-err.log \
        --update-env \
        2>&1 | tee -a "$LOG_FILE"

    cd "$PROJECT_DIR"

    # 验证 NestJS 端口就绪
    log ">>> 等待 NestJS 服务就绪..."
    for i in $(seq 1 10); do
        if curl -s -o /dev/null http://localhost:3101/health 2>/dev/null; then
            log "✅ NestJS 服务就绪 (端口 3101)"
            break
        fi
        if [ $i -eq 10 ]; then
            log "❌ NestJS 服务启动失败！请检查日志: /var/log/nestjs-err.log"
        fi
        sleep 1
    done

    log "✅ NestJS 后端部署完成"
else
    log "⏩ NestJS 构建失败，跳过重启（保持现有服务运行）"
fi

# --- 部署 my-chats (Docker Compose，独立容器栈，与 PM2 服务完全隔离) ---
if [ "$CHATS_CHANGED" = true ]; then
    log_meta "部署 my-chats (Docker Compose)"
    log ">>> 构建 & 部署 my-chats (Docker)..."
    if [ ! -f "$PROJECT_DIR/apps/my-chats/server/.env" ]; then
        log "⚠️ apps/my-chats/server/.env 不存在，跳过 my-chats 部署（请先在服务器配置）"
    elif ! command -v docker >/dev/null 2>&1; then
        log "⚠️ 未安装 docker，跳过 my-chats 部署"
    else
        cd "$PROJECT_DIR/apps/my-chats/docker"
        if docker compose up -d --build 2>&1 | tee -a "$LOG_FILE"; then
            CHATS_BUILD_OK=true
            log "✅ my-chats 部署完成 (Docker Compose)"
        else
            log "⚠️ my-chats 构建失败，保持现有容器运行（其他站点不受影响）"
        fi
        cd "$PROJECT_DIR"
    fi
else
    CHATS_BUILD_OK=true
    log "⏩ my-chats 未变更，跳过 Docker 部署"
fi

# --- 13. 保存 PM2 配置快照 ---
pm2 save 2>&1 | tee -a "$LOG_FILE" || true
log "✅ PM2 配置已保存"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_meta "部署完成"
log "========== 部署完成 =========="
log "⏱️  耗时: $DURATION 秒"

log ""
log "📋 部署摘要:"
log "   Blog(SSR)  : $([ "$BLOG_BUILD_OK" = true ] && echo "✅ 已部署" || echo "❌ 跳过")"
log "   Vite      : $([ "$VITE_BUILD_OK" = true ] && echo "✅ 已部署" || echo "⚠️ 跳过")"
log "   React     : $([ "$REACT_BUILD_OK" = true ] && echo "✅ 已部署" || echo "⚠️ 跳过")"
log "   Vue2      : $([ "$VUE2_BUILD_OK" = true ] && echo "✅ 已部署" || echo "⚠️ 跳过")"
log "   NestJS    : $([ "$NESTJS_BUILD_OK" = true ] && echo "✅ 已部署" || echo "⚠️ 跳过")"
log "   my-chats  : $([ "$CHATS_BUILD_OK" = true ] && echo "✅ 已部署" || echo "⚠️ 跳过")"
log ""
log "   博客(SSR)  : http://localhost:3000  (PM2: my-blog)"
log "   Vite       : /usr/share/nginx/child/vite-dist"
log "   React      : /usr/share/nginx/child/react-dist"
log "   Vue2       : /usr/share/nginx/child/vue2-dist"
log "   NestJS     : http://localhost:3101  (PM2: my-nestjs)"
log "   my-chats   : http://localhost:3201  (Docker Compose，对外 chat.tongxingkuan.xin)"

INDEX_FILE="$DEPLOY_LOG_DIR/deploy_index.txt"
echo "$(date '+%Y-%m-%d %H:%M:%S') | 耗时: ${DURATION}s | commit: $(git log -1 --oneline) | 日志: $LOG_FILE" >> "$INDEX_FILE"

find "$DEPLOY_LOG_DIR" -name "deploy_*.log" -mtime +30 -delete
tail -100 "$INDEX_FILE" > "$INDEX_FILE.tmp" && mv "$INDEX_FILE.tmp" "$INDEX_FILE"

echo ""
log "✅ 部署完成！日志: $LOG_FILE"