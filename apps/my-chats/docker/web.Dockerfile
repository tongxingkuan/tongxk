# web 构建镜像（context = 仓库根）
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter my-chats-web build

FROM nginx:alpine AS runtime
COPY --from=build /repo/apps/my-chats/web/dist /usr/share/nginx/html
COPY apps/my-chats/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
