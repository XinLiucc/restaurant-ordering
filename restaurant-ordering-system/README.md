# 餐厅点餐系统

基于微信小程序的餐厅点餐系统，采用前后端分离架构，支持用户点餐和管理员后台管理。

## 🚀 快速开始

### 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### 1. 克隆项目并进入目录

```bash
git clone <your-repository-url>
cd restaurant-ordering-system
```

### 2. 配置环境变量

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量文件
vim .env
```

**重要配置项说明：**

- `MYSQL_ROOT_PASSWORD`: MySQL root密码（建议修改）
- `MYSQL_PASSWORD`: 应用数据库密码（建议修改）
- `SESSION_SECRET`: Session密钥（必须修改）
- `WECHAT_APP_ID`: 微信小程序AppID
- `WECHAT_APP_SECRET`: 微信小程序AppSecret

### 3. 启动服务

```bash
# 启动MySQL数据库服务
docker-compose up -d mysql

# 等待数据库启动完成（约1-2分钟）
docker-compose logs -f mysql

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 4. 验证服务

服务启动后，可以通过以下地址访问：

- **管理后台**: http://localhost:8080/admin
- **API文档**: http://localhost:3000/api-docs （开发环境）
- **API基础地址**: http://localhost:3000/api
- **数据库**: localhost:3306

**默认管理员账号**:
- 用户名: admin
- 密码: admin123

## 📁 项目结构

```
restaurant-ordering-system/
├── backend/                    # Node.js后端服务
│   ├── src/
│   │   ├── controllers/        # 控制器层
│   │   ├── models/             # 数据模型
│   │   ├── routes/             # 路由配置
│   │   ├── middleware/         # 中间件
│   │   ├── config/             # 配置文件
│   │   └── utils/              # 工具函数
│   ├── uploads/                # 文件上传目录
│   └── logs/                   # 日志目录
├── miniprogram/                # 微信小程序
├── admin-web/                  # Vue.js管理后台
├── mysql/                      # MySQL配置
├── nginx/                      # Nginx配置
└── docker-compose.yml          # Docker编排文件
```

## 🛠️ 开发指南

### 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务
npm run dev

# 查看日志
docker-compose logs -f backend
```

### 前端管理后台开发

```bash
# 进入前端目录
cd admin-web

# 安装依赖
npm install

# 启动开发服务
npm run serve

# 构建生产版本
npm run build
```

### 微信小程序开发

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 配置AppID和AppSecret
3. 修改API基础地址为后端服务地址

## 🗄️ 数据库管理

### 连接数据库

```bash
# 使用Docker连接
docker-compose exec mysql mysql -uroot -p

# 使用外部工具连接
# 地址: localhost:3306
# 用户: restaurant_user
# 密码: 见.env文件中的MYSQL_PASSWORD
# 数据库: restaurant_db
```

### 重置数据库

```bash
# 停止服务
docker-compose down

# 删除数据卷
docker volume rm restaurant-ordering-system_mysql_data

# 重新启动
docker-compose up -d
```

## 📊 API接口

### 认证相关

- `POST /api/auth/wechat-login` - 微信登录
- `POST /api/auth/admin-login` - 管理员登录
- `GET /api/auth/profile` - 获取用户信息
- `POST /api/auth/logout` - 退出登录

### 菜品管理

- `GET /api/categories` - 获取分类列表
- `GET /api/dishes` - 获取菜品列表
- `POST /api/dishes` - 创建菜品（管理员）
- `PUT /api/dishes/:id` - 更新菜品（管理员）

### 订单管理

- `POST /api/orders` - 创建订单
- `GET /api/orders/my` - 获取我的订单
- `GET /api/orders` - 获取所有订单（管理员）
- `PUT /api/orders/:id/status` - 更新订单状态（管理员）

## 🚧 运维管理

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f admin
```

### 备份数据

```bash
# 数据库备份
docker-compose exec mysql mysqldump -uroot -p${MYSQL_ROOT_PASSWORD} restaurant_db > backup.sql

# 文件备份
tar -czf uploads_backup.tar.gz backend/uploads/
```

### 服务重启

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart mysql
```

### 服务停止

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 🔧 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL容器是否启动: `docker-compose ps`
   - 查看MySQL日志: `docker-compose logs mysql`
   - 确认密码配置正确

2. **后端服务启动失败**
   - 检查端口3000是否被占用
   - 查看后端日志: `docker-compose logs backend`
   - 确认数据库连接配置

3. **文件上传失败**
   - 检查uploads目录权限
   - 确认磁盘空间充足
   - 查看Nginx配置

4. **前端访问失败**
   - 检查端口8080是否被占用
   - 确认Nginx配置正确
   - 查看Nginx日志

### 性能优化

1. **数据库优化**
   - 调整MySQL配置文件 `mysql/conf/my.cnf`
   - 添加适当的索引
   - 定期清理过期数据

2. **应用优化**
   - 启用Redis缓存（可选）
   - 优化数据库查询
   - 压缩静态资源

## 📝 开发计划

项目按照六个步骤进行开发：

1. ✅ **环境配置和Docker部署**
2. 🔄 **后端原型开发** (进行中)
3. ⏳ **用户认证系统**
4. ⏳ **菜品管理系统**
5. ⏳ **订单管理系统**
6. ⏳ **支付和统计系统**

## 🤝 贡献指南

1. Fork本项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您在使用过程中遇到问题，可以：

1. 查看 [故障排除](#故障排除) 部分
2. 提交 [Issue](../../issues)
3. 联系开发团队

## 🔄 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新信息。