# 餐厅点餐系统

基于微信小程序的现代化餐厅点餐系统，采用前后端分离架构，支持用户移动端点餐和管理员后台管理。

## 🚀 项目特色

- 🎯 **微信小程序** - 原生小程序用户体验，支持微信一键登录
- 🛒 **智能购物车** - 一键下单，支持购物车管理和批量操作
- 💳 **模拟支付** - 完整支付流程，支持微信支付、支付宝、现金支付
- 📊 **数据统计** - 实时销售数据、菜品排行、收入分析
- 🔔 **消息通知** - 订单状态实时推送，系统通知管理
- 🎨 **响应式后台** - Vue.js管理后台，支持菜品、订单、统计管理
- 🐳 **容器化部署** - Docker一键部署，支持阿里云等云平台

## 📋 系统架构

```
微信小程序端 ←→ Express API Server ←→ MySQL
管理Web端   ←→ Express API Server ←→ MySQL
```

### 技术栈

**后端技术栈**
- Node.js 18+ 
- Express.js Web框架
- MySQL 8.0 数据库
- Sequelize ORM
- Session认证
- Multer文件上传

**前端技术栈**
- 微信小程序原生开发
- Vue.js 3 管理后台
- Tailwind CSS 样式框架

**部署技术栈**
- Docker & Docker Compose
- Nginx 反向代理
- MySQL 数据持久化
- 阿里云服务器部署

## 🏗️ 项目结构

```
restaurant-ordering-system/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── controllers/        # 控制器层
│   │   │   ├── auth.js         # 认证控制器
│   │   │   ├── menu.js         # 菜品管理
│   │   │   ├── cart.js         # 购物车
│   │   │   ├── order.js        # 订单管理
│   │   │   ├── payment.js      # 支付系统
│   │   │   ├── statistics.js   # 统计报表
│   │   │   ├── notification.js # 通知系统
│   │   │   └── upload.js       # 文件上传
│   │   ├── models/             # 数据模型
│   │   │   ├── User.js         # 用户模型
│   │   │   ├── Category.js     # 分类模型
│   │   │   ├── Dish.js         # 菜品模型
│   │   │   ├── Order.js        # 订单模型
│   │   │   ├── OrderItem.js    # 订单项
│   │   │   ├── Payment.js      # 支付记录
│   │   │   └── Notification.js # 通知模型
│   │   ├── routes/             # 路由配置
│   │   ├── middleware/         # 中间件
│   │   ├── config/             # 配置文件
│   │   ├── utils/              # 工具函数
│   │   └── app.js              # 应用入口
│   ├── uploads/                # 文件上传目录
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── miniprogram/                # 微信小程序（计划中）
├── admin-web/                  # 管理后台（计划中）
├── mysql/                      # MySQL配置
│   ├── init/                   # 初始化脚本
│   └── conf/                   # 配置文件
├── nginx/                      # Nginx配置
├── docker-compose.yml          # Docker编排
└── README.md
```

## ⚡ 快速开始

### 前置要求

- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (本地开发)

### 🔧 环境配置

1. **克隆项目**
```bash
git clone https://github.com/XinLiucc/restaurant-ordering.git
cd restaurant-ordering
```

2. **环境变量配置**
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=restaurant_db
DB_USER=root
DB_PASSWORD=your_password

# 应用配置
NODE_ENV=development
PORT=3000
SESSION_SECRET=your_session_secret

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

### 🏃‍♂️ 本地开发

**方式一：Docker 部署（推荐）**
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

**方式二：本地开发**
```bash
# 安装依赖
cd backend
npm install

# 启动开发服务器
npm run dev
```

### 🌐 访问地址

- API服务: http://localhost:3000
- 健康检查: http://localhost:3000/api/health
- 管理后台: http://localhost:8080 (计划中)
- API文档: http://localhost:3000/

## 📱 功能特性

### 🔐 用户认证系统
- **微信登录** - OAuth2.0微信小程序登录
- **管理员登录** - 用户名密码登录
- **Session管理** - 24小时自动延期
- **权限控制** - 角色基础权限管理
- **开发工具** - 模拟登录（开发环境）

### 🍽️ 菜品管理系统
- **分类管理** - 菜品分类增删改查
- **菜品管理** - 菜品信息、价格、图片管理
- **状态控制** - 上架/下架状态管理
- **批量操作** - 批量更新菜品状态
- **图片上传** - 支持菜品图片上传和管理

### 🛒 订单管理系统
- **购物车** - 添加、修改、删除商品
- **一键下单** - 从购物车直接生成订单
- **订单流程** - 待确认→已确认→制作中→已完成
- **订单查询** - 支持状态、时间范围筛选
- **批量操作** - 批量更新订单状态

### 💳 支付系统
- **多种支付** - 微信支付、支付宝、现金支付
- **模拟支付** - 开发环境支持模拟支付成功/失败
- **支付回调** - 支付结果异步通知处理
- **退款功能** - 支持订单退款操作
- **支付统计** - 支付方式、成功率统计

### 📊 统计报表系统
- **数据概览** - 今日订单、收入、用户等关键指标
- **销售统计** - 按时间段统计销售数据
- **菜品分析** - 菜品销售排行、分类统计
- **趋势分析** - 销售趋势图表分析
- **用户统计** - 用户注册、活跃度分析

### 🔔 通知系统
- **消息推送** - 订单状态变更通知
- **系统通知** - 管理员发送系统消息
- **批量通知** - 批量发送给多个用户
- **已读管理** - 通知已读状态管理

## 🗄️ 数据库设计

### 核心数据表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| users | 用户表 | id, openid, nickName, role, phone |
| categories | 菜品分类 | id, name, status, sortOrder |
| dishes | 菜品表 | id, name, price, categoryId, status |
| orders | 订单表 | id, orderNo, userId, totalAmount, status |
| order_items | 订单项 | id, orderId, dishId, quantity, subtotal |
| payments | 支付记录 | id, paymentNo, orderId, amount, status |
| notifications | 通知表 | id, title, content, type, targetType |

### 数据库关系图
```
users (1:N) orders (1:N) order_items (N:1) dishes (N:1) categories
orders (1:N) payments
users (1:N) notifications
```

## 🌐 API 接口文档

### 认证接口
```
POST /api/auth/wechat-login      # 微信登录
POST /api/auth/admin-login       # 管理员登录
GET  /api/auth/profile           # 获取用户信息
POST /api/auth/logout            # 退出登录
```

### 菜品接口
```
GET    /api/menu/categories              # 获取分类列表
POST   /api/menu/categories              # 创建分类 [管理员]
GET    /api/menu/dishes                  # 获取菜品列表
POST   /api/menu/dishes                  # 创建菜品 [管理员]
PUT    /api/menu/dishes/:id              # 更新菜品 [管理员]
```

### 购物车接口
```
GET    /api/cart                         # 获取购物车
POST   /api/cart/add                     # 添加到购物车
PUT    /api/cart/update                  # 更新购物车
DELETE /api/cart/clear                   # 清空购物车
```

### 订单接口
```
POST   /api/orders/from-cart             # 从购物车创建订单
GET    /api/orders/my                    # 获取我的订单
GET    /api/orders                       # 获取所有订单 [管理员]
PUT    /api/orders/:id/status            # 更新订单状态 [管理员]
```

### 支付接口
```
POST   /api/payments/create              # 创建支付订单
GET    /api/payments/:id                 # 查询支付状态
POST   /api/payments/notify              # 支付回调通知
```

### 统计接口
```
GET    /api/statistics/overview          # 数据概览 [管理员]
GET    /api/statistics/sales             # 销售统计 [管理员]
GET    /api/statistics/dishes            # 菜品统计 [管理员]
```

> 更多API详情请参考代码中的路由文件

## 🚀 部署指南

### Docker 部署

1. **准备环境**
```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com | bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **配置环境变量**
```bash
# 复制并修改环境变量
cp .env.example .env
# 编辑配置
vim .env
```

3. **启动服务**
```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

### 阿里云部署

适合2核2G配置的优化部署：

```bash
# 1. 安装Docker环境
# 2. 克隆项目代码
git clone https://github.com/XinLiucc/restaurant-ordering.git
cd restaurant-ordering

# 3. 配置生产环境变量
cp .env.example .env
# 修改数据库密码、Session密钥等

# 4. 启动服务
docker-compose -f docker-compose.yml up -d

# 5. 配置Nginx（可选）
# 参考 nginx/nginx.conf
```

### 环境要求

**最低配置**
- CPU: 2核
- 内存: 2GB
- 硬盘: 40GB
- 网络: 1Mbps

**推荐配置**
- CPU: 4核
- 内存: 4GB
- 硬盘: 100GB
- 网络: 5Mbps

## 🧪 开发工具

### 模拟登录（开发环境）
```bash
# 模拟微信用户登录
curl -X POST http://localhost:3000/api/auth/mock-wechat-login \
  -H "Content-Type: application/json" \
  -d '{"mode": "create", "nickName": "测试用户"}'

# 创建管理员账户
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "nickName": "管理员"}'
```

### 数据库管理
```bash
# 进入MySQL容器
docker exec -it restaurant_mysql mysql -uroot -p

# 查看表结构
USE restaurant_db;
SHOW TABLES;
DESCRIBE users;
```

### 日志查看
```bash
# 查看应用日志
docker-compose logs -f backend

# 查看MySQL日志
docker-compose logs -f mysql

# 查看Nginx日志
docker-compose logs -f nginx
```

## 🔧 性能优化

### 数据库优化
- MySQL连接池配置（最大10个连接）
- 关键字段索引优化
- 查询语句优化
- 定期数据清理

### 应用优化
- Session存储优化（MySQL存储）
- 图片压缩和CDN
- API接口缓存
- 请求频率限制

### 服务器优化
- Nginx静态文件缓存
- Gzip压缩
- HTTP/2支持
- SSL证书配置

## 📈 监控和运维

### 健康检查
```bash
# API健康检查
curl http://localhost:3000/api/health

# 数据库连接检查
curl http://localhost:3000/api/statistics/overview
```

### 备份策略
```bash
# 数据库备份
docker exec restaurant_mysql mysqldump -uroot -p restaurant_db > backup.sql

# 文件备份
tar -czf uploads_backup.tar.gz ./backend/uploads/
```

### 监控脚本
参考项目中的监控脚本：
- `monitor.sh` - 服务状态监控
- `backup.sh` - 自动备份脚本
- `cleanup.sh` - 日志清理脚本

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范
- 使用ESLint代码规范
- 提交信息遵循Conventional Commits
- 添加适当的单元测试
- 更新相关文档

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系作者

- GitHub: [@XinLiucc](https://github.com/XinLiucc)
- 项目链接: [https://github.com/XinLiucc/restaurant-ordering](https://github.com/XinLiucc/restaurant-ordering)

## 🙏 致谢

感谢以下开源项目的支持：
- [Express.js](https://expressjs.com/) - Web应用框架
- [Sequelize](https://sequelize.org/) - Node.js ORM
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [MySQL](https://www.mysql.com/) - 关系型数据库
- [Docker](https://www.docker.com/) - 容器化平台

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！