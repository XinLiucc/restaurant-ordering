// src/utils/demo-data-statistics.js
// 数据统计模拟数据和API

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成日期范围
const generateDateRange = (days = 30) => {
  const dates = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

// 生成随机数据点
const generateRandomData = (min, max, trend = 'flat') => {
  const value = Math.random() * (max - min) + min
  
  switch (trend) {
    case 'up':
      return value * (0.8 + Math.random() * 0.4) // 上升趋势
    case 'down':
      return value * (0.6 + Math.random() * 0.4) // 下降趋势
    default:
      return value // 平稳趋势
  }
}

// 生成销售趋势数据
const generateSalesTrends = (period = 'month') => {
  let days
  switch (period) {
    case 'today':
      days = 1
      break
    case 'week':
      days = 7
      break
    case 'month':
      days = 30
      break
    case 'year':
      days = 365
      break
    default:
      days = 30
  }

  const dates = generateDateRange(days)
  
  return dates.map((date, index) => {
    const baseOrders = Math.floor(generateRandomData(15, 45, 'up'))
    const baseRevenue = baseOrders * generateRandomData(35, 85)
    
    // 周末和节假日数据会更高
    const dayOfWeek = new Date(date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const multiplier = isWeekend ? 1.3 : 1.0
    
    return {
      period: date,
      date: date,
      orderCount: Math.floor(baseOrders * multiplier),
      revenue: Number((baseRevenue * multiplier).toFixed(2)),
      averageOrderValue: Number(((baseRevenue * multiplier) / (baseOrders * multiplier)).toFixed(2))
    }
  })
}

// 生成支付方式分布数据
const generatePaymentMethodData = () => {
  const total = generateRandomData(1000, 3000)
  
  return {
    wechat: {
      count: Math.floor(total * 0.6),
      amount: Number((total * 0.6 * generateRandomData(45, 75)).toFixed(2))
    },
    alipay: {
      count: Math.floor(total * 0.25),
      amount: Number((total * 0.25 * generateRandomData(40, 70)).toFixed(2))
    },
    cash: {
      count: Math.floor(total * 0.15),
      amount: Number((total * 0.15 * generateRandomData(35, 65)).toFixed(2))
    }
  }
}

// 模拟菜品数据
const mockDishesData = [
  { id: 1, name: '宫保鸡丁', price: 28.00, categoryId: 1, categoryName: '热菜' },
  { id: 2, name: '麻婆豆腐', price: 18.00, categoryId: 1, categoryName: '热菜' },
  { id: 3, name: '糖醋里脊', price: 32.00, categoryId: 1, categoryName: '热菜' },
  { id: 4, name: '红烧肉', price: 35.00, categoryId: 1, categoryName: '热菜' },
  { id: 5, name: '鱼香肉丝', price: 26.00, categoryId: 1, categoryName: '热菜' },
  { id: 6, name: '凉拌黄瓜', price: 12.00, categoryId: 2, categoryName: '凉菜' },
  { id: 7, name: '口水鸡', price: 25.00, categoryId: 2, categoryName: '凉菜' },
  { id: 8, name: '拍黄瓜', price: 8.00, categoryId: 2, categoryName: '凉菜' },
  { id: 9, name: '番茄鸡蛋汤', price: 15.00, categoryId: 3, categoryName: '汤品' },
  { id: 10, name: '冬瓜排骨汤', price: 22.00, categoryId: 3, categoryName: '汤品' },
  { id: 11, name: '白米饭', price: 3.00, categoryId: 4, categoryName: '主食' },
  { id: 12, name: '蛋炒饭', price: 15.00, categoryId: 4, categoryName: '主食' },
  { id: 13, name: '牛肉面', price: 18.00, categoryId: 4, categoryName: '主食' },
  { id: 14, name: '可乐', price: 6.00, categoryId: 5, categoryName: '饮品' },
  { id: 15, name: '橙汁', price: 8.00, categoryId: 5, categoryName: '饮品' }
]

// 生成菜品销售统计
const generateDishStats = (period = 'month', limit = 20) => {
  const dishRanking = mockDishesData.map(dish => {
    const baseQuantity = Math.floor(generateRandomData(20, 200))
    const totalQuantity = baseQuantity
    const totalRevenue = Number((totalQuantity * dish.price).toFixed(2))
    const orderCount = Math.floor(totalQuantity * generateRandomData(0.3, 0.8))
    
    return {
      dishId: dish.id,
      dishName: dish.name,
      price: dish.price,
      totalQuantity,
      totalRevenue,
      orderCount,
      averageQuantityPerOrder: Number((totalQuantity / orderCount).toFixed(1)),
      category: {
        id: dish.categoryId,
        name: dish.categoryName
      },
      image: `https://images.unsplash.com/photo-${1565299624946 + dish.id}?w=400&h=300&fit=crop`
    }
  })

  // 按销量排序
  dishRanking.sort((a, b) => b.totalQuantity - a.totalQuantity)

  // 生成分类统计
  const categoryStats = []
  const categories = [...new Set(mockDishesData.map(d => d.categoryName))]
  
  categories.forEach((categoryName, index) => {
    const categoryDishes = dishRanking.filter(d => d.category.name === categoryName)
    const totalQuantity = categoryDishes.reduce((sum, d) => sum + d.totalQuantity, 0)
    const totalRevenue = categoryDishes.reduce((sum, d) => sum + d.totalRevenue, 0)
    
    categoryStats.push({
      category: {
        id: index + 1,
        name: categoryName
      },
      totalQuantity,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      dishCount: categoryDishes.length,
      averagePrice: Number((totalRevenue / totalQuantity).toFixed(2))
    })
  })

  // 按收入排序分类
  categoryStats.sort((a, b) => b.totalRevenue - a.totalRevenue)

  return {
    period,
    summary: {
      totalQuantity: dishRanking.reduce((sum, d) => sum + d.totalQuantity, 0),
      totalRevenue: Number(dishRanking.reduce((sum, d) => sum + d.totalRevenue, 0).toFixed(2)),
      uniqueDishes: dishRanking.length
    },
    dishRanking: dishRanking.slice(0, limit),
    categoryStats,
    trends: generateDishTrends()
  }
}

// 生成菜品销售趋势
const generateDishTrends = (days = 7) => {
  const dates = generateDateRange(days)
  
  return dates.map(date => ({
    date,
    totalSales: Math.floor(generateRandomData(100, 300)),
    topDishSales: Math.floor(generateRandomData(20, 60))
  }))
}

// 模拟用户数据
const generateUserStats = () => {
  const totalUsers = Math.floor(generateRandomData(800, 1500))
  const activeUsers = Math.floor(totalUsers * generateRandomData(0.6, 0.8))
  const newUsersToday = Math.floor(generateRandomData(5, 15))
  const newUsersWeek = Math.floor(generateRandomData(30, 60))
  const newUsersMonth = Math.floor(generateRandomData(120, 200))

  // 生成用户增长趋势
  const registrationTrend = generateDateRange(30).map(date => ({
    date,
    newUsers: Math.floor(generateRandomData(3, 12)),
    cumulativeUsers: Math.floor(generateRandomData(800, 1500))
  }))

  // 生成活跃度趋势
  const activityTrend = generateDateRange(7).map(date => ({
    date,
    activeUsers: Math.floor(generateRandomData(50, 150)),
    orderUsers: Math.floor(generateRandomData(30, 100))
  }))

  // 生成消费分布
  const spendingDistribution = [
    { range: '0-50元', count: Math.floor(totalUsers * 0.3), percentage: 30 },
    { range: '50-100元', count: Math.floor(totalUsers * 0.25), percentage: 25 },
    { range: '100-200元', count: Math.floor(totalUsers * 0.2), percentage: 20 },
    { range: '200-500元', count: Math.floor(totalUsers * 0.15), percentage: 15 },
    { range: '500元以上', count: Math.floor(totalUsers * 0.1), percentage: 10 }
  ]

  // 生成TOP用户
  const topUsers = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    nickName: `用户${index + 1}`,
    orderCount: Math.floor(generateRandomData(20, 50)),
    totalSpent: Number(generateRandomData(500, 2000).toFixed(2)),
    avgOrderValue: Number(generateRandomData(40, 80).toFixed(2)),
    lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    memberLevel: ['普通会员', 'VIP会员', '钻石会员'][Math.floor(Math.random() * 3)]
  }))

  // 按消费金额排序
  topUsers.sort((a, b) => b.totalSpent - a.totalSpent)

  return {
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      activeRate: Number(((activeUsers / totalUsers) * 100).toFixed(2))
    },
    trends: {
      registrationTrend,
      activityTrend
    },
    spendingDistribution,
    topUsers,
    demographics: {
      ageGroups: [
        { range: '18-25岁', count: Math.floor(totalUsers * 0.25), percentage: 25 },
        { range: '26-35岁', count: Math.floor(totalUsers * 0.35), percentage: 35 },
        { range: '36-45岁', count: Math.floor(totalUsers * 0.25), percentage: 25 },
        { range: '46岁以上', count: Math.floor(totalUsers * 0.15), percentage: 15 }
      ],
      genderDistribution: {
        male: Math.floor(totalUsers * 0.52),
        female: Math.floor(totalUsers * 0.48)
      }
    }
  }
}

// 模拟统计API
export const mockStatisticsAPI = {
  // 数据概览
  async getOverviewStats() {
    await delay()
    
    const today = new Date()
    const todayOrders = Math.floor(generateRandomData(20, 45))
    const todayRevenue = Number(generateRandomData(1200, 2500).toFixed(2))
    const pendingOrders = Math.floor(generateRandomData(2, 8))
    const totalCustomers = Math.floor(generateRandomData(1000, 1500))
    
    return {
      success: true,
      message: '获取数据概览成功',
      data: {
        summary: {
          todayOrders,
          todayRevenue,
          pendingOrders,
          totalCustomers,
          todayNewUsers: Math.floor(generateRandomData(5, 15)),
          totalDishes: 45,
          activeDishes: 42
        },
        trends: {
          recentOrders: generateSalesTrends('week').slice(-7)
        },
        orderStatusDistribution: {
          pending: pendingOrders,
          confirmed: Math.floor(generateRandomData(3, 8)),
          cooking: Math.floor(generateRandomData(1, 5)),
          ready: Math.floor(generateRandomData(1, 4)),
          completed: Math.floor(generateRandomData(15, 30)),
          cancelled: Math.floor(generateRandomData(1, 3))
        },
        generatedAt: new Date().toISOString()
      }
    }
  },

  // 销售统计
  async getSalesStats(params = {}) {
    await delay()
    
    const period = params.period || 'month'
    const trends = generateSalesTrends(period)
    const paymentMethodStats = generatePaymentMethodData()
    
    const totalOrders = trends.reduce((sum, item) => sum + item.orderCount, 0)
    const totalRevenue = Number(trends.reduce((sum, item) => sum + item.revenue, 0).toFixed(2))
    const completedOrders = Math.floor(totalOrders * 0.93)
    const cancelledOrders = totalOrders - completedOrders
    const averageOrderValue = Number((totalRevenue / completedOrders).toFixed(2))
    
    return {
      success: true,
      message: '获取销售统计成功',
      data: {
        period,
        dateRange: {
          startDate: trends[0]?.date,
          endDate: trends[trends.length - 1]?.date
        },
        summary: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          averageOrderValue,
          completionRate: Number(((completedOrders / totalOrders) * 100).toFixed(2)),
          cancellationRate: Number(((cancelledOrders / totalOrders) * 100).toFixed(2))
        },
        trends,
        paymentMethodStats,
        hourlyStats: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          orderCount: Math.floor(generateRandomData(0, 15)),
          revenue: Number(generateRandomData(0, 800).toFixed(2))
        })),
        generatedAt: new Date().toISOString()
      }
    }
  },

  // 菜品统计
  async getDishStats(params = {}) {
    await delay()
    
    const period = params.period || 'month'
    const limit = params.limit || 20
    const categoryId = params.categoryId
    const sortBy = params.sortBy || 'quantity'
    
    let data = generateDishStats(period, limit)
    
    // 分类筛选
    if (categoryId) {
      data.dishRanking = data.dishRanking.filter(dish => dish.category.id == categoryId)
      data.categoryStats = data.categoryStats.filter(cat => cat.category.id == categoryId)
    }
    
    // 排序
    if (sortBy === 'revenue') {
      data.dishRanking.sort((a, b) => b.totalRevenue - a.totalRevenue)
    } else {
      data.dishRanking.sort((a, b) => b.totalQuantity - a.totalQuantity)
    }
    
    return {
      success: true,
      message: '获取菜品统计成功',
      data: {
        ...data,
        filters: {
          categoryId,
          sortBy,
          sortOrder: 'DESC',
          limit
        },
        generatedAt: new Date().toISOString()
      }
    }
  },

  // 用户统计
  async getUserStats() {
    await delay()
    
    const data = generateUserStats()
    
    return {
      success: true,
      message: '获取用户统计成功',
      data: {
        ...data,
        generatedAt: new Date().toISOString()
      }
    }
  }
}

// 重新生成模拟数据
export const regenerateStatisticsMockData = () => {
  // 这里可以重新初始化一些全局数据
  console.log('Statistics mock data regenerated')
}

// 导出工具函数
export {
  generateDateRange,
  generateRandomData,
  generateSalesTrends,
  generatePaymentMethodData,
  generateDishStats,
  generateUserStats
}