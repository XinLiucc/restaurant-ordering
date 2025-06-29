// src/routes/menu.js - 更新版本，包含权限控制
const express = require('express');
const { auth } = require('../middleware/auth');

// ===== 分类路由 =====
const categories = express.Router();

// 获取分类列表（公开接口）
categories.get('/', (req, res) => {
  res.json({
    success: true,
    message: '获取分类列表',
    data: [
      { id: 1, name: '热菜', description: '精选热菜系列', sortOrder: 1, status: 'active' },
      { id: 2, name: '凉菜', description: '爽口凉菜系列', sortOrder: 2, status: 'active' },
      { id: 3, name: '汤品', description: '营养汤品系列', sortOrder: 3, status: 'active' },
      { id: 4, name: '主食', description: '各类主食', sortOrder: 4, status: 'active' },
      { id: 5, name: '饮品', description: '各类饮品', sortOrder: 5, status: 'active' }
    ]
  });
});

// 创建分类（需要管理员权限）
categories.post('/', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '创建分类成功（管理员权限验证通过）',
    data: { categoryId: 6, name: req.body.name || '新分类' }
  });
});

// 更新分类（需要管理员权限）
categories.put('/:id', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '更新分类成功（管理员权限验证通过）',
    data: { categoryId: req.params.id }
  });
});

// 删除分类（需要管理员权限）
categories.delete('/:id', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '删除分类成功（管理员权限验证通过）',
    data: { categoryId: req.params.id }
  });
});

// ===== 菜品路由 =====
const dishes = express.Router();

// 获取菜品列表（公开接口）
dishes.get('/', (req, res) => {
  // 可选认证：如果登录了，显示更多信息
  const isLoggedIn = req.session && req.session.user;
  
  const dishData = [
    {
      id: 1,
      name: '宫保鸡丁',
      description: '经典川菜，香辣可口',
      price: 28.00,
      categoryId: 1,
      status: 'available',
      image: '/uploads/images/gongbao_chicken.jpg'
    },
    {
      id: 2,
      name: '麻婆豆腐',
      description: '嫩滑豆腐配特制麻婆汁',
      price: 18.00,
      categoryId: 1,
      status: 'available',
      image: '/uploads/images/mapo_tofu.jpg'
    }
  ];

  // 如果用户已登录，添加额外信息
  if (isLoggedIn) {
    dishData.forEach(dish => {
      dish.userCanOrder = true;
      dish.userRole = req.session.user.role;
    });
  }

  res.json({
    success: true,
    message: isLoggedIn ? '获取菜品列表（已登录）' : '获取菜品列表（未登录）',
    data: dishData
  });
});

// 获取菜品详情（公开接口）
dishes.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: '获取菜品详情',
    data: {
      id: req.params.id,
      name: '宫保鸡丁',
      description: '经典川菜，香辣可口',
      price: 28.00,
      categoryId: 1,
      status: 'available',
      image: '/uploads/images/gongbao_chicken.jpg'
    }
  });
});

// 创建菜品（需要管理员权限）
dishes.post('/', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '创建菜品成功（管理员权限验证通过）',
    data: { dishId: 3, name: req.body.name || '新菜品' }
  });
});

// 更新菜品（需要管理员权限）
dishes.put('/:id', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '更新菜品成功（管理员权限验证通过）',
    data: { dishId: req.params.id }
  });
});

// 删除菜品（需要管理员权限）
dishes.delete('/:id', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '删除菜品成功（管理员权限验证通过）',
    data: { dishId: req.params.id }
  });
});

// 上传菜品图片（需要管理员权限）
dishes.post('/:id/upload', auth.requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '上传菜品图片成功（管理员权限验证通过）',
    data: { 
      dishId: req.params.id,
      imageUrl: '/uploads/images/dish_' + req.params.id + '.jpg'
    }
  });
});

// 搜索菜品（可选认证）
dishes.get('/search/:keyword', auth.optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: '搜索菜品',
    data: [],
    keyword: req.params.keyword,
    userLoggedIn: !!(req.session && req.session.user)
  });
});

module.exports = { categories, dishes };