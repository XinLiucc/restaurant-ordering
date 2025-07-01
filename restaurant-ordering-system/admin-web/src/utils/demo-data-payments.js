// src/utils/demo-data-payments.js
// 支付管理演示数据和模拟API函数

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成随机ID
const generateId = () => Math.floor(Math.random() * 10000) + 1

// 生成随机支付订单号
const generatePaymentNo = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `PAY${dateStr}${timeStr}`
}

// 生成随机交易号
const generateTransactionId = (method) => {
  const prefixes = {
    wechat: 'wx_',
    alipay: 'ali_',
    cash: 'cash_'
  }
  const prefix = prefixes[method] || 'pay_'
  const randomStr = Math.random().toString(36).substring(2, 15)
  return prefix + randomStr
}

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
  },
  {
    id: 5,
    nickName: '钱七',
    phone: '13800138005',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
  }
]

// 生成模拟支付数据
const generateMockPayments = (count = 80) => {
  const payments = []
  const statuses = ['pending', 'success', 'failed', 'refunded']
  const methods = ['wechat', 'alipay', 'cash']
  const statusWeights = [0.1, 0.75, 0.1, 0.05] // 成功率较高

  for (let i = 0; i < count; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    
    // 根据权重选择状态
    const random = Math.random()
    let status = 'success'
    let accumulated = 0
    for (let j = 0; j < statusWeights.length; j++) {
      accumulated += statusWeights[j]
      if (random <= accumulated) {
        status = statuses[j]
        break
      }
    }
    
    const paymentMethod = methods[Math.floor(Math.random() * methods.length)]
    const amount = (Math.random() * 200 + 10).toFixed(2) // 10-210元
    
    // 生成时间（最近30天）
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const paidAt = status === 'success' || status === 'refunded' 
      ? new Date(createdAt.getTime() + Math.random() * 30 * 60 * 1000) // 30分钟内支付
      : null
    const updatedAt = paidAt || createdAt

    // 生成订单号
    const orderNo = `ORDER${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    payments.push({
      id: generateId(),
      paymentNo: generatePaymentNo(),
      orderId: generateId(),
      amount: amount,
      paymentMethod,
      status,
      transactionId: status === 'success' || status === 'refunded' 
        ? generateTransactionId(paymentMethod) 
        : null,
      paidAt: paidAt ? paidAt.toISOString() : null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      order: {
        id: generateId(),
        orderNo: orderNo,
        status: status === 'success' ? (Math.random() > 0.3 ? 'completed' : 'confirmed') : 'pending',
        totalAmount: amount,
        user: user
      }
    })
  }

  return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// 全局存储模拟数据
let mockPaymentsData = generateMockPayments()

// 支付API模拟
export const mockPaymentAPI = {
  // 获取支付记录列表
  async getPayments(params = {}) {
    await delay()
    
    let filteredData = [...mockPaymentsData]
    
    // 状态筛选
    if (params.status) {
      filteredData = filteredData.filter(item => item.status === params.status)
    }
    
    // 支付方式筛选
    if (params.paymentMethod) {
      filteredData = filteredData.filter(item => item.paymentMethod === params.paymentMethod)
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
        item.paymentNo.includes(params.search) ||
        (item.transactionId && item.transactionId.includes(params.search)) ||
        (item.order?.orderNo && item.order.orderNo.includes(params.search))
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
      message: '获取支付记录成功',
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

  // 获取支付统计
  async getPaymentStats(params = {}) {
    await delay()
    
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // 今日支付数据
    const todayPayments = mockPaymentsData.filter(payment => 
      new Date(payment.createdAt) >= startOfDay
    )
    
    const successPayments = todayPayments.filter(p => p.status === 'success')
    const failedPayments = todayPayments.filter(p => p.status === 'failed')
    const refundedPayments = todayPayments.filter(p => p.status === 'refunded')
    
    const totalAmount = successPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0
    )
    
    const refundAmount = refundedPayments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0
    )
    
    // 支付方式统计
    const paymentMethodStats = {}
    const methodTypes = ['wechat', 'alipay', 'cash']
    
    methodTypes.forEach(method => {
      const methodPayments = successPayments.filter(p => p.paymentMethod === method)
      paymentMethodStats[method] = {
        count: methodPayments.length,
        amount: methodPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      }
    })
    
    // 状态统计
    const statusStats = {
      pending: todayPayments.filter(p => p.status === 'pending').length,
      success: successPayments.length,
      failed: failedPayments.length,
      refunded: refundedPayments.length
    }
    
    // 成功率计算
    const successRate = todayPayments.length > 0 
      ? ((successPayments.length / todayPayments.length) * 100).toFixed(2)
      : '0.00'
    
    return {
      success: true,
      message: '获取支付统计成功',
      data: {
        period: params.period || 'today',
        summary: {
          totalPayments: todayPayments.length,
          successPayments: successPayments.length,
          failedPayments: failedPayments.length,
          refundedPayments: refundedPayments.length,
          totalAmount: totalAmount,
          refundAmount: refundAmount,
          netAmount: totalAmount - refundAmount,
          successRate: successRate
        },
        paymentMethodStats,
        statusStats,
        generatedAt: new Date().toISOString()
      }
    }
  },

  // 申请退款
  async refundPayment(id, data) {
    await delay(800) // 退款处理稍慢一些
    
    const index = mockPaymentsData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('支付记录不存在')
    }
    
    const payment = mockPaymentsData[index]
    
    if (payment.status !== 'success') {
      throw new Error('只有成功的支付才能申请退款')
    }
    
    // 更新支付状态
    mockPaymentsData[index].status = 'refunded'
    mockPaymentsData[index].updatedAt = new Date().toISOString()
    
    // 如果有关联订单，更新订单状态
    if (payment.order) {
      payment.order.status = 'cancelled'
    }
    
    return {
      success: true,
      message: '退款处理成功',
      data: {
        paymentId: id,
        paymentNo: payment.paymentNo,
        refundAmount: parseFloat(payment.amount),
        refundTime: new Date().toISOString(),
        reason: data.reason || '用户申请退款',
        order: payment.order ? {
          id: payment.order.id,
          orderNo: payment.order.orderNo,
          status: 'cancelled'
        } : null
      }
    }
  },

  // 模拟支付成功（开发环境用）
  async mockPaymentSuccess(id) {
    await delay()
    
    const index = mockPaymentsData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('支付记录不存在')
    }
    
    const payment = mockPaymentsData[index]
    
    if (payment.status !== 'pending') {
      throw new Error('只有待支付的订单才能模拟支付成功')
    }
    
    // 更新支付状态
    const now = new Date().toISOString()
    mockPaymentsData[index] = {
      ...payment,
      status: 'success',
      paidAt: now,
      updatedAt: now,
      transactionId: generateTransactionId(payment.paymentMethod)
    }
    
    // 更新订单状态
    if (payment.order) {
      payment.order.status = 'confirmed'
    }
    
    return {
      success: true,
      message: '模拟支付成功',
      data: mockPaymentsData[index]
    }
  },

  // 模拟支付失败（开发环境用）
  async mockPaymentFail(id) {
    await delay()
    
    const index = mockPaymentsData.findIndex(item => item.id == id)
    if (index === -1) {
      throw new Error('支付记录不存在')
    }
    
    const payment = mockPaymentsData[index]
    
    if (payment.status !== 'pending') {
      throw new Error('只有待支付的订单才能模拟支付失败')
    }
    
    // 更新支付状态
    mockPaymentsData[index] = {
      ...payment,
      status: 'failed',
      updatedAt: new Date().toISOString()
    }
    
    return {
      success: true,
      message: '模拟支付失败',
      data: mockPaymentsData[index]
    }
  }
}

// 重新生成模拟数据的函数
export const regeneratePaymentMockData = () => {
  mockPaymentsData = generateMockPayments()
}

// 获取特定时间段的支付统计
export const getPaymentStatsByPeriod = (period = 'today') => {
  const now = new Date()
  let startDate, endDate

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'week':
      const weekStart = now.getDate() - now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), weekStart)
      endDate = new Date(now.getFullYear(), now.getMonth(), weekStart + 6, 23, 59, 59)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  }

  const periodPayments = mockPaymentsData.filter(payment => {
    const paymentDate = new Date(payment.createdAt)
    return paymentDate >= startDate && paymentDate <= endDate
  })

  return {
    total: periodPayments.length,
    success: periodPayments.filter(p => p.status === 'success').length,
    failed: periodPayments.filter(p => p.status === 'failed').length,
    refunded: periodPayments.filter(p => p.status === 'refunded').length,
    totalAmount: periodPayments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
  }
}

// 获取支付趋势数据（用于图表）
export const getPaymentTrends = (days = 7) => {
  const trends = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayPayments = mockPaymentsData.filter(payment => {
      const paymentDate = new Date(payment.createdAt)
      return paymentDate.toDateString() === date.toDateString()
    })

    const successPayments = dayPayments.filter(p => p.status === 'success')
    
    trends.push({
      date: dateStr,
      count: dayPayments.length,
      successCount: successPayments.length,
      amount: successPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      successRate: dayPayments.length > 0 
        ? ((successPayments.length / dayPayments.length) * 100).toFixed(1)
        : '0.0'
    })
  }

  return trends
}

// 导出模拟数据
export {
  mockPaymentsData,
  mockUsers
}

// 支付相关常量
export const PAYMENT_CONSTANTS = {
  STATUSES: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  METHODS: {
    WECHAT: 'wechat',
    ALIPAY: 'alipay',
    CASH: 'cash'
  },
  STATUS_COLORS: {
    pending: '#e6a23c',
    success: '#67c23a',
    failed: '#f56c6c',
    refunded: '#909399'
  },
  METHOD_COLORS: {
    wechat: '#1aad19',
    alipay: '#1677ff',
    cash: '#722ed1'
  }
}