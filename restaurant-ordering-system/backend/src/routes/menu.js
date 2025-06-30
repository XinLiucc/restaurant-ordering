// routes/menu.js - 完整的菜品管理路由
const express = require('express');
const MenuController = require('../controllers/menu');
const { auth } = require('../middleware/auth');
const { 
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateDish,
  validateUpdateDish,
  validateBatchUpdateStatus,
  validatePagination,
  validateIdParam
} = require('../middleware/validation');

// 创建路由实例
const router = express.Router();

// ===== 分类路由 =====

/**
 * 获取所有可用分类（公开接口）
 * GET /api/menu/categories/active
 */
router.get('/categories/active', MenuController.getActiveCategories);

/**
 * 获取分类列表（支持分页和搜索）
 * GET /api/menu/categories
 * Query: page, limit, status, search
 */
router.get('/categories', 
  validatePagination,
  MenuController.getCategories
);

/**
 * 创建分类（需要管理员权限）
 * POST /api/menu/categories
 */
router.post('/categories',
  auth.requireAdmin,
  validateCreateCategory,
  MenuController.createCategory
);

/**
 * 更新分类（需要管理员权限）
 * PUT /api/menu/categories/:id
 */
router.put('/categories/:id',
  auth.requireAdmin,
  validateIdParam,
  validateUpdateCategory,
  MenuController.updateCategory
);

/**
 * 删除分类（需要管理员权限）
 * DELETE /api/menu/categories/:id
 */
router.delete('/categories/:id',
  auth.requireAdmin,
  validateIdParam,
  MenuController.deleteCategory
);

/**
 * 获取分类菜品统计
 * GET /api/menu/categories/stats
 */
router.get('/categories/stats',
  auth.requireAdmin,
  MenuController.getCategoryDishStats
);

// ===== 菜品路由 =====

/**
 * 获取可用菜品列表（公开接口）
 * GET /api/menu/dishes/available
 * Query: categoryId, search
 */
router.get('/dishes/available', MenuController.getAvailableDishes);

/**
 * 获取菜品列表（支持分页、搜索、排序）
 * GET /api/menu/dishes
 * Query: page, limit, categoryId, status, search, sortBy, sortOrder
 */
router.get('/dishes',
  validatePagination,
  MenuController.getDishes
);

/**
 * 获取菜品详情
 * GET /api/menu/dishes/:id
 */
router.get('/dishes/:id',
  validateIdParam,
  MenuController.getDishDetail
);

/**
 * 创建菜品（需要管理员权限）
 * POST /api/menu/dishes
 */
router.post('/dishes',
  auth.requireAdmin,
  validateCreateDish,
  MenuController.createDish
);

/**
 * 更新菜品（需要管理员权限）
 * PUT /api/menu/dishes/:id
 */
router.put('/dishes/:id',
  auth.requireAdmin,
  validateIdParam,
  validateUpdateDish,
  MenuController.updateDish
);

/**
 * 删除菜品（需要管理员权限）
 * DELETE /api/menu/dishes/:id
 */
router.delete('/dishes/:id',
  auth.requireAdmin,
  validateIdParam,
  MenuController.deleteDish
);

/**
 * 批量更新菜品状态（需要管理员权限）
 * PUT /api/menu/dishes/batch/status
 */
router.put('/dishes/batch/status',
  auth.requireAdmin,
  validateBatchUpdateStatus,
  MenuController.batchUpdateStatus
);

module.exports = router;