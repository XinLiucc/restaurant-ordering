// controllers/menu.js - 菜品管理控制器
const { Category, Dish } = require('../models');
const { success, error, created, notFound, paginated } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

class MenuController {
  // ===== 分类管理 =====
  
  /**
   * 获取分类列表
   */
  getCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status, search } = req.query;
    
    const whereCondition = {};
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 搜索条件
    if (search) {
      whereCondition.name = {
        [Op.like]: `%${search}%`
      };
    }

    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Category.findAndCountAll({
        where: whereCondition,
        order: [['sortOrder', 'ASC'], ['id', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取分类列表成功');

    } catch (err) {
      console.error('获取分类列表失败:', err);
      return error(res, '获取分类列表失败', 500);
    }
  });

  /**
   * 获取所有可用分类（公开接口）
   */
  getActiveCategories = asyncHandler(async (req, res) => {
    try {
      const categories = await Category.findAll({
        where: { status: 'active' },
        order: [['sortOrder', 'ASC'], ['id', 'ASC']],
        attributes: ['id', 'name', 'description', 'sortOrder']
      });

      return success(res, categories, '获取可用分类成功');

    } catch (err) {
      console.error('获取可用分类失败:', err);
      return error(res, '获取可用分类失败', 500);
    }
  });

  /**
   * 创建分类
   */
  createCategory = asyncHandler(async (req, res) => {
    const { name, description, sortOrder = 0 } = req.body;

    // 参数验证
    if (!name || name.trim().length === 0) {
      return error(res, '分类名称不能为空', 400, 'MISSING_NAME');
    }

    if (name.length > 50) {
      return error(res, '分类名称不能超过50个字符', 400, 'NAME_TOO_LONG');
    }

    try {
      // 检查名称是否已存在
      const existingCategory = await Category.findOne({
        where: { name: name.trim() }
      });

      if (existingCategory) {
        return error(res, '分类名称已存在', 400, 'CATEGORY_EXISTS');
      }

      // 创建分类
      const category = await Category.create({
        name: name.trim(),
        description: description?.trim() || '',
        sortOrder: parseInt(sortOrder) || 0,
        status: 'active'
      });

      return created(res, category, '创建分类成功');

    } catch (err) {
      console.error('创建分类失败:', err);
      return error(res, '创建分类失败', 500);
    }
  });

  /**
   * 更新分类
   */
  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, sortOrder, status } = req.body;

    if (!id) {
      return error(res, '分类ID不能为空', 400, 'MISSING_ID');
    }

    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return notFound(res, '分类不存在');
      }

      // 更新数据
      const updateData = {};
      
      if (name !== undefined) {
        if (!name.trim()) {
          return error(res, '分类名称不能为空', 400, 'MISSING_NAME');
        }
        
        // 检查名称是否被其他分类使用
        const existingCategory = await Category.findOne({
          where: { 
            name: name.trim(),
            id: { [Op.ne]: id }
          }
        });

        if (existingCategory) {
          return error(res, '分类名称已存在', 400, 'CATEGORY_EXISTS');
        }
        
        updateData.name = name.trim();
      }
      
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      
      if (sortOrder !== undefined) {
        updateData.sortOrder = parseInt(sortOrder) || 0;
      }
      
      if (status !== undefined) {
        if (!['active', 'inactive'].includes(status)) {
          return error(res, '状态值无效', 400, 'INVALID_STATUS');
        }
        updateData.status = status;
      }

      await category.update(updateData);

      return success(res, category, '更新分类成功');

    } catch (err) {
      console.error('更新分类失败:', err);
      return error(res, '更新分类失败', 500);
    }
  });

  /**
   * 删除分类
   */
  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return error(res, '分类ID不能为空', 400, 'MISSING_ID');
    }

    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return notFound(res, '分类不存在');
      }

      // 检查是否有关联的菜品
      const dishCount = await Dish.count({
        where: { categoryId: id }
      });

      if (dishCount > 0) {
        return error(res, `该分类下还有${dishCount}个菜品，无法删除`, 400, 'CATEGORY_HAS_DISHES');
      }

      await category.destroy();

      return success(res, null, '删除分类成功');

    } catch (err) {
      console.error('删除分类失败:', err);
      return error(res, '删除分类失败', 500);
    }
  });

  // ===== 菜品管理 =====

  /**
   * 获取菜品列表
   */
  getDishes = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      categoryId, 
      status, 
      search,
      sortBy = 'sortOrder',
      sortOrder = 'ASC'
    } = req.query;

    const whereCondition = {};
    
    // 分类筛选
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }
    
    // 搜索条件
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const offset = (page - 1) * limit;
      
      // 构建排序条件
      const orderConditions = [];
      if (sortBy === 'price') {
        orderConditions.push(['price', sortOrder.toUpperCase()]);
      } else if (sortBy === 'name') {
        orderConditions.push(['name', sortOrder.toUpperCase()]);
      } else {
        orderConditions.push(['sortOrder', 'ASC'], ['id', 'ASC']);
      }

      const { count, rows } = await Dish.findAndCountAll({
        where: whereCondition,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }],
        order: orderConditions,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取菜品列表成功');

    } catch (err) {
      console.error('获取菜品列表失败:', err);
      return error(res, '获取菜品列表失败', 500);
    }
  });

  /**
   * 获取可用菜品列表（公开接口）
   */
  getAvailableDishes = asyncHandler(async (req, res) => {
    const { categoryId, search } = req.query;

    const whereCondition = { status: 'available' };
    
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }
    
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    try {
      const dishes = await Dish.findAll({
        where: whereCondition,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
          where: { status: 'active' }
        }],
        order: [['sortOrder', 'ASC'], ['id', 'ASC']],
        attributes: ['id', 'name', 'description', 'price', 'image', 'categoryId', 'tags']
      });

      return success(res, dishes, '获取可用菜品成功');

    } catch (err) {
      console.error('获取可用菜品失败:', err);
      return error(res, '获取可用菜品失败', 500);
    }
  });

  /**
   * 获取菜品详情
   */
  getDishDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_ID');
    }

    try {
      const dish = await Dish.findByPk(id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'status']
        }]
      });

      if (!dish) {
        return notFound(res, '菜品不存在');
      }

      return success(res, dish, '获取菜品详情成功');

    } catch (err) {
      console.error('获取菜品详情失败:', err);
      return error(res, '获取菜品详情失败', 500);
    }
  });

  /**
   * 创建菜品
   */
  createDish = asyncHandler(async (req, res) => {
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      image, 
      tags = [], 
      sortOrder = 0 
    } = req.body;

    // 参数验证
    if (!name || name.trim().length === 0) {
      return error(res, '菜品名称不能为空', 400, 'MISSING_NAME');
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return error(res, '菜品价格必须为正数', 400, 'INVALID_PRICE');
    }

    if (!categoryId) {
      return error(res, '分类ID不能为空', 400, 'MISSING_CATEGORY');
    }

    try {
      // 验证分类是否存在
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return error(res, '指定的分类不存在', 400, 'CATEGORY_NOT_FOUND');
      }

      // 检查菜品名称是否已存在
      const existingDish = await Dish.findOne({
        where: { name: name.trim() }
      });

      if (existingDish) {
        return error(res, '菜品名称已存在', 400, 'DISH_EXISTS');
      }

      // 创建菜品
      const dish = await Dish.create({
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        image: image?.trim() || '',
        tags: Array.isArray(tags) ? tags : [],
        sortOrder: parseInt(sortOrder) || 0,
        status: 'available'
      });

      // 获取完整信息返回
      const newDish = await Dish.findByPk(dish.id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });

      return created(res, newDish, '创建菜品成功');

    } catch (err) {
      console.error('创建菜品失败:', err);
      return error(res, '创建菜品失败', 500);
    }
  });

  /**
   * 更新菜品
   */
  updateDish = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, price, categoryId, image, tags, sortOrder, status } = req.body;

    if (!id) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_ID');
    }

    try {
      const dish = await Dish.findByPk(id);

      if (!dish) {
        return notFound(res, '菜品不存在');
      }

      // 更新数据
      const updateData = {};
      
      if (name !== undefined) {
        if (!name.trim()) {
          return error(res, '菜品名称不能为空', 400, 'MISSING_NAME');
        }
        
        // 检查名称是否被其他菜品使用
        const existingDish = await Dish.findOne({
          where: { 
            name: name.trim(),
            id: { [Op.ne]: id }
          }
        });

        if (existingDish) {
          return error(res, '菜品名称已存在', 400, 'DISH_EXISTS');
        }
        
        updateData.name = name.trim();
      }
      
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      
      if (price !== undefined) {
        if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
          return error(res, '菜品价格必须为正数', 400, 'INVALID_PRICE');
        }
        updateData.price = parseFloat(price);
      }
      
      if (categoryId !== undefined) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return error(res, '指定的分类不存在', 400, 'CATEGORY_NOT_FOUND');
        }
        updateData.categoryId = parseInt(categoryId);
      }
      
      if (image !== undefined) {
        updateData.image = image.trim();
      }
      
      if (tags !== undefined) {
        updateData.tags = Array.isArray(tags) ? tags : [];
      }
      
      if (sortOrder !== undefined) {
        updateData.sortOrder = parseInt(sortOrder) || 0;
      }
      
      if (status !== undefined) {
        if (!['available', 'unavailable'].includes(status)) {
          return error(res, '状态值无效', 400, 'INVALID_STATUS');
        }
        updateData.status = status;
      }

      await dish.update(updateData);

      // 获取更新后的完整信息
      const updatedDish = await Dish.findByPk(id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }]
      });

      return success(res, updatedDish, '更新菜品成功');

    } catch (err) {
      console.error('更新菜品失败:', err);
      return error(res, '更新菜品失败', 500);
    }
  });

  /**
   * 删除菜品
   */
  deleteDish = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return error(res, '菜品ID不能为空', 400, 'MISSING_ID');
    }

    try {
      const dish = await Dish.findByPk(id);

      if (!dish) {
        return notFound(res, '菜品不存在');
      }

      // TODO: 检查是否有关联的订单项（如果需要的话）
      // const orderItemCount = await OrderItem.count({
      //   where: { dishId: id }
      // });

      await dish.destroy();

      return success(res, null, '删除菜品成功');

    } catch (err) {
      console.error('删除菜品失败:', err);
      return error(res, '删除菜品失败', 500);
    }
  });

  /**
   * 批量更新菜品状态
   */
  batchUpdateStatus = asyncHandler(async (req, res) => {
    const { dishIds, status } = req.body;

    if (!Array.isArray(dishIds) || dishIds.length === 0) {
      return error(res, '菜品ID列表不能为空', 400, 'MISSING_DISH_IDS');
    }

    if (!['available', 'unavailable'].includes(status)) {
      return error(res, '状态值无效', 400, 'INVALID_STATUS');
    }

    try {
      const [updatedCount] = await Dish.update(
        { status },
        { where: { id: dishIds } }
      );

      return success(res, {
        updatedCount,
        status,
        dishIds
      }, `批量更新${updatedCount}个菜品状态成功`);

    } catch (err) {
      console.error('批量更新菜品状态失败:', err);
      return error(res, '批量更新菜品状态失败', 500);
    }
  });

  /**
   * 获取分类下的菜品数量统计
   */
  getCategoryDishStats = asyncHandler(async (req, res) => {
    try {
      const stats = await Category.findAll({
        attributes: [
          'id',
          'name',
          [sequelize.fn('COUNT', sequelize.col('dishes.id')), 'dishCount']
        ],
        include: [{
          model: Dish,
          as: 'dishes',
          attributes: [],
          required: false
        }],
        group: ['Category.id'],
        order: [['sortOrder', 'ASC']]
      });

      return success(res, stats, '获取分类菜品统计成功');

    } catch (err) {
      console.error('获取分类菜品统计失败:', err);
      return error(res, '获取分类菜品统计失败', 500);
    }
  });
}

module.exports = new MenuController();