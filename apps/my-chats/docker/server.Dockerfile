# server 构建镜像（context = 仓库根）
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter my-chats-server build
# pnpm deploy 生成自包含产物（含 prod 依赖）
RUN pnpm --filter my-chats-server deploy --legacy --prod /deploy

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
EXPOSE 3200
CMD ["node", "dist/main.js"]
