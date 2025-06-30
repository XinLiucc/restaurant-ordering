const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 导入配置
const sessionConfig = require('./config/session');
// const { sequelize } = require('./models');
const { sequelize, testConnection, syncDatabase } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error');
const { ensureUploadDir } = require('./middleware/upload');

// 导入路由
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const statisticsRoutes = require('./routes/statistics');
const notificationRoutes = require('./routes/notification');
const uploadRoutes = require('./routes/upload');

// 导入中间件
const { validateRequest } = require('./middleware/validation');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// ===== 静态文件服务 =====

// 确保上传目录存在
ensureUploadDir(path.join(__dirname, 'uploads/images'));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d', // 缓存7天
  etag: true,
  lastModified: true
}));


// ===== 基础中间件配置 =====

// 信任代理（如果使用nginx等反向代理）
app.set('trust proxy', 1);

// 安全头配置
app.use(helmet({
  contentSecurityPolicy: false, // 微信小程序需要
  crossOriginEmbedderPolicy: false
}));

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      process.env.WEB_BASE_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不被CORS政策允许'));
    }
  },
  credentials: true, // 允许携带cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// 请求体解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 速率限制配置 =====

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 认证接口限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // 开发环境放宽
  message: {
    success: false,
    message: '登录尝试次数过多，请稍后再试'
  },
  skipSuccessfulRequests: true
});

app.use(globalLimiter);

// 上传接口限流
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次上传
  message: {
    success: false,
    message: '上传频率过高，请稍后再试',
    code: 'UPLOAD_RATE_EXCEEDED'
  }
});

// 开发环境跳过速率限制
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/auth', authLimiter);
}

// ===== Session配置 =====

// 创建MySQL session存储
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

const sessionOptions = {
  key: 'restaurant_session',
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    httpOnly: true,               // 防XSS攻击
    secure: process.env.NODE_ENV === 'production', // HTTPS环境
    sameSite: 'lax'              // CSRF防护
  },
  rolling: true,  // 每次请求重新设置过期时间
  name: 'restaurant.sid'
};

// 使用MySQL session存储
app.use(session(sessionOptions));

// ===== 请求日志中间件 =====
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// ===== 健康检查端点 =====
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: 'connected' // 这里可以添加实际的数据库连接检查
  });
});

// ===== API路由挂载 =====
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', orderRoutes.cart);
app.use('/api/orders', orderRoutes.orders);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// ===== 根路径处理 =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '餐厅点餐系统API服务',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      menu: '/api/categories, /api/dishes',
      orders: '/api/orders',
      payments: '/api/payments'
    }
  });
});

// ===== 404处理 =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路径 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// ===== 全局错误处理中间件 =====
app.use(errorHandler);

// ===== 数据库连接和服务启动 =====
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库模型同步完成');
    }
    
    // 启动服务器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器启动成功`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 端口: ${PORT}`);
      console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📚 API文档: http://localhost:${PORT}/`);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('📴 收到SIGTERM信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 收到SIGINT信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;