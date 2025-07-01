// src/utils/demo-data.js
// 演示数据和模拟API，用于界面演示

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机ID
const generateId = () => Math.floor(Math.random() * 10000) + 1

// 生成随机订单号
const generateOrderNo = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `ORDER${dateStr}${timeStr}`
}

// 模拟分类数据
const mockCategories = [
  {
    id: 1,
    name: '热菜',
    description: '精选热菜系列，香辣可口',
    sortOrder: 1,
    status: 'active',
    dishCount: 15,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 2,
    name: '凉菜',
    description: '清爽凉菜，开胃解腻',
    sortOrder: 2,
    status: 'active',
    dishCount: 8,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 3,
    name: '汤羹',
    description: '营养汤品，滋补养生',
    sortOrder: 3,
    status: 'active',
    dishCount: 6,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 4,
    name: '主食',
    description: '米饭面条，主食系列',
    sortOrder: 4,
    status: 'active',
    dishCount: 5,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 5,
    name: '饮品',
    description: '各式饮品，解渴怡情',
    sortOrder: 5,
    status: 'active',
    dishCount: 8,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  }
]

// 模拟菜品数据
const mockDishes = [
  {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜，鸡肉鲜嫩，花生酥脆，香辣可口',
    price: '28.00',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['川菜', '热菜', '辣'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: { id: 1, name: '热菜' }
  },
  {
    id: 2,
    name: '麻婆豆腐',
    description: '麻辣鲜香，豆腐嫩滑，经典下饭菜',
    price: '18.00',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['川菜', '豆腐', '辣'],
    sortOrder: 2,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: { id: 1, name: '热菜' }
  },
  {
    id: 3,
    name: '糖醋里脊',
    description: '酸甜可口，外酥内嫩，老少皆宜',
    price: '32.00',
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['酸甜', '里脊', '热菜'],
    sortOrder: 3,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: { id: 1, name: '热菜' }
  },
  {
    id: 4,
    name: '凉拌黄瓜',
    description: '清脆爽口，简单下饭，开胃小菜',
    price: '12.00',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    categoryId: 2,
    status: 'available',
    tags: ['凉菜', '黄瓜', '清爽'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: { id: 2, name: '凉菜' }
  },
  {
    id: 5,
    name: '番茄鸡蛋汤',
    description: '家常汤品，营养丰富，酸甜开胃',
    price: '15.00',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
    categoryId: 3,
    status: 'available',
    tags: ['汤', '番茄', '鸡蛋'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: { id: 3, name: '汤羹' }
  }
]

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    nickName: '张三',
    phone: '13800138001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 2,
    nickName: '李四',
    phone: '13800138002',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 3,
    nickName: '王五',
    phone: '13800138003',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c913?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: 4,
    nickName: '赵六',
    phone: '13800138004',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
  }
]

// 模拟订单数据
const generateMockOrders = (count = 50) => {
  const orders = []
  const statuses = ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled']
  const tableNumbers = ['A01', 'A02', 'A03', 'B01', 'B02', 'B03', 'C01', 'C02']
  const remarks = ['不要辣', '多加辣', '不要香菜', '打包', '堂食', '', '', '']

  for (let i = 0; i < count; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const tableNumber = tableNumbers[Math.floor(Math.random() * tableNumbers.length)]
    const remark = remarks[Math.floor(Math.random() * remarks.length)]
    
    // 生成订单项
    const itemCount = Math.floor(Math.random() * 4) + 1
    const items = []
    let totalAmount = 0

    for (let j = 0; j < itemCount; j++) {
      const dish = mockDishes[Math.floor(Math.random() * mockDishes.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const subtotal = parseFloat(dish.price) * quantity

      items.push({
        id: generateId(),
        dishId: dish.id,
        dishName: dish.name,
        price: dish.price,
        quantity,
        subtotal: subtotal.toFixed(2),
        dish: {
          id: dish.id,
          name: dish.name,
          image: dish.image,
          description: dish.description,
          category: dish.category
        }
      })

      totalAmount += subtotal
    }

    // 生成时间（最近7天）
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000)

    orders.push({
      id: generateId(),
      orderNo: generateOrderNo(),
      userId: user.id,
      totalAmount: totalAmount.toFixed(2),
      status,
      tableNumber,
      remark,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      user,
      items
    })
  }

  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// 全局存储模拟数据
let mockOrdersData = generateMockOrders()
let mockCategoriesData = [...mockCategories]
let mockDishesData = [...mockDishes]

// 分类API模拟
export const mockCategoryAPI = {
  async getCategories(params = {}) {
    await delay()
    
    let filteredData = [...mockCategoriesData]
    
    // 搜索筛选
    if (params.search) {
      filteredData = filteredData.filter(item => 
        item.name.includes(params.search) || 
        (item.description && item.description.includes(params.search))
      )
    }
    
    // 状态筛选
    if (params.status) {
      filteredData = filteredData.filter(item => item.status === params.status)
    }
    
    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const start = (page - 1) * limit
    const end = start + limit
    const items = filteredData.slice(start, end)
    
    return {
      success: true,
      message: '获取分类列表成功',
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      }
    }
  },

  async createCategory(data) {
    await delay()
    
    const newCategory = {
      id: generateId(),
      ...data,
      dishCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockCategoriesData.push(newCategory)
    
    return {
      success: true,
      message: '创建分类成功',
      data: newCategory
    }
  },

  async updateCategory(id, data) {
    await delay()
    
    const index = mockCategoriesData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('分类不存在')
    }
    
    mockCategoriesData[index] = {
      ...mockCategoriesData[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      message: '更新分类成功',
      data: mockCategoriesData[index]
    }
  },

  async deleteCategory(id) {
    await delay()
    
    const index = mockCategoriesData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('分类不存在')
    }
    
    mockCategoriesData.splice(index, 1)
    
    return {
      success: true,
      message: '删除分类成功'
    }
  }
}

// 菜品API模拟
export const mockDishAPI = {
  async getDishes(params = {}) {
    await delay()
    
    let filteredData = [...mockDishesData]
    
    // 分类筛选
    if (params.categoryId) {
      filteredData = filteredData.filter(item => item.categoryId == params.categoryId)
    }
    
    // 状态筛选
    if (params.status) {
      filteredData = filteredData.filter(item => item.status === params.status)
    }
    
    // 搜索筛选
    if (params.search) {
      filteredData = filteredData.filter(item => 
        item.name.includes(params.search) || 
        (item.description && item.description.includes(params.search))
      )
    }
    
    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const start = (page - 1) * limit
    const end = start + limit
    const items = filteredData.slice(start, end)
    
    return {
      success: true,
      message: '获取菜品列表成功',
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      }
    }
  },

  async createDish(data) {
    await delay()
    
    const category = mockCategoriesData.find(c => c.id == data.categoryId)
    
    const newDish = {
      id: generateId(),
      ...data,
      price: data.price.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: category ? { id: category.id, name: category.name } : null
    }
    
    mockDishesData.push(newDish)
    
    return {
      success: true,
      message: '创建菜品成功',
      data: newDish
    }
  },

  async updateDish(id, data) {
    await delay()
    
    const index = mockDishesData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('菜品不存在')
    }
    
    const category = data.categoryId ? mockCategoriesData.find(c => c.id == data.categoryId) : null
    
    mockDishesData[index] = {
      ...mockDishesData[index],
      ...data,
      price: data.price ? data.price.toString() : mockDishesData[index].price,
      updatedAt: new Date().toISOString(),
      category: category ? { id: category.id, name: category.name } : mockDishesData[index].category
    }
    
    return {
      success: true,
      message: '更新菜品成功',
      data: mockDishesData[index]
    }
  },

  async deleteDish(id) {
    await delay()
    
    const index = mockDishesData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('菜品不存在')
    }
    
    mockDishesData.splice(index, 1)
    
    return {
      success: true,
      message: '删除菜品成功'
    }
  },

  async batchUpdateDishStatus(data) {
    await delay()
    
    const { dishIds, status } = data
    let updatedCount = 0
    
    mockDishesData.forEach(dish => {
      if (dishIds.includes(dish.id)) {
        dish.status = status
        dish.updatedAt = new Date().toISOString()
        updatedCount++
      }
    })
    
    return {
      success: true,
      message: `批量更新${updatedCount}个菜品状态成功`,
      data: {
        updatedCount,
        status,
        dishIds
      }
    }
  }
}

// 订单API模拟
export const mockOrderAPI = {
  async getOrders(params = {}) {
    await delay()
    
    let filteredData = [...mockOrdersData]
    
    // 状态筛选
    if (params.status) {
      filteredData = filteredData.filter(item => item.status === params.status)
    }
    
    // 日期筛选
    if (params.startDate && params.endDate) {
      const startDate = new Date(params.startDate)
      const endDate = new Date(params.endDate + 'T23:59:59')
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    // 搜索筛选
    if (params.search) {
      filteredData = filteredData.filter(item => 
        item.orderNo.includes(params.search) || 
        item.tableNumber.includes(params.search) ||
        (item.user?.nickName && item.user.nickName.includes(params.search))
      )
    }
    
    // 排序
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'DESC'
    filteredData.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (sortOrder === 'ASC') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const start = (page - 1) * limit
    const end = start + limit
    const items = filteredData.slice(start, end)
    
    return {
      success: true,
      message: '获取订单列表成功',
      data: {
        items,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      }
    }
  },

  async getOrderDetail(id) {
    await delay()
    
    const order = mockOrdersData.find(item => item.id == id)
    if (!order) {
      throw new Error('订单不存在')
    }
    
    return {
      success: true,
      message: '获取订单详情成功',
      data: order
    }
  },

  async getOrderStats(params = {}) {
    await delay()
    
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const todayOrders = mockOrdersData.filter(order => 
      new Date(order.createdAt) >= startOfDay
    )
    
    const pendingOrders = todayOrders.filter(order => order.status === 'pending')
    const completedOrders = todayOrders.filter(order => order.status === 'completed')
    
    const totalRevenue = completedOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalAmount), 0
    )
    
    return {
      success: true,
      message: '获取订单统计成功',
      data: {
        totalOrders: todayOrders.length,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        totalRevenue,
        statusDistribution: {
          pending: todayOrders.filter(o => o.status === 'pending').length,
          confirmed: todayOrders.filter(o => o.status === 'confirmed').length,
          cooking: todayOrders.filter(o => o.status === 'cooking').length,
          ready: todayOrders.filter(o => o.status === 'ready').length,
          completed: completedOrders.length,
          cancelled: todayOrders.filter(o => o.status === 'cancelled').length
        }
      }
    }
  },

  async updateOrderStatus(id, data) {
    await delay()
    
    const index = mockOrdersData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('订单不存在')
    }
    
    const oldStatus = mockOrdersData[index].status
    mockOrdersData[index].status = data.status
    mockOrdersData[index].updatedAt = new Date().toISOString()
    
    return {
      success: true,
      message: '订单状态更新成功',
      data: {
        orderId: id,
        orderNo: mockOrdersData[index].orderNo,
        oldStatus,
        newStatus: data.status,
        updatedAt: mockOrdersData[index].updatedAt
      }
    }
  },

  async batchUpdateOrderStatus(data) {
    await delay()
    
    const { orderIds, status } = data
    let updatedCount = 0
    
    mockOrdersData.forEach(order => {
      if (orderIds.includes(order.id)) {
        order.status = status
        order.updatedAt = new Date().toISOString()
        updatedCount++
      }
    })
    
    return {
      success: true,
      message: `批量更新${updatedCount}个订单状态成功`,
      data: {
        updatedCount,
        requestedCount: orderIds.length,
        status,
        orderIds
      }
    }
  }
}

// 上传API模拟
export const mockUploadAPI = {
  async uploadImage(file) {
    await delay(500)
    
    // 模拟上传成功，返回一个示例图片URL
    const imageUrls = [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop'
    ]
    
    const randomUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)]
    
    return {
      success: true,
      message: '图片上传成功',
      data: {
        filename: `${Date.now()}.jpg`,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        url: randomUrl,
        uploadedAt: new Date().toISOString()
      }
    }
  }
}

// 重新生成模拟数据的函数（用于刷新演示数据）
export const regenerateMockData = () => {
  mockOrdersData = generateMockOrders()
  mockCategoriesData = [...mockCategories]
  mockDishesData = [...mockDishes]
}

// 导出模拟数据
export {
  mockCategories,
  mockDishes,
  mockUsers,
  mockOrdersData
}