const express = require('express');
const router = express.Router();

// 数据概览
router.get('/overview', (req, res) => {
  res.json({
    success: true,
    message: '数据概览功能开发中',
    data: {
      todayOrders: 25,
      todayRevenue: 1580.50,
      pendingOrders: 3,
      totalCustomers: 128
    }
  });
});

// 销售统计
router.get('/sales', (req, res) => {
  res.json({
    success: true,
    message: '销售统计功能开发中',
    data: {
      totalSales: 15800.00,
      avgOrderValue: 85.50,
      orderCount: 185
    }
  });
});

// 菜品统计
router.get('/dishes', (req, res) => {
  res.json({
    success: true,
    message: '菜品统计功能开发中',
    data: [
      { dishName: '宫保鸡丁', totalSold: 45, revenue: 1260.00 },
      { dishName: '麻婆豆腐', totalSold: 38, revenue: 684.00 },
      { dishName: '红烧肉', totalSold: 32, revenue: 1120.00 }
    ]
  });
});

// 销售趋势
router.get('/trends', (req, res) => {
  res.json({
    success: true,
    message: '销售趋势功能开发中',
    data: [
      { date: '2024-11-25', revenue: 1250.00, orders: 15 },
      { date: '2024-11-26', revenue: 1450.00, orders: 18 },
      { date: '2024-11-27', revenue: 1680.00, orders: 22 }
    ]
  });
});

// 收入报表
router.get('/revenue', (req, res) => {
  res.json({
    success: true,
    message: '收入报表功能开发中',
    data: {
      daily: 1580.50,
      weekly: 8950.00,
      monthly: 35600.00
    }
  });
});

// 用户统计
router.get('/users', (req, res) => {
  res.json({
    success: true,
    message: '用户统计功能开发中',
    data: {
      totalUsers: 128,
      newUsers: 8,
      activeUsers: 45
    }
  });
});

module.exports = router;