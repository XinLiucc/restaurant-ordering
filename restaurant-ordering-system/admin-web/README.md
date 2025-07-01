# 餐厅管理平台

基于 Vue 3 + Vite + Element Plus 的餐厅管理系统

## 功能特性

- 🔐 管理员认证系统
- 📊 数据统计仪表板  
- 🍽️ 菜单分类管理
- 📝 订单处理系统
- 💰 支付记录查看
- 📁 文件上传管理
- 🔔 通知系统

## 开发环境

- Node.js 16+
- Vue 3.4+
- Vite 5.0+
- Element Plus 2.4+

## 快速开始

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本
\`\`\`bash
npm run build
\`\`\`

### 预览生产版本
\`\`\`bash
npm run preview
\`\`\`

## 目录结构

- \`src/views/\` - 页面组件
- \`src/components/\` - 通用组件
- \`src/api/\` - API 接口
- \`src/utils/\` - 工具函数
- \`src/stores/\` - 状态管理
- \`src/router/\` - 路由配置

## API 接口

后端 API 地址: http://localhost:3000/api

详细接口文档请参考 API 文档。
```

## 安装和运行步骤

### 1. 创建项目并安装依赖
```bash
# 创建项目目录
mkdir restaurant-admin
cd restaurant-admin

# 复制 package.json 后安装依赖
npm install
```

### 2. 创建基本文件结构
```bash
# 创建目录
mkdir -p src/{views,components/{common,layout},api,utils,stores,assets/{styles,images},router,composables}
mkdir public

# 创建基本文件
touch src/main.js src/App.vue
touch src/views/{Login.vue,Dashboard.vue,Layout.vue}
touch src/components/common/{Loading.vue,Toast.vue}
touch src/components/layout/{Sidebar.vue,Header.vue,Footer.vue}
touch src/api/{index.js,auth.js,menu.js,order.js,upload.js}
touch src/utils/{request.js,auth.js,constants.js}
touch src/stores/{index.js,auth.js,app.js}
touch src/router/index.js
touch src/composables/useAuth.js
touch src/assets/styles/{main.css,variables.css,components.css}
```

### 3. 启动开发服务器
```bash
npm run dev