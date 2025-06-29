const { unauthorized, forbidden } = require('../utils/response');

/**
 * 用户角色和权限定义
 */
const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};

const PERMISSIONS = {
  CUSTOMER: [
    'view_menu',
    'manage_cart', 
    'create_order',
    'view_own_orders',
    'cancel_own_order',
    'view_own_profile'
  ],
  ADMIN: [
    'manage_categories',
    'manage_dishes',
    'manage_all_orders',
    'update_order_status',
    'view_statistics',
    'manage_users',
    'send_notifications'
  ]
};

/**
 * 认证中间件
 */
const auth = {
  /**
   * 基础认证 - 检查用户是否登录
   */
  requireAuth: (req, res, next) => {
    if (!req.session || !req.session.user) {
      return unauthorized(res, '请先登录');
    }
    
    // 检查用户状态
    if (req.session.user.status === 'inactive') {
      return forbidden(res, '账户已被禁用');
    }
    
    next();
  },

  /**
   * 管理员权限验证
   */
  requireAdmin: (req, res, next) => {
    if (!req.session || !req.session.user) {
      return unauthorized(res, '请先登录');
    }
    
    if (req.session.user.role !== USER_ROLES.ADMIN) {
      return forbidden(res, '需要管理员权限');
    }
    
    next();
  },

  /**
   * 特定权限验证
   */
  requirePermission: (permission) => {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        return unauthorized(res, '请先登录');
      }

      const userRole = req.session.user.role;
      const rolePermissions = PERMISSIONS[userRole.toUpperCase()] || [];
      
      if (!rolePermissions.includes(permission)) {
        return forbidden(res, `需要 ${permission} 权限`);
      }
      
      next();
    };
  },

  /**
   * 用户身份验证 - 只能操作自己的数据或管理员
   */
  requireSelfOrAdmin: (req, res, next) => {
    if (!req.session || !req.session.user) {
      return unauthorized(res, '请先登录');
    }

    const currentUser = req.session.user;
    const targetUserId = req.params.userId || req.body.userId || req.params.id;
    
    // 管理员可以操作任何数据
    if (currentUser.role === USER_ROLES.ADMIN) {
      return next();
    }
    
    // 普通用户只能操作自己的数据
    if (currentUser.id == targetUserId) {
      return next();
    }
    
    return forbidden(res, '只能操作自己的数据');
  },

  /**
   * 可选认证 - 登录则添加用户信息，未登录也可以继续
   */
  optionalAuth: (req, res, next) => {
    // 无论是否登录都继续执行
    next();
  },

  /**
   * 角色验证
   */
  requireRole: (role) => {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        return unauthorized(res, '请先登录');
      }

      if (req.session.user.role !== role) {
        return forbidden(res, `需要 ${role} 角色权限`);
      }

      next();
    };
  }
};

module.exports = {
  auth,
  USER_ROLES,
  PERMISSIONS
};