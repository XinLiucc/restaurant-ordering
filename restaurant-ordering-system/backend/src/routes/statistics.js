// routes/statistics.js - 完整的统计路由实现
const express = require('express');
const StatisticsController = require('../controllers/statistics');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 创建路由实例
const router = express.Router();

// ===== 验证模式 =====

const periodQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month', 'quarter', 'year')
    .default('month')
    .messages({
      'any.only': '时间段必须是 today、week、month、quarter 或 year'
    })
});

const salesQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month', 'year')
    .default('month'),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': '开始日期格式不正确，应为 YYYY-MM-DD'
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': '结束日期格式不正确，应为 YYYY-MM-DD'
    })
});

const dishStatsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('today', 'week', 'month')
    .default('month'),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': '限制数量至少为1',
      'number.max': '限制数量最多为100'
    }),
  categoryId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.positive': '分类ID必须大于0'
    }),
  sortBy: Joi.string()
    .valid('quantity', 'revenue')
    .default('quantity')
    .messages({
      'any.only': '排序字段必须是 quantity 或 revenue'
    }),
  sortOrder: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
});

const trendsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('week', 'month', 'quarter', 'year')
    .default('month'),
  granularity: Joi.string()
    .valid('day', 'week', 'month')
    .default('day')
    .messages({
      'any.only': '粒度必须是 day、week 或 month'
    })
});

const revenueQuerySchema = Joi.object({
  type: Joi.string()
    .valid('summary', 'detail', 'comparison')
    .default('summary')
    .messages({
      'any.only': '类型必须是 summary、detail 或 comparison'
    })
});

// ===== 所有统计接口都需要管理员权限 =====

/**
 * 数据概览
 * GET /api/statistics/overview
 */
router.get('/overview',
  auth.requireAdmin,
  StatisticsController.getOverview
);

/**
 * 销售统计
 * GET /api/statistics/sales
 * Query: period, startDate, endDate
 */
router.get('/sales',
  auth.requireAdmin,
  validate(salesQuerySchema, 'query'),
  StatisticsController.getSalesStats
);

/**
 * 菜品销售统计
 * GET /api/statistics/dishes
 * Query: period, limit, categoryId, sortBy, sortOrder
 */
router.get('/dishes',
  auth.requireAdmin,
  validate(dishStatsQuerySchema, 'query'),
  StatisticsController.getDishStats
);

/**
 * 销售趋势分析
 * GET /api/statistics/trends
 * Query: period, granularity
 */
router.get('/trends',
  auth.requireAdmin,
  validate(trendsQuerySchema, 'query'),
  StatisticsController.getTrends
);

/**
 * 收入报表
 * GET /api/statistics/revenue
 * Query: type (summary/detail/comparison)
 */
router.get('/revenue',
  auth.requireAdmin,
  validate(revenueQuerySchema, 'query'),
  StatisticsController.getRevenue
);

/**
 * 用户统计
 * GET /api/statistics/users
 */
router.get('/users',
  auth.requireAdmin,
  StatisticsController.getUserStats
);

module.exports = router;