import api from './index'

/**
 * 订单管理API
 */

// 获取订单列表
export const getOrders = (params) => {
  return api.get('/orders', params)
}

// 获取订单详情
export const getOrderDetail = (id) => {
  return api.get(`/orders/${id}`)
}

// 获取订单统计
export const getOrderStats = (params) => {
  return api.get('/orders/stats/overview', params)
}

// 更新订单状态
export const updateOrderStatus = (id, statusData) => {
  return api.put(`/orders/${id}/status`, statusData)
}

// 批量更新订单状态
export const batchUpdateOrderStatus = (data) => {
  return api.put('/orders/batch/status', data)
}