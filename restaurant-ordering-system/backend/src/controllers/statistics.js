// controllers/statistics.js - 修复字段映射问题的统计报表控制器
const { Order, OrderItem, Payment, User, Dish, Category, sequelize } = require('../models');
const { success, error, notFound } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

/**
 * 统计报表控制器
 */
class StatisticsController {
  /**
   * 数据概览
   * GET /api/statistics/overview
   */
  getOverview = asyncHandler(async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 今日统计
      const [
        todayOrders,
        todayRevenue,
        pendingOrders,
        totalCustomers,
        todayNewUsers,
        totalDishes,
        activeDishes
      ] = await Promise.all([
        // 今日订单数
        Order.count({
          where: {
            createdAt: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }),
        
        // 今日收入（已完成订单）
        Order.sum('totalAmount', {
          where: {
            status: 'completed',
            createdAt: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }),
        
        // 待处理订单数
        Order.count({
          where: {
            status: ['pending', 'confirmed', 'cooking', 'ready']
          }
        }),
        
        // 总用户数
        User.count({
          where: { role: 'customer' }
        }),
        
        // 今日新增用户
        User.count({
          where: {
            role: 'customer',
            createdAt: {
              [Op.gte]: today,
              [Op.lt]: tomorrow
            }
          }
        }),
        
        // 总菜品数
        Dish.count(),
        
        // 可用菜品数
        Dish.count({
          where: { status: 'available' }
        })
      ]);

      // 获取最近7天的订单趋势
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentOrders = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
        ],
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo
          },
          status: 'completed'
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // 订单状态分布
      const orderStatusStats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const statusDistribution = {};
      orderStatusStats.forEach(stat => {
        statusDistribution[stat.status] = parseInt(stat.count);
      });

      return success(res, {
        summary: {
          todayOrders,
          todayRevenue: todayRevenue || 0,
          pendingOrders,
          totalCustomers,
          todayNewUsers,
          totalDishes,
          activeDishes
        },
        trends: {
          recentOrders: recentOrders.map(item => ({
            date: item.date,
            orderCount: parseInt(item.orderCount),
            revenue: parseFloat(item.revenue) || 0
          }))
        },
        orderStatusDistribution: statusDistribution,
        generatedAt: new Date().toISOString()
      }, '获取数据概览成功');

    } catch (err) {
      console.error('获取数据概览失败:', err);
      return error(res, '获取数据概览失败', 500);
    }
  });

  /**
   * 销售统计
   * GET /api/statistics/sales
   */
  getSalesStats = asyncHandler(async (req, res) => {
    const { period = 'month', startDate, endDate } = req.query;

    try {
      let dateCondition = {};
      const now = new Date();

      // 构建日期条件
      if (startDate && endDate) {
        dateCondition = {
          createdAt: {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
        };
      } else {
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
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateCondition = {
              createdAt: {
                [Op.gte]: yearAgo
              }
            };
            break;
        }
      }

      // 销售统计
      const [
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        
        // 支付方式统计
        paymentStats
      ] = await Promise.all([
        Order.count({ where: dateCondition }),
        
        Order.count({ 
          where: { 
            ...dateCondition, 
            status: 'completed' 
          } 
        }),
        
        Order.count({ 
          where: { 
            ...dateCondition, 
            status: 'cancelled' 
          } 
        }),
        
        Order.sum('totalAmount', { 
          where: { 
            ...dateCondition, 
            status: 'completed' 
          } 
        }),
        
        Order.findOne({
          attributes: [[sequelize.fn('AVG', sequelize.col('total_amount')), 'avgValue']],
          where: { 
            ...dateCondition, 
            status: 'completed' 
          },
          raw: true
        }),
        
        // 支付方式统计
        Payment.findAll({
          attributes: [
            'paymentMethod',
            [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('Payment.amount')), 'amount']
          ],
          include: [{
            model: Order,
            as: 'order',
            where: {
              ...dateCondition,
              status: 'completed'
            },
            attributes: []
          }],
          where: { status: 'success' },
          group: ['paymentMethod'],
          raw: true
        })
      ]);

      // 按日期分组的销售趋势
      let groupFormat = '%Y-%m-%d';
      if (period === 'year' || (startDate && endDate && 
          (new Date(endDate) - new Date(startDate)) > 90 * 24 * 60 * 60 * 1000)) {
        groupFormat = '%Y-%m';
      }

      const salesTrend = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
        ],
        where: {
          ...dateCondition,
          status: 'completed'
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'ASC']],
        raw: true
      });

      // 处理支付方式统计
      const paymentMethodStats = {};
      paymentStats.forEach(stat => {
        paymentMethodStats[stat.paymentMethod] = {
          count: parseInt(stat.count),
          amount: parseFloat(stat.amount) || 0
        };
      });

      return success(res, {
        period: period,
        dateRange: {
          startDate: startDate || dateCondition.createdAt?.[Op.gte]?.toISOString(),
          endDate: endDate || new Date().toISOString()
        },
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue: totalRevenue || 0,
          averageOrderValue: parseFloat(averageOrderValue?.avgValue) || 0,
          completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
          cancellationRate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : 0
        },
        trends: salesTrend.map(item => ({
          period: item.period,
          orderCount: parseInt(item.orderCount),
          revenue: parseFloat(item.revenue) || 0
        })),
        paymentMethodStats,
        generatedAt: new Date().toISOString()
      }, '获取销售统计成功');

    } catch (err) {
      console.error('获取销售统计失败:', err);
      return error(res, '获取销售统计失败', 500);
    }
  });

  /**
   * 菜品销售统计 - 修复字段映射问题
   * GET /api/statistics/dishes
   */
  getDishStats = asyncHandler(async (req, res) => {
    const { 
      period = 'month',
      limit = 20,
      categoryId,
      sortBy = 'quantity',
      sortOrder = 'DESC'
    } = req.query;

    try {
      let dateCondition = {};
      const now = new Date();

      // 构建日期条件
      switch (period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateCondition = { createdAt: { [Op.gte]: today } };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateCondition = { createdAt: { [Op.gte]: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          dateCondition = { createdAt: { [Op.gte]: monthAgo } };
          break;
      }

      // 构建查询条件
      const includeConditions = [
        {
          model: Order,
          as: 'order',
          where: {
            ...dateCondition,
            status: 'completed'
          },
          attributes: []
        },
        {
          model: Dish,
          as: 'dish',
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }]
        }
      ];

      // 分类筛选
      if (categoryId) {
        includeConditions[1].where = { categoryId: parseInt(categoryId) };
      }

      // 菜品销售排行 - 修复字段名
      const dishSalesRanking = await OrderItem.findAll({
        attributes: [
          'dish_id',  // 使用数据库实际字段名
          'dish_name',
          'price',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order.id'))), 'orderCount']
        ],
        include: includeConditions,
        group: ['dish_id', 'dish_name', 'price'],
        order: [
          sortBy === 'revenue' 
            ? [sequelize.fn('SUM', sequelize.col('subtotal')), sortOrder.toUpperCase()]
            : [sequelize.fn('SUM', sequelize.col('quantity')), sortOrder.toUpperCase()]
        ],
        limit: parseInt(limit),
        raw: false
      });

      // 分类销售统计
      const categoryStats = await OrderItem.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('dish_id'))), 'dishCount']  // 修复字段名
        ],
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              ...dateCondition,
              status: 'completed'
            },
            attributes: []
          },
          {
            model: Dish,
            as: 'dish',
            attributes: [],
            include: [{
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }]
          }
        ],
        group: ['dish.category.id'],
        raw: false
      });

      // 处理菜品排行数据
      const dishRanking = dishSalesRanking.map(item => ({
        dishId: item.dish_id,  // 从数据库字段映射到前端
        dishName: item.dish_name,
        price: parseFloat(item.price),
        totalQuantity: parseInt(item.getDataValue('totalQuantity')),
        totalRevenue: parseFloat(item.getDataValue('totalRevenue')),
        orderCount: parseInt(item.getDataValue('orderCount')),
        category: item.dish?.category || null,
        image: item.dish?.image || null
      }));

      // 处理分类统计数据
      const categoryStatsData = categoryStats.map(item => ({
        category: item.dish?.category || { id: 0, name: '未分类' },
        totalQuantity: parseInt(item.getDataValue('totalQuantity')),
        totalRevenue: parseFloat(item.getDataValue('totalRevenue')),
        dishCount: parseInt(item.getDataValue('dishCount'))
      }));

      // 总计数据 - 修复字段名
      const totalStats = await OrderItem.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
          [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('dish_id'))), 'uniqueDishes']  // 修复字段名
        ],
        include: [{
          model: Order,
          as: 'order',
          where: {
            ...dateCondition,
            status: 'completed'
          },
          attributes: []
        }],
        raw: true
      });

      return success(res, {
        period,
        filters: {
          categoryId: categoryId || null,
          sortBy,
          sortOrder,
          limit: parseInt(limit)
        },
        summary: {
          totalQuantity: parseInt(totalStats?.totalQuantity) || 0,
          totalRevenue: parseFloat(totalStats?.totalRevenue) || 0,
          uniqueDishes: parseInt(totalStats?.uniqueDishes) || 0
        },
        dishRanking,
        categoryStats: categoryStatsData,
        generatedAt: new Date().toISOString()
      }, '获取菜品统计成功');

    } catch (err) {
      console.error('获取菜品统计失败:', err);
      return error(res, '获取菜品统计失败', 500);
    }
  });

  /**
   * 销售趋势分析
   * GET /api/statistics/trends
   */
  getTrends = asyncHandler(async (req, res) => {
    const { period = 'month', granularity = 'day' } = req.query;

    try {
      let dateCondition = {};
      let groupFormat = '%Y-%m-%d'; // 默认按天
      const now = new Date();

      // 根据期间设置日期条件
      switch (period) {
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateCondition = { createdAt: { [Op.gte]: weekAgo } };
          groupFormat = '%Y-%m-%d';
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          dateCondition = { createdAt: { [Op.gte]: monthAgo } };
          groupFormat = granularity === 'week' ? '%Y-%u' : '%Y-%m-%d';
          break;
        case 'quarter':
          const quarterAgo = new Date(now);
          quarterAgo.setMonth(now.getMonth() - 3);
          dateCondition = { createdAt: { [Op.gte]: quarterAgo } };
          groupFormat = granularity === 'month' ? '%Y-%m' : '%Y-%u';
          break;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          dateCondition = { createdAt: { [Op.gte]: yearAgo } };
          groupFormat = '%Y-%m';
          break;
      }

      // 销售趋势
      const salesTrend = await Order.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
          [sequelize.fn('AVG', sequelize.col('total_amount')), 'avgOrderValue']
        ],
        where: {
          ...dateCondition,
          status: 'completed'
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'ASC']],
        raw: true
      });

      // 用户注册趋势
      const userTrend = await User.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'newUsers']
        ],
        where: {
          role: 'customer',
          ...dateCondition
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'ASC']],
        raw: true
      });

      // 支付成功率趋势
      const paymentTrend = await Payment.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), groupFormat), 'period'],
          [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'totalPayments'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN Payment.status = 'success' THEN 1 ELSE 0 END")), 'successPayments']
        ],
        include: [{
          model: Order,
          as: 'order',
          where: dateCondition,
          attributes: []
        }],
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), groupFormat)],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('Payment.created_at'), groupFormat), 'ASC']],
        raw: true
      });

      // 合并趋势数据
      const trendsMap = new Map();

      // 处理销售趋势
      salesTrend.forEach(item => {
        trendsMap.set(item.period, {
          period: item.period,
          orderCount: parseInt(item.orderCount),
          revenue: parseFloat(item.revenue) || 0,
          avgOrderValue: parseFloat(item.avgOrderValue) || 0,
          newUsers: 0,
          paymentSuccessRate: 0
        });
      });

      // 处理用户趋势
      userTrend.forEach(item => {
        const existing = trendsMap.get(item.period) || { period: item.period };
        trendsMap.set(item.period, {
          ...existing,
          newUsers: parseInt(item.newUsers)
        });
      });

      // 处理支付趋势
      paymentTrend.forEach(item => {
        const existing = trendsMap.get(item.period) || { period: item.period };
        const totalPayments = parseInt(item.totalPayments);
        const successPayments = parseInt(item.successPayments);
        trendsMap.set(item.period, {
          ...existing,
          paymentSuccessRate: totalPayments > 0 ? ((successPayments / totalPayments) * 100).toFixed(2) : 0
        });
      });

      // 转换为数组并排序
      const trends = Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period));

      return success(res, {
        period,
        granularity,
        dataPoints: trends.length,
        trends,
        summary: {
          totalRevenue: trends.reduce((sum, item) => sum + item.revenue, 0),
          totalOrders: trends.reduce((sum, item) => sum + item.orderCount, 0),
          totalNewUsers: trends.reduce((sum, item) => sum + item.newUsers, 0),
          avgPaymentSuccessRate: trends.length > 0 
            ? (trends.reduce((sum, item) => sum + parseFloat(item.paymentSuccessRate), 0) / trends.length).toFixed(2)
            : 0
        },
        generatedAt: new Date().toISOString()
      }, '获取销售趋势成功');

    } catch (err) {
      console.error('获取销售趋势失败:', err);
      return error(res, '获取销售趋势失败', 500);
    }
  });

  /**
   * 收入报表
   * GET /api/statistics/revenue
   */
  getRevenue = asyncHandler(async (req, res) => {
    const { type = 'summary' } = req.query; // summary, detail, comparison

    try {
      const now = new Date();

      // 计算各个时间段的收入
      const [
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue
      ] = await Promise.all([
        // 今日收入
        this.getRevenueByPeriod('today'),
        // 本周收入
        this.getRevenueByPeriod('week'),
        // 本月收入
        this.getRevenueByPeriod('month'),
        // 本年收入
        this.getRevenueByPeriod('year')
      ]);

      if (type === 'summary') {
        return success(res, {
          summary: {
            daily: dailyRevenue,
            weekly: weeklyRevenue,
            monthly: monthlyRevenue,
            yearly: yearlyRevenue
          },
          generatedAt: new Date().toISOString()
        }, '获取收入概要成功');
      }

      // 详细收入分析
      if (type === 'detail') {
        const [
          revenueByCategory,
          revenueByPaymentMethod,
          hourlyRevenue
        ] = await Promise.all([
          this.getRevenueByCategory(),
          this.getRevenueByPaymentMethod(),
          this.getHourlyRevenue()
        ]);

        return success(res, {
          summary: {
            daily: dailyRevenue,
            weekly: weeklyRevenue,
            monthly: monthlyRevenue,
            yearly: yearlyRevenue
          },
          details: {
            byCategory: revenueByCategory,
            byPaymentMethod: revenueByPaymentMethod,
            byHour: hourlyRevenue
          },
          generatedAt: new Date().toISOString()
        }, '获取详细收入报表成功');
      }

      // 同比环比分析
      if (type === 'comparison') {
        const [
          lastMonthRevenue,
          lastYearSameMonthRevenue
        ] = await Promise.all([
          this.getRevenueByPeriod('lastMonth'),
          this.getRevenueByPeriod('lastYearSameMonth')
        ]);

        const monthlyGrowth = lastMonthRevenue > 0 
          ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2)
          : 0;

        const yearlyGrowth = lastYearSameMonthRevenue > 0
          ? (((monthlyRevenue - lastYearSameMonthRevenue) / lastYearSameMonthRevenue) * 100).toFixed(2)
          : 0;

        return success(res, {
          current: {
            daily: dailyRevenue,
            weekly: weeklyRevenue,
            monthly: monthlyRevenue,
            yearly: yearlyRevenue
          },
          comparison: {
            lastMonth: lastMonthRevenue,
            lastYearSameMonth: lastYearSameMonthRevenue,
            monthlyGrowthRate: parseFloat(monthlyGrowth),
            yearlyGrowthRate: parseFloat(yearlyGrowth)
          },
          generatedAt: new Date().toISOString()
        }, '获取收入对比分析成功');
      }

    } catch (err) {
      console.error('获取收入报表失败:', err);
      return error(res, '获取收入报表失败', 500);
    }
  });

  /**
   * 用户统计
   * GET /api/statistics/users
   */
  getUserStats = asyncHandler(async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);

      // 用户基本统计
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth
      ] = await Promise.all([
        User.count({ where: { role: 'customer' } }),
        
        // 活跃用户（最近30天有订单的用户）- 使用原生SQL查询避免复杂关联
        sequelize.query(`
          SELECT COUNT(DISTINCT u.id) as count
          FROM users u
          INNER JOIN orders o ON u.id = o.user_id
          WHERE u.role = 'customer' 
            AND o.created_at >= :monthAgo
        `, {
          replacements: { monthAgo },
          type: sequelize.QueryTypes.SELECT
        }).then(result => result[0].count),
        
        User.count({
          where: {
            role: 'customer',
            createdAt: { [Op.gte]: today }
          }
        }),
        
        User.count({
          where: {
            role: 'customer',
            createdAt: { [Op.gte]: weekAgo }
          }
        }),
        
        User.count({
          where: {
            role: 'customer',
            createdAt: { [Op.gte]: monthAgo }
          }
        })
      ]);

      // 用户注册趋势（最近30天）
      const userRegistrationTrend = await User.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'newUsers']
        ],
        where: {
          role: 'customer',
          createdAt: { [Op.gte]: monthAgo }
        },
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // 用户消费统计 - 使用原生SQL查询避免复杂的Sequelize关联问题
      const userConsumptionStats = await sequelize.query(`
        SELECT 
          u.id,
          u.nick_name as nickName,
          COUNT(o.id) as orderCount,
          SUM(o.total_amount) as totalSpent,
          AVG(o.total_amount) as avgOrderValue,
          MAX(o.created_at) as lastOrderDate
        FROM users u
        INNER JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer' 
          AND o.status = 'completed'
        GROUP BY u.id, u.nick_name
        HAVING COUNT(o.id) > 0
        ORDER BY SUM(o.total_amount) DESC
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return success(res, {
        summary: {
          totalUsers,
          activeUsers: parseInt(activeUsers),
          inactiveUsers: totalUsers - parseInt(activeUsers),
          newUsersToday,
          newUsersWeek,
          newUsersMonth,
          activeRate: totalUsers > 0 ? ((parseInt(activeUsers) / totalUsers) * 100).toFixed(2) : 0
        },
        trends: {
          registrationTrend: userRegistrationTrend.map(item => ({
            date: item.date,
            newUsers: parseInt(item.newUsers)
          }))
        },
        topUsers: userConsumptionStats.map(user => ({
          id: user.id,
          nickName: user.nickName,
          orderCount: parseInt(user.orderCount),
          totalSpent: parseFloat(user.totalSpent) || 0,
          avgOrderValue: parseFloat(user.avgOrderValue) || 0,
          lastOrderDate: user.lastOrderDate
        })),
        generatedAt: new Date().toISOString()
      }, '获取用户统计成功');

    } catch (err) {
      console.error('获取用户统计失败:', err);
      return error(res, '获取用户统计失败', 500);
    }
  });

  // ===== 辅助方法 =====

  /**
   * 根据时间段获取收入
   */
  async getRevenueByPeriod(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'lastYearSameMonth':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        endDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }

    const whereCondition = {
      status: 'completed',
      createdAt: { [Op.gte]: startDate }
    };

    if (endDate) {
      whereCondition.createdAt[Op.lte] = endDate;
    }

    const revenue = await Order.sum('total_amount', { where: whereCondition });
    return revenue || 0;
  }

  /**
   * 按分类获取收入 - 修复字段映射
   */
  async getRevenueByCategory() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await OrderItem.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'revenue'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'quantity']
      ],
      include: [
        {
          model: Order,
          as: 'order',
          where: {
            status: 'completed',
            createdAt: { [Op.gte]: thirtyDaysAgo }
          },
          attributes: []
        },
        {
          model: Dish,
          as: 'dish',
          attributes: [],
          include: [{
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }]
        }
      ],
      group: ['dish.category.id'],
      raw: false
    });
  }

  /**
   * 按支付方式获取收入
   */
  async getRevenueByPaymentMethod() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await Payment.findAll({
      attributes: [
        'paymentMethod',
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        status: 'success',
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      group: ['paymentMethod'],
      raw: true
    });
  }

  /**
   * 获取小时级收入分布
   */
  async getHourlyRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await Order.findAll({
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('created_at')), 'hour'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: today }
      },
      group: [sequelize.fn('HOUR', sequelize.col('created_at'))],
      order: [[sequelize.fn('HOUR', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
  }
}

module.exports = new StatisticsController();