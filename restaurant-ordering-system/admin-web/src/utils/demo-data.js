// src/utils/demo-data.js
// 菜单管理演示数据和模拟API函数

// 模拟分类数据
export const mockCategories = [
  {
    id: 1,
    name: '热菜',
    description: '精选热菜系列，口味丰富',
    sortOrder: 1,
    status: 'active',
    dishCount: 12,
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
    name: '汤品',
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
    description: '米饭面条等主食类',
    sortOrder: 4,
    status: 'active',
    dishCount: 5,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 5,
    name: '饮品',
    description: '各类饮品茶水',
    sortOrder: 5,
    status: 'inactive',
    dishCount: 0,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z'
  }
]

// 模拟菜品数据
export const mockDishes = [
  {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜，麻辣鲜香，鸡肉嫩滑，花生酥脆',
    price: '28.00',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['川菜', '热菜', '辣味', '招牌'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 1,
      name: '热菜'
    }
  },
  {
    id: 2,
    name: '麻婆豆腐',
    description: '四川名菜，豆腐嫩滑，麻辣鲜香',
    price: '18.00',
    image: 'https://images.unsplash.com/photo-1518894781321-630e638d0742?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['川菜', '素食', '辣味'],
    sortOrder: 2,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 1,
      name: '热菜'
    }
  },
  {
    id: 3,
    name: '糖醋里脊',
    description: '酸甜可口，外酥内嫩，老少皆宜',
    price: '32.00',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    categoryId: 1,
    status: 'available',
    tags: ['酸甜', '肉类', '招牌'],
    sortOrder: 3,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 1,
      name: '热菜'
    }
  },
  {
    id: 4,
    name: '凉拌黄瓜',
    description: '清脆爽口，解腻开胃',
    price: '8.00',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    categoryId: 2,
    status: 'available',
    tags: ['清爽', '素食', '开胃'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 2,
      name: '凉菜'
    }
  },
  {
    id: 5,
    name: '口水鸡',
    description: '川味凉菜，鸡肉鲜嫩，调料丰富',
    price: '25.00',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    categoryId: 2,
    status: 'available',
    tags: ['川菜', '肉类', '辣味'],
    sortOrder: 2,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 2,
      name: '凉菜'
    }
  },
  {
    id: 6,
    name: '冬瓜排骨汤',
    description: '清淡营养，滋补养胃',
    price: '22.00',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
    categoryId: 3,
    status: 'available',
    tags: ['汤品', '清淡', '营养'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 3,
      name: '汤品'
    }
  },
  {
    id: 7,
    name: '米饭',
    description: '优质大米，粒粒饱满',
    price: '3.00',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
    categoryId: 4,
    status: 'available',
    tags: ['主食', '米饭'],
    sortOrder: 1,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 4,
      name: '主食'
    }
  },
  {
    id: 8,
    name: '蛋炒饭',
    description: '经典炒饭，香味浓郁',
    price: '15.00',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
    categoryId: 4,
    status: 'unavailable',
    tags: ['主食', '炒饭', '蛋类'],
    sortOrder: 2,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    category: {
      id: 4,
      name: '主食'
    }
  }
]

// 模拟API延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟API响应
const createResponse = (success = true, data = null, message = '') => ({
  success,
  message,
  data,
  timestamp: new Date().toISOString()
})

// 模拟分类API
export const mockCategoryAPI = {
  // 获取分类列表
  async getCategories(params = {}) {
    await delay(500)
    
    let filteredCategories = [...mockCategories]
    
    // 搜索过滤
    if (params.search) {
      filteredCategories = filteredCategories.filter(category =>
        category.name.includes(params.search) ||
        category.description.includes(params.search)
      )
    }
    
    // 状态过滤
    if (params.status) {
      filteredCategories = filteredCategories.filter(category =>
        category.status === params.status
      )
    }
    
    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const total = filteredCategories.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const items = filteredCategories.slice(startIndex, endIndex)
    
    return createResponse(true, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, '获取分类列表成功')
  },

  // 创建分类
  async createCategory(categoryData) {
    await delay(300)
    
    const newCategory = {
      id: Math.max(...mockCategories.map(c => c.id)) + 1,
      ...categoryData,
      dishCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockCategories.push(newCategory)
    
    return createResponse(true, newCategory, '创建分类成功')
  },

  // 更新分类
  async updateCategory(id, categoryData) {
    await delay(300)
    
    const index = mockCategories.findIndex(c => c.id === id)
    if (index === -1) {
      return createResponse(false, null, '分类不存在')
    }
    
    mockCategories[index] = {
      ...mockCategories[index],
      ...categoryData,
      updatedAt: new Date().toISOString()
    }
    
    return createResponse(true, mockCategories[index], '更新分类成功')
  },

  // 删除分类
  async deleteCategory(id) {
    await delay(300)
    
    const index = mockCategories.findIndex(c => c.id === id)
    if (index === -1) {
      return createResponse(false, null, '分类不存在')
    }
    
    // 检查是否有关联菜品
    const hasRelatedDishes = mockDishes.some(d => d.categoryId === id)
    if (hasRelatedDishes) {
      return createResponse(false, null, '该分类下还有菜品，无法删除')
    }
    
    mockCategories.splice(index, 1)
    
    return createResponse(true, null, '删除分类成功')
  }
}

// 模拟菜品API
export const mockDishAPI = {
  // 获取菜品列表
  async getDishes(params = {}) {
    await delay(500)
    
    let filteredDishes = [...mockDishes]
    
    // 搜索过滤
    if (params.search) {
      filteredDishes = filteredDishes.filter(dish =>
        dish.name.includes(params.search) ||
        dish.description.includes(params.search) ||
        dish.tags.some(tag => tag.includes(params.search))
      )
    }
    
    // 分类过滤
    if (params.categoryId) {
      filteredDishes = filteredDishes.filter(dish =>
        dish.categoryId === params.categoryId
      )
    }
    
    // 状态过滤
    if (params.status) {
      filteredDishes = filteredDishes.filter(dish =>
        dish.status === params.status
      )
    }
    
    // 排序
    if (params.sortBy) {
      filteredDishes.sort((a, b) => {
        const aVal = a[params.sortBy]
        const bVal = b[params.sortBy]
        
        if (params.sortOrder === 'DESC') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }
    
    // 分页
    const page = params.page || 1
    const limit = params.limit || 20
    const total = filteredDishes.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const items = filteredDishes.slice(startIndex, endIndex)
    
    return createResponse(true, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, '获取菜品列表成功')
  },

  // 创建菜品
  async createDish(dishData) {
    await delay(300)
    
    const newDish = {
      id: Math.max(...mockDishes.map(d => d.id)) + 1,
      ...dishData,
      price: dishData.price.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: mockCategories.find(c => c.id === dishData.categoryId)
    }
    
    mockDishes.push(newDish)
    
    // 更新分类的菜品数量
    const category = mockCategories.find(c => c.id === dishData.categoryId)
    if (category) {
      category.dishCount += 1
    }
    
    return createResponse(true, newDish, '创建菜品成功')
  },

  // 更新菜品
  async updateDish(id, dishData) {
    await delay(300)
    
    const index = mockDishes.findIndex(d => d.id === id)
    if (index === -1) {
      return createResponse(false, null, '菜品不存在')
    }
    
    mockDishes[index] = {
      ...mockDishes[index],
      ...dishData,
      price: dishData.price ? dishData.price.toString() : mockDishes[index].price,
      updatedAt: new Date().toISOString(),
      category: dishData.categoryId ? 
        mockCategories.find(c => c.id === dishData.categoryId) : 
        mockDishes[index].category
    }
    
    return createResponse(true, mockDishes[index], '更新菜品成功')
  },

  // 删除菜品
  async deleteDish(id) {
    await delay(300)
    
    const index = mockDishes.findIndex(d => d.id === id)
    if (index === -1) {
      return createResponse(false, null, '菜品不存在')
    }
    
    const dish = mockDishes[index]
    
    // 更新分类的菜品数量
    const category = mockCategories.find(c => c.id === dish.categoryId)
    if (category) {
      category.dishCount -= 1
    }
    
    mockDishes.splice(index, 1)
    
    return createResponse(true, null, '删除菜品成功')
  },

  // 批量更新菜品状态
  async batchUpdateDishStatus(data) {
    await delay(500)
    
    const { dishIds, status } = data
    let updatedCount = 0
    
    dishIds.forEach(id => {
      const index = mockDishes.findIndex(d => d.id === id)
      if (index !== -1) {
        mockDishes[index].status = status
        mockDishes[index].updatedAt = new Date().toISOString()
        updatedCount++
      }
    })
    
    return createResponse(true, {
      updatedCount,
      status,
      dishIds
    }, `批量更新${updatedCount}个菜品状态成功`)
  }
}

// 模拟图片上传API
export const mockUploadAPI = {
  async uploadImage(file) {
    await delay(1000)
    
    // 模拟图片上传成功，返回一个随机图片URL
    const imageUrls = [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
    ]
    
    const randomUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)]
    
    return createResponse(true, {
      filename: `${Date.now()}.jpg`,
      originalName: file.name,
      size: file.size,
      mimetype: file.type,
      url: randomUrl,
      uploadedAt: new Date().toISOString()
    }, '图片上传成功')
  }
}