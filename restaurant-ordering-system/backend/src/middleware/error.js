const { ValidationError } = require('sequelize');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 默认错误响应
  let error = {
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
    status: 500
  };

  // Sequelize验证错误
  if (err instanceof ValidationError) {
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.message = '数据验证失败';
    error.details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }
  
  // Joi验证错误
  else if (err.isJoi) {
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    error.message = '请求参数验证失败';
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }
  
  // 数据库连接错误
  else if (err.name === 'SequelizeConnectionError') {
    error.status = 500;
    error.code = 'DATABASE_ERROR';
    error.message = '数据库连接失败';
  }
  
  // 数据库唯一约束错误
  else if (err.name === 'SequelizeUniqueConstraintError') {
    error.status = 400;
    error.code = 'DUPLICATE_ERROR';
    error.message = '数据已存在';
    error.details = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} 已存在`
    }));
  }
  
  // 外键约束错误
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.status = 400;
    error.code = 'FOREIGN_KEY_ERROR';
    error.message = '关联数据不存在';
  }
  
  // 语法错误
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.status = 400;
    error.code = 'JSON_PARSE_ERROR';
    error.message = 'JSON格式错误';
  }
  
  // 自定义业务错误
  else if (err.isCustomError) {
    error.status = err.status || 400;
    error.code = err.code || 'BUSINESS_ERROR';
    error.message = err.message;
    error.details = err.details;
  }
  
  // 文件上传错误
  else if (err.code === 'LIMIT_FILE_SIZE') {
    error.status = 400;
    error.code = 'FILE_TOO_LARGE';
    error.message = '文件大小超出限制';
  }
  
  // JWT错误
  else if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.code = 'INVALID_TOKEN';
    error.message = '无效的令牌';
  }
  
  else if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.code = 'TOKEN_EXPIRED';
    error.message = '令牌已过期';
  }
  
  // 权限错误
  else if (err.message === 'Forbidden') {
    error.status = 403;
    error.code = 'FORBIDDEN';
    error.message = '权限不足';
  }
  
  // 404错误
  else if (err.status === 404) {
    error.status = 404;
    error.code = 'NOT_FOUND';
    error.message = err.message || '资源不存在';
  }
  
  // 开发环境显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.originalError = err.message;
  }

  // 发送错误响应
  res.status(error.status).json(error);
};

/**
 * 创建自定义错误
 */
class CustomError extends Error {
  constructor(message, status = 400, code = 'CUSTOM_ERROR', details = null) {
    super(message);
    this.isCustomError = true;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * 异步错误处理包装器
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404错误处理
 */
const notFound = (req, res, next) => {
  const error = new CustomError(`路径 ${req.originalUrl} 不存在`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  errorHandler,
  CustomError,
  asyncHandler,
  notFound
};