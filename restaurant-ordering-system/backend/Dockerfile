# Node.js 后端服务 Dockerfile

# 使用官方Node.js 18 Alpine镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖（用于某些npm包的编译）
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装npm依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用源代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads logs

# 设置权限
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001 \
    && chown -R nodeuser:nodejs /app

# 切换到非root用户
USER nodeuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["npm", "start"]