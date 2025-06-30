// routes/notification.js - 完整的通知路由实现
const express = require('express');
const NotificationController = require('../controllers/notification');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 创建路由实例
const router = express.Router();

// ===== 验证模式 =====

const notificationQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  type: Joi.string()
    .valid('order', 'payment', 'system')
    .optional()
    .messages({
      'any.only': '通知类型必须是 order、payment 或 system'
    }),
  isRead: Joi.string()
    .valid('true', 'false')
    .optional(),
  targetType: Joi.string()
    .valid('user', 'admin', 'all')
    .optional()
    .messages({
      'any.only': '目标类型必须是 user、admin 或 all'
    }),
  targetId: Joi.number()
    .integer()
    .positive()
    .optional()
});

const sendNotificationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '通知标题不能为空',
      'string.min': '通知标题至少1个字符',
      'string.max': '通知标题不能超过100个字符',
      'any.required': '通知标题是必填项'
    }),
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': '通知内容不能为空',
      'string.min': '通知内容至少1个字符',
      'string.max': '通知内容不能超过1000个字符',
      'any.required': '通知内容是必填项'
    }),
  type: Joi.string()
    .valid('order', 'payment', 'system')
    .required()
    .messages({
      'any.only': '通知类型必须是 order、payment 或 system',
      'any.required': '通知类型是必填项'
    }),
  targetType: Joi.string()
    .valid('user', 'admin', 'all')
    .required()
    .messages({
      'any.only': '目标类型必须是 user、admin 或 all',
      'any.required': '目标类型是必填项'
    }),
  targetId: Joi.number()
    .integer()
    .positive()
    .when('targetType', {
      is: 'user',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'number.positive': '用户ID必须大于0',
      'any.required': '指定用户时用户ID是必填项',
      'any.unknown': '非用户类型通知不能指定用户ID'
    })
});

const batchSendSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),
  content: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required(),
  type: Joi.string()
    .valid('order', 'payment', 'system')
    .required(),
  userIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': '至少选择一个用户',
      'array.max': '单次最多发送给100个用户',
      'any.required': '用户ID列表是必填项'
    })
});

const markAllReadSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.number().integer().positive())
    .optional()
    .messages({
      'array.base': '通知ID列表必须是数组'
    })
});

const batchDeleteSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少选择一条通知',
      'array.max': '单次最多删除50条通知',
      'any.required': '通知ID列表是必填项'
    })
});

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.positive': 'ID必须大于0',
      'any.required': 'ID是必填项'
    })
});

const statsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month')
    .default('month')
});

// ===== 通知路由 =====

/**
 * 获取通知列表
 * GET /api/notifications
 * Query: page, limit, type, isRead, targetType, targetId
 */
router.get('/',
  auth.requireAuth,
  validate(notificationQuerySchema, 'query'),
  NotificationController.getNotifications
);

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
router.get('/unread-count',
  auth.requireAuth,
  NotificationController.getUnreadCount
);

/**
 * 获取通知统计（管理员）
 * GET /api/notifications/stats
 * Query: period
 */
router.get('/stats',
  auth.requireAdmin,
  validate(statsQuerySchema, 'query'),
  NotificationController.getNotificationStats
);

/**
 * 发送通知（管理员）
 * POST /api/notifications
 */
router.post('/',
  auth.requireAdmin,
  validate(sendNotificationSchema),
  NotificationController.sendNotification
);

/**
 * 批量发送通知（管理员）
 * POST /api/notifications/batch
 */
router.post('/batch',
  auth.requireAdmin,
  validate(batchSendSchema),
  NotificationController.batchSendNotification
);

/**
 * 批量标记已读
 * PUT /api/notifications/read-all
 */
router.put('/read-all',
  auth.requireAuth,
  validate(markAllReadSchema),
  NotificationController.markAllAsRead
);

/**
 * 批量删除通知
 * DELETE /api/notifications/batch
 */
router.delete('/batch',
  auth.requireAuth,
  validate(batchDeleteSchema),
  NotificationController.batchDeleteNotifications
);

/**
 * 获取通知详情
 * GET /api/notifications/:id
 */
router.get('/:id',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  NotificationController.getNotificationDetail
);

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  NotificationController.markAsRead
);

/**
 * 删除通知
 * DELETE /api/notifications/:id
 */
router.delete('/:id',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  NotificationController.deleteNotification
);

module.exports = router;