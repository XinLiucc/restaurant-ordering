import api from './index'

/**
 * 认证相关API
 */

// 管理员登录
export const login = (credentials) => {
  return api.post('/auth/admin-login', credentials)
}

// 退出登录
export const logout = () => {
  return api.post('/auth/logout')
}

// 创建管理员账户
export const createAdmin = (adminData) => {
  return api.post('/auth/create-admin', adminData)
}

// 修改密码
export const changePassword = (passwordData) => {
  return api.put('/auth/change-password', passwordData)
}

// 获取管理员列表
export const getAdminList = (params) => {
  return api.get('/auth/admin-list', params)
}