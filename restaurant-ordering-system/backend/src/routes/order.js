// routes/order.js - 增强的订单和购物车路由
const express = require('express');
const CartController = require('../controllers/cart');
const OrderController = require('../controllers/order');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 创建路由实例
const cartRouter = express.Router();
const orderRouter = express.Router();

// ===== 购物车验证模式 =====

const addToCartSchema = Joi.object({
  dishId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '菜品ID必须是数字',
      'number.integer': '菜品ID必须是整数',
      'number.positive': '菜品ID必须大于0',
      'any.required': '菜品ID是必填项'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .default(1)
    .messages({
      'number.base': '数量必须是数字',
      'number.integer': '数量必须是整数',
      'number.min': '数量至少为1',
      'number.max': '数量不能超过99'
    })
});

const updateCartSchema = Joi.object({
  dishId: Joi.number()
    .integer()
    .positive()
    .required(),
  quantity: Joi.number()
    .integer()
    .min(0)
    .max(99)
    .required()
    .messages({
      'number.min': '数量不能小于0',
      'number.max': '数量不能超过99'
    })
});

const removeCartItemSchema = Joi.object({
  dishId: Joi.number()
    .integer()
    .positive()
    .required()
});

// ===== 订单验证模式 =====

// 🛒 从购物车创建订单的验证模式
const createOrderFromCartSchema = Joi.object({
  tableNumber: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .optional()
    .messages({
      'string.max': '桌号不能超过20个字符'
    }),
  remark: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注不能超过500个字符'
    })
});

// 📋 直接指定商品创建订单的验证模式
const createOrderSchema = Joi.object({
  tableNumber: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .optional()
    .messages({
      'string.max': '桌号不能超过20个字符'
    }),
  remark: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注不能超过500个字符'
    }),
  items: Joi.array()
    .items(Joi.object({
      dishId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).max(99).required()
    }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少选择一个商品',
      'array.max': '单个订单最多50个商品',
      'any.required': '订单商品是必填项'
    })
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled')
    .required()
    .messages({
      'any.only': '状态值无效',
      'any.required': '状态是必填项'
    })
});

const batchUpdateOrderStatusSchema = Joi.object({
  orderIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少选择一个订单',
      'array.max': '单次最多更新50个订单',
      'any.required': '订单ID列表是必填项'
    }),
  status: Joi.string()
    .valid('pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled')
    .required()
});

const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled').optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('createdAt', 'totalAmount', 'status', 'orderNo').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const orderStatsSchema = Joi.object({
  period: Joi.string().valid('today', 'week', 'month').default('today')
});

// ===== 购物车路由 =====

/**
 * 获取购物车
 * GET /api/cart
 */
cartRouter.get('/', 
  auth.requireAuth, 
  CartController.getCart
);

/**
 * 🛒 获取购物车状态（用于下单前检查）
 * GET /api/cart/status
 */
cartRouter.get('/status',
  auth.requireAuth,
  OrderController.getCartStatus
);

/**
 * 添加到购物车
 * POST /api/cart/add
 */
cartRouter.post('/add',
  auth.requireAuth,
  validate(addToCartSchema),
  CartController.addToCart
);

/**
 * 更新购物车项
 * PUT /api/cart/update
 */
cartRouter.put('/update',
  auth.requireAuth,
  validate(updateCartSchema),
  CartController.updateCartItem
);

/**
 * 移除购物车项
 * DELETE /api/cart/remove
 */
cartRouter.delete('/remove',
  auth.requireAuth,
  validate(removeCartItemSchema),
  CartController.removeCartItem
);

/**
 * 清空购物车
 * DELETE /api/cart/clear
 */
cartRouter.delete('/clear',
  auth.requireAuth,
  CartController.clearCart
);

/**
 * 获取购物车商品数量
 * GET /api/cart/count
 */
cartRouter.get('/count',
  auth.requireAuth,
  CartController.getCartItemCount
);

// ===== 订单路由 =====

/**
 * 🛒 从购物车创建订单（一键下单）
 * POST /api/orders/from-cart
 */
orderRouter.post('/from-cart',
  auth.requireAuth,
  validate(createOrderFromCartSchema),
  OrderController.createOrderFromCart
);

/**
 * 📋 直接指定商品创建订单
 * POST /api/orders
 */
orderRouter.post('/',
  auth.requireAuth,
  validate(createOrderSchema),
  OrderController.createOrder
);

/**
 * 📊 获取用户订单摘要
 * GET /api/orders/summary
 */
orderRouter.get('/summary',
  auth.requireAuth,
  OrderController.getUserOrderSummary
);

/**
 * 获取我的订单
 * GET /api/orders/my
 */
orderRouter.get('/my',
  auth.requireAuth,
  validate(orderQuerySchema, 'query'),
  OrderController.getMyOrders
);

/**
 * 🔍 获取订单统计（管理员）
 * GET /api/orders/stats/overview
 */
orderRouter.get('/stats/overview',
  auth.requireAdmin,
  validate(orderStatsSchema, 'query'),
  OrderController.getOrderStats
);

/**
 * 获取所有订单（管理员）
 * GET /api/orders
 */
orderRouter.get('/',
  auth.requireAdmin,
  validate(orderQuerySchema, 'query'),
  OrderController.getAllOrders
);

/**
 * 获取订单详情
 * GET /api/orders/:id
 */
orderRouter.get('/:id',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  OrderController.getOrderDetail
);

/**
 * 更新订单状态（管理员）
 * PUT /api/orders/:id/status
 */
orderRouter.put('/:id/status',
  auth.requireAdmin,
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  OrderController.updateOrderStatus
);

/**
 * 取消订单
 * PUT /api/orders/:id/cancel
 */
orderRouter.put('/:id/cancel',
  auth.requireAuth,
  validate(idParamSchema, 'params'),
  OrderController.cancelOrder
);

/**
 * 批量更新订单状态（管理员）
 * PUT /api/orders/batch/status
 */
orderRouter.put('/batch/status',
  auth.requireAdmin,
  validate(batchUpdateOrderStatusSchema),
  OrderController.batchUpdateOrderStatus
);

// 导出路由
module.exports = {
  cart: cartRouter,
  orders: orderRouter
};