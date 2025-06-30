// routes/payment.js - 完整的支付系统路由
const express = require('express');
const PaymentController = require('../controllers/payment');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 创建路由实例
const router = express.Router();

// ===== 支付验证模式 =====

const createPaymentSchema = Joi.object({
  orderId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '订单ID必须是数字',
      'number.integer': '订单ID必须是整数',
      'number.positive': '订单ID必须大于0',
      'any.required': '订单ID是必填项'
    }),
  paymentMethod: Joi.string()
    .valid('wechat', 'alipay', 'cash')
    .default('wechat')
    .messages({
      'any.only': '支付方式必须是 wechat、alipay 或 cash'
    })
});

const mockPaymentSchema = Joi.object({
  transactionId: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': '交易号不能超过100个字符'
    })
});

const mockFailSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .max(200)
    .default('用户取消支付')
    .messages({
      'string.max': '失败原因不能超过200个字符'
    })
});

const refundSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .max(200)
    .default('用户申请退款')
    .messages({
      'string.max': '退款原因不能超过200个字符'
    })
});

const paymentNotifySchema = Joi.object({
  paymentNo: Joi.string()
    .required()
    .messages({
      'any.required': '支付订单号是必填项'
    }),
  status: Joi.string()
    .required()
    .messages({
      'any.required': '支付状态是必填项'
    }),
  transactionId: Joi.string()
    .optional(),
  amount: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': '金额必须大于0'
    })
});

const paymentListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  status: Joi.string()
    .valid('pending', 'success', 'failed', 'refunded')
    .optional(),
  paymentMethod: Joi.string()
    .valid('wechat', 'alipay', 'cash')
    .optional(),
  startDate: Joi.date()
    .iso()
    .optional(),
  endDate: Joi.date()
    .iso()
    .optional(),
  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'amount', 'status', 'paidAt')
    .default('createdAt'),
  sortOrder: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
});

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID必须是数字',
      'number.integer': 'ID必须是整数',
      'number.positive': 'ID必须大于0',
      'any.required': 'ID是必填项'
    })
});

const orderNoParamSchema = Joi.object({
  orderNo: Joi.string()
    .required()
    .messages({
      'any.required': '订单号是必填项'
    })
});

const statsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month')
    .default('today')
});

// ===== 支付路由 =====

/**
 * 创建支付订单
 * POST /api/payments/create
 */
router.post('/create',
  auth.requireAuth,
  validate(createPaymentSchema),
  PaymentController.createPayment
);

/**
 * 支付回调通知处理（第三方支付平台回调）
 * POST /api/payments/notify
 * 注意：这个接口通常不需要认证，因为是第三方平台回调
 */
router.post('/notify',
  validate(paymentNotifySchema),
  PaymentController.handlePaymentNotify
);

/**
 * 模拟支付成功（开发测试用）
 * POST /api/payments/:id/mock-success
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/:id/mock-success',
    auth.requireAuth,
    validate(idParamSchema, 'params'),
    validate(mockPaymentSchema),
    PaymentController.mockPaymentSuccess
  );

  /**
   * 模拟支付失败（开发测试用）
   * POST /api/payments/:id/mock-fail
   */
  router.post('/:id/mock-fail',
    auth.requireAuth,
    validate(idParamSchema, 'params'),
    validate(mockFailSchema),
    PaymentController.mockPaymentFail
  );
}

/**
 * 获取支付记录列表（管理员）
 * GET /api/payments
 */
router.get('/',
  auth.requireAdmin,
  validate(paymentListQuerySchema, 'query'),
  PaymentController.getPaymentList
);

/**
 * 获取支付统计（管理员）
 * GET /api/payments/stats
 */
router.get('/stats',
  auth.requireAdmin,
  validate(statsQuerySchema, 'query'),
  PaymentController.getPaymentStats
);

/**
 * 根据订单号查询支付状态
 * GET /api/payments/order/:orderNo
 */
router.get('/order/:orderNo',
  auth.requireAuth,
  validate(orderNoParamSchema, 'params'),
  PaymentController.getPaymentByOrderNo
);

/**
 * 查询支付状态
 * GET /api/payments/:id
 */
router.get('/:id',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  PaymentController.getPaymentStatus
);

/**
 * 申请退款（管理员）
 * POST /api/payments/:id/refund
 */
router.post('/:id/refund',
  auth.requireAdmin,
  validate(idParamSchema, 'params'),
  validate(refundSchema),
  PaymentController.refundPayment
);

module.exports = router;