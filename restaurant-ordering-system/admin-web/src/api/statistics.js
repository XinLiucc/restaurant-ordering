import api from './index'

/**
 * 数据统计API
 */

// 数据概览
export const getOverviewStats = () => {
  return api.get('/statistics/overview')
}

// 销售统计
export const getSalesStats = (params) => {
  return api.get('/statistics/sales', params)
}

// 菜品销售统计
export const getDishStats = (params) => {
  return api.get('/statistics/dishes', params)
}

// 用户统计
export const getUserStats = () => {
  return api.get('/statistics/users')
}