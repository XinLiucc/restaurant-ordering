/**
 * 统一响应格式工具函数
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 返回数据
 * @param {string} message - 成功消息
 * @param {number} status - HTTP状态码
 */
const success = (res, data = null, message = '操作成功', status = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(status).json(response);
};

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} status - HTTP状态码
 * @param {string} code - 错误代码
 * @param {*} details - 错误详情
 */
const error = (res, message = '操作失败', status = 400, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString()
  };

  if (details !== null) {
    response.details = details;
  }

  return res.status(status).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} items - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 消息
 */
const paginated = (res, items, pagination, message = '获取成功') => {
  const response = {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page: parseInt(pagination.page) || 1,
        limit: parseInt(pagination.limit) || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      }
    },
    timestamp: new Date().toISOString()
  };

  return res.status(200).json(response);
};

/**
 * 创建响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 创建的数据
 * @param {string} message - 成功消息
 */
const created = (res, data = null, message = '创建成功') => {
  return success(res, data, message, 201);
};

/**
 * 无内容响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 消息
 */
const noContent = (res, message = '操作成功') => {
  return success(res, null, message, 204);
};

/**
 * 未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const notFound = (res, message = '资源不存在') => {
  return error(res, message, 404, 'NOT_FOUND');
};

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const unauthorized = (res, message = '未授权') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const forbidden = (res, message = '权限不足') => {
  return error(res, message, 403, 'FORBIDDEN');
};

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {*} details - 验证错误详情
 * @param {string} message - 错误消息
 */
const validationError = (res, details, message = '数据验证失败') => {
  return error(res, message, 400, 'VALIDATION_ERROR', details);
};

/**
 * 服务器内部错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const serverError = (res, message = '服务器内部错误') => {
  return error(res, message, 500, 'INTERNAL_SERVER_ERROR');
};

/**
 * 冲突响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const conflict = (res, message = '资源冲突') => {
  return error(res, message, 409, 'CONFLICT');
};

/**
 * 请求过多响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
const tooManyRequests = (res, message = '请求过于频繁') => {
  return error(res, message, 429, 'TOO_MANY_REQUESTS');
};

/**
 * 生成分页信息
 * @param {number} page - 当前页码
 * @param {number} limit - 每页数量
 * @param {number} total - 总记录数
 */
const generatePagination = (page = 1, limit = 10, total = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const pageSize = Math.max(1, parseInt(limit));
  const totalRecords = Math.max(0, parseInt(total));
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    page: currentPage,
    limit: pageSize,
    total: totalRecords,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    offset: (currentPage - 1) * pageSize
  };
};

/**
 * 格式化用户信息（隐藏敏感信息）
 * @param {Object} user - 用户对象
 */
const formatUser = (user) => {
  if (!user) return null;
  
  const { password, ...safeUser } = user.toJSON ? user.toJSON() : user;
  return safeUser;
};

/**
 * 格式化用户列表
 * @param {Array} users - 用户列表
 */
const formatUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(formatUser);
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError,
  conflict,
  tooManyRequests,
  generatePagination,
  formatUser,
  formatUsers
};