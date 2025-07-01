import api from './index'

/**
 * 支付管理API
 */

// 获取支付记录
export const getPayments = (params) => {
  return api.get('/payments', params)
}

// 获取支付统计
export const getPaymentStats = (params) => {
  return api.get('/payments/stats', params)
}

// 申请退款
export const refundPayment = (id, data) => {
  return api.post(`/payments/${id}/refund`, data)
}