// controllers/order.js - 增强的订单管理控制器
const { Order, OrderItem, User, Dish, Category, sequelize } = require('../models');
const { success, error, created, notFound, paginated } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * 订单管理控制器（增强版）
 */
class OrderController {
  /**
   * 生成订单号
   */
  generateOrderNo() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `ORDER${year}${month}${day}${timestamp}`;
  }

  /**
   * 🛒 从购物车创建订单（一键下单）
   */
  createOrderFromCart = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { tableNumber, remark } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      // 获取购物车内容
      const cart = req.session.cart;

      // 验证购物车
      if (!cart || !cart.items || cart.items.length === 0) {
        return error(res, '购物车为空，无法创建订单', 400, 'EMPTY_CART');
      }

      if (cart.itemCount <= 0) {
        return error(res, '购物车商品数量无效', 400, 'INVALID_CART_COUNT');
      }

      if (cart.total <= 0) {
        return error(res, '购物车总金额无效', 400, 'INVALID_CART_TOTAL');
      }

      console.log('📦 从购物车创建订单:', {
        userId,
        itemCount: cart.itemCount,
        total: cart.total,
        items: cart.items.map(item => ({
          dishId: item.dishId,
          dishName: item.dishName,
          quantity: item.quantity
        }))
      });

      // 🔧 先保存购物车副本，只有成功后才清空
      const cartBackup = JSON.parse(JSON.stringify(cart));

      // 使用购物车商品创建订单
      const orderResult = await this.createOrderWithItems(
        userId,
        cart.items,
        tableNumber,
        remark
      );

      // 🎉 只有订单创建成功后才清空购物车
      req.session.cart = { items: [], total: 0, itemCount: 0 };

      console.log('✅ 订单创建成功，购物车已清空');

      return created(res, {
        ...orderResult,
        cartCleared: true,
        message: '订单创建成功，购物车已清空'
      }, '从购物车创建订单成功');

    } catch (err) {
      console.error('从购物车创建订单失败:', err);
      
      // 🔧 详细错误日志
      console.error('错误详情:', {
        message: err.message,
        stack: err.stack,
        isCustomError: err.isCustomError,
        code: err.code,
        status: err.status
      });

      // 🔧 订单创建失败时，不清空购物车
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, `创建订单失败: ${err.message}`, 500, 'ORDER_CREATION_FAILED');
    }
  });

  /**
   * 📋 直接指定商品创建订单（保留原有功能）
   */
  createOrder = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { tableNumber, remark, items } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    // 参数验证
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, '订单商品不能为空', 400, 'MISSING_ORDER_ITEMS');
    }

    if (items.length > 50) {
      return error(res, '单个订单最多50个商品', 400, 'TOO_MANY_ITEMS');
    }

    // 验证商品数据格式
    for (const item of items) {
      if (!item.dishId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return error(res, '商品数据格式不正确', 400, 'INVALID_ITEM_FORMAT');
      }
      if (item.quantity > 99) {
        return error(res, '单个商品数量不能超过99', 400, 'QUANTITY_EXCEEDED');
      }
    }

    try {
      console.log('📋 直接创建订单:', {
        userId,
        itemCount: items.length,
        items: items.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity
        }))
      });

      // 转换为统一格式
      const cartItems = items.map(item => ({
        dishId: item.dishId,
        quantity: item.quantity
      }));

      const orderResult = await this.createOrderWithItems(
        userId,
        cartItems,
        tableNumber,
        remark
      );

      console.log('✅ 直接订单创建成功');

      return created(res, orderResult, '订单创建成功');

    } catch (err) {
      console.error('创建订单失败:', err);
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '创建订单失败', 500);
    }
  });

  /**
   * 🔧 通用订单创建逻辑（内部方法）- 简化版
   */
  async createOrderWithItems(userId, items, tableNumber, remark) {
    const transaction = await sequelize.transaction();

    try {
      console.log('🔧 开始创建订单，输入参数:', {
        userId,
        itemsCount: items.length,
        items: items.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity,
          dishName: item.dishName || 'N/A'
        })),
        tableNumber,
        remark
      });

      // 🔧 简化查询：只查询菜品，不包含分类关联
      const dishIds = items.map(item => item.dishId);
      console.log('🔍 查询菜品IDs:', dishIds);

      const dishes = await Dish.findAll({
        where: { 
          id: dishIds,
          status: 'available' 
        },
        transaction
      });

      console.log('📦 查询到的菜品数量:', dishes.length);
      console.log('📦 查询到的菜品详情:', dishes.map(dish => ({
        id: dish.id,
        name: dish.name,
        status: dish.status,
        price: dish.price,
        categoryId: dish.categoryId
      })));

      if (dishes.length !== dishIds.length) {
        console.error('❌ 菜品数量不匹配:', {
          requested: dishIds.length,
          found: dishes.length,
          requestedIds: dishIds,
          foundIds: dishes.map(d => d.id)
        });
        
        await transaction.rollback();
        throw new CustomError('部分菜品不可用或不存在', 400, 'INVALID_DISHES');
      }

      // 创建菜品映射
      const dishMap = new Map();
      dishes.forEach(dish => {
        dishMap.set(dish.id, dish);
      });

      // 计算订单总金额和准备订单项数据
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const dish = dishMap.get(item.dishId);
        if (!dish) {
          console.error('❌ 菜品映射失败:', {
            dishId: item.dishId,
            availableDishes: Array.from(dishMap.keys())
          });
          
          await transaction.rollback();
          throw new CustomError(`菜品ID ${item.dishId} 不存在`, 400, 'DISH_NOT_FOUND');
        }

        const subtotal = parseFloat(dish.price) * item.quantity;
        totalAmount += subtotal;

        const orderItemData = {
          dishId: dish.id,
          dishName: dish.name,
          price: parseFloat(dish.price),
          quantity: item.quantity,
          subtotal: parseFloat(subtotal.toFixed(2))
        };

        orderItemsData.push(orderItemData);
        
        console.log('📝 订单项:', orderItemData);
      }

      totalAmount = parseFloat(totalAmount.toFixed(2));
      console.log('💰 订单总金额:', totalAmount);

      // 创建订单
      const orderNo = this.generateOrderNo();
      console.log('📋 创建订单，订单号:', orderNo);

      const order = await Order.create({
        orderNo,
        userId,
        totalAmount,
        status: 'pending',
        tableNumber: tableNumber?.trim() || null,
        remark: remark?.trim() || null
      }, { transaction });

      console.log('✅ 订单创建成功:', {
        orderId: order.id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount
      });

      // 创建订单项
      const orderItems = await OrderItem.bulkCreate(
        orderItemsData.map(item => ({
          ...item,
          orderId: order.id
        })),
        { transaction }
      );

      console.log('✅ 订单项创建成功，数量:', orderItems.length);

      await transaction.commit();
      console.log('✅ 事务提交成功');

      // 🔧 简化返回数据，避免复杂查询
      const result = {
        id: order.id,
        orderNo: order.orderNo,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        tableNumber: order.tableNumber,
        remark: order.remark,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: orderItems.map(item => ({
          id: item.id,
          dishId: item.dishId,
          dishName: item.dishName,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        }))
      };

      console.log('✅ 订单创建完成，返回简化数据');
      return result;

    } catch (err) {
      await transaction.rollback();
      console.error('❌ 订单创建失败，事务已回滚');
      
      if (err.name === 'SequelizeUniqueConstraintError') {
        console.error('❌ 订单号重复错误:', err.message);
        throw new CustomError('订单号重复，请重试', 500, 'DUPLICATE_ORDER_NO');
      }

      console.error('❌ 其他订单创建错误:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }

  /**
   * 🛒 获取购物车状态（用于下单前检查）
   */
  getCartStatus = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      const cart = req.session.cart || { items: [], total: 0, itemCount: 0 };
      
      const canCreateOrder = cart.items.length > 0 && cart.total > 0;

      return success(res, {
        cart,
        canCreateOrder,
        validation: {
          hasItems: cart.items.length > 0,
          validTotal: cart.total > 0,
          itemCount: cart.itemCount
        }
      }, '获取购物车状态成功');

    } catch (err) {
      console.error('获取购物车状态失败:', err);
      return error(res, '获取购物车状态失败', 500);
    }
  });

  /**
   * 📊 获取用户订单摘要
   */
  getUserOrderSummary = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      // 获取订单统计
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalSpent
      ] = await Promise.all([
        Order.count({ where: { userId } }),
        Order.count({ where: { userId, status: 'pending' } }),
        Order.count({ where: { userId, status: 'completed' } }),
        Order.count({ where: { userId, status: 'cancelled' } }),
        Order.sum('totalAmount', { where: { userId, status: 'completed' } })
      ]);

      // 获取最近订单
      const recentOrders = await Order.findAll({
        where: { userId },
        include: [{
          model: OrderItem,
          as: 'items',
          limit: 3, // 只显示前3个商品
          include: [{
            model: Dish,
            as: 'dish',
            attributes: ['id', 'name', 'image']
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      return success(res, {
        summary: {
          totalOrders,
          pendingOrders,
          completedOrders,
          cancelledOrders,
          totalSpent: totalSpent || 0,
          averageOrderValue: completedOrders > 0 ? ((totalSpent || 0) / completedOrders).toFixed(2) : 0
        },
        recentOrders
      }, '获取用户订单摘要成功');

    } catch (err) {
      console.error('获取用户订单摘要失败:', err);
      return error(res, '获取用户订单摘要失败', 500);
    }
  });

  // ===== 以下是原有的方法，保持不变 =====

  /**
   * 获取我的订单列表
   */
  getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    try {
      const whereCondition = { userId };
      
      if (status) {
        whereCondition.status = status;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Order.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{
              model: Dish,
              as: 'dish',
              attributes: ['id', 'name', 'image', 'price']
            }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取我的订单成功');

    } catch (err) {
      console.error('获取我的订单失败:', err);
      return error(res, '获取我的订单失败', 500);
    }
  });

  /**
   * 获取所有订单（管理员）
   */
  getAllOrders = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    try {
      const whereCondition = {};
      
      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 日期范围筛选
      if (startDate || endDate) {
        whereCondition.createdAt = {};
        if (startDate) {
          whereCondition.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          whereCondition.createdAt[Op.lte] = end;
        }
      }

      // 搜索条件（订单号、桌号、用户昵称）
      const include = [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Dish,
            as: 'dish',
            attributes: ['id', 'name', 'image']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickName', 'phone']
        }
      ];

      if (search) {
        whereCondition[Op.or] = [
          { orderNo: { [Op.like]: `%${search}%` } },
          { tableNumber: { [Op.like]: `%${search}%` } }
        ];
        
        // 添加用户昵称搜索
        include[1].where = {
          nickName: { [Op.like]: `%${search}%` }
        };
        include[1].required = false;
      }

      const offset = (page - 1) * limit;

      // 构建排序条件
      let orderCondition = [['createdAt', 'DESC']];
      if (sortBy === 'totalAmount') {
        orderCondition = [['totalAmount', sortOrder.toUpperCase()]];
      } else if (sortBy === 'status') {
        orderCondition = [['status', sortOrder.toUpperCase()]];
      } else if (sortBy === 'orderNo') {
        orderCondition = [['orderNo', sortOrder.toUpperCase()]];
      }

      const { count, rows } = await Order.findAndCountAll({
        where: whereCondition,
        include,
        order: orderCondition,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取订单列表成功');

    } catch (err) {
      console.error('获取订单列表失败:', err);
      return error(res, '获取订单列表失败', 500);
    }
  });

  /**
   * 获取订单详情
   */
  getOrderDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '订单ID不能为空', 400, 'MISSING_ORDER_ID');
    }

    try {
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{
              model: Dish,
              as: 'dish',
              attributes: ['id', 'name', 'image', 'description'],
              include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
              }]
            }]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickName', 'phone', 'avatar']
          }
        ]
      });

      if (!order) {
        return notFound(res, '订单不存在');
      }

      // 权限检查：只能查看自己的订单或管理员可以查看所有订单
      if (currentUser.role !== 'admin' && order.userId !== currentUser.id) {
        return error(res, '只能查看自己的订单', 403, 'FORBIDDEN');
      }

      return success(res, order, '获取订单详情成功');

    } catch (err) {
      console.error('获取订单详情失败:', err);
      return error(res, '获取订单详情失败', 500);
    }
  });

  /**
   * 更新订单状态（管理员）
   */
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return error(res, '订单ID不能为空', 400, 'MISSING_ORDER_ID');
    }

    const validStatuses = ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return error(res, '状态值无效', 400, 'INVALID_STATUS');
    }

    try {
      const order = await Order.findByPk(id);

      if (!order) {
        return notFound(res, '订单不存在');
      }

      // 状态流转验证
      const currentStatus = order.status;
      const statusFlow = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['cooking', 'cancelled'],
        'cooking': ['ready', 'cancelled'],
        'ready': ['completed'],
        'completed': [], // 已完成订单不能再改状态
        'cancelled': [] // 已取消订单不能再改状态
      };

      if (!statusFlow[currentStatus].includes(status)) {
        return error(res, `订单状态不能从 ${currentStatus} 更改为 ${status}`, 400, 'INVALID_STATUS_TRANSITION');
      }

      await order.update({ status });

      // TODO: 这里可以添加状态变更通知逻辑

      return success(res, {
        orderId: order.id,
        orderNo: order.orderNo,
        oldStatus: currentStatus,
        newStatus: status,
        updatedAt: order.updatedAt
      }, '订单状态更新成功');

    } catch (err) {
      console.error('更新订单状态失败:', err);
      return error(res, '更新订单状态失败', 500);
    }
  });

  /**
   * 取消订单
   */
  cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '订单ID不能为空', 400, 'MISSING_ORDER_ID');
    }

    try {
      const order = await Order.findByPk(id);

      if (!order) {
        return notFound(res, '订单不存在');
      }

      // 权限检查：只能取消自己的订单或管理员可以取消任何订单
      if (currentUser.role !== 'admin' && order.userId !== currentUser.id) {
        return error(res, '只能取消自己的订单', 403, 'FORBIDDEN');
      }

      // 状态检查：只有待确认和已确认的订单可以取消
      if (!['pending', 'confirmed'].includes(order.status)) {
        return error(res, '该订单状态下不能取消', 400, 'CANNOT_CANCEL_ORDER');
      }

      const oldStatus = order.status;
      await order.update({ status: 'cancelled' });

      return success(res, {
        orderId: order.id,
        orderNo: order.orderNo,
        oldStatus,
        newStatus: 'cancelled',
        cancelledAt: order.updatedAt
      }, '订单取消成功');

    } catch (err) {
      console.error('取消订单失败:', err);
      return error(res, '取消订单失败', 500);
    }
  });

  /**
   * 获取订单统计（管理员）
   */
  getOrderStats = asyncHandler(async (req, res) => {
    const { period = 'today' } = req.query; // today, week, month

    try {
      let dateCondition = {};
      const now = new Date();

      switch (period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateCondition = {
            createdAt: {
              [Op.gte]: today
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateCondition = {
            createdAt: {
              [Op.gte]: weekAgo
            }
          };
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          dateCondition = {
            createdAt: {
              [Op.gte]: monthAgo
            }
          };
          break;
      }

      // 获取统计数据
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue
      ] = await Promise.all([
        Order.count({ where: dateCondition }),
        Order.count({ where: { ...dateCondition, status: 'pending' } }),
        Order.count({ where: { ...dateCondition, status: 'completed' } }),
        Order.count({ where: { ...dateCondition, status: 'cancelled' } }),
        Order.sum('totalAmount', { where: { ...dateCondition, status: 'completed' } })
      ]);

      // 获取状态分布
      const statusStats = await Order.findAll({
        where: dateCondition,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      return success(res, {
        period,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: totalRevenue || 0,
        averageOrderValue: totalOrders > 0 ? ((totalRevenue || 0) / completedOrders).toFixed(2) : 0,
        statusDistribution: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        generatedAt: new Date().toISOString()
      }, '获取订单统计成功');

    } catch (err) {
      console.error('获取订单统计失败:', err);
      return error(res, '获取订单统计失败', 500);
    }
  });

  /**
   * 批量更新订单状态（管理员）
   */
  batchUpdateOrderStatus = asyncHandler(async (req, res) => {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return error(res, '订单ID列表不能为空', 400, 'MISSING_ORDER_IDS');
    }

    if (orderIds.length > 50) {
      return error(res, '单次最多更新50个订单', 400, 'TOO_MANY_ORDERS');
    }

    const validStatuses = ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return error(res, '状态值无效', 400, 'INVALID_STATUS');
    }

    try {
      const [updatedCount] = await Order.update(
        { status },
        { 
          where: { 
            id: orderIds,
            // 只更新可以更新的状态
            status: {
              [Op.in]: ['pending', 'confirmed', 'cooking', 'ready']
            }
          }
        }
      );

      return success(res, {
        updatedCount,
        requestedCount: orderIds.length,
        status,
        orderIds
      }, `批量更新${updatedCount}个订单状态成功`);

    } catch (err) {
      console.error('批量更新订单状态失败:', err);
      return error(res, '批量更新订单状态失败', 500);
    }
  });
}

module.exports = new OrderController();