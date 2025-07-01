/**
 * 认证工具函数
 */

// 存储键名
const STORAGE_KEYS = {
  USER: 'admin_user',
  SESSION: 'admin_session',
  TOKEN: 'admin_token'
}

/**
 * 获取存储的用户信息
 */
export function getStoredUser() {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error('Parse stored user error:', error)
    return null
  }
}

/**
 * 存储用户信息
 */
export function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

/**
 * 获取存储的会话ID
 */
export function getStoredSession() {
  return localStorage.getItem(STORAGE_KEYS.SESSION)
}

/**
 * 存储会话ID
 */
export function setStoredSession(sessionId) {
  localStorage.setItem(STORAGE_KEYS.SESSION, sessionId)
}

/**
 * 获取存储的token
 */
export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

/**
 * 存储token
 */
export function setStoredToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
}

/**
 * 清除所有认证信息
 */
export function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.USER)
  localStorage.removeItem(STORAGE_KEYS.SESSION)
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
}

/**
 * 检查是否已认证
 */
export function isAuthenticated() {
  const user = getStoredUser()
  const session = getStoredSession()
  return !!(user && session)
}

/**
 * 应用常量
 */

// API状态码
export const API_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
}

// 订单状态
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COOKING: 'cooking',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// 订单状态中文映射
export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: '待确认',
  [ORDER_STATUS.CONFIRMED]: '已确认',
  [ORDER_STATUS.COOKING]: '制作中',
  [ORDER_STATUS.READY]: '待取餐',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消'
}

// 订单状态颜色
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.CONFIRMED]: 'primary',
  [ORDER_STATUS.COOKING]: 'info',
  [ORDER_STATUS.READY]: 'success',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'danger'
}

// 支付方式
export const PAYMENT_METHODS = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CASH: 'cash'
}

// 支付方式中文映射
export const PAYMENT_METHOD_MAP = {
  [PAYMENT_METHODS.WECHAT]: '微信支付',
  [PAYMENT_METHODS.ALIPAY]: '支付宝',
  [PAYMENT_METHODS.CASH]: '现金支付'
}

// 菜品状态
export const DISH_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable'
}

// 菜品状态中文映射
export const DISH_STATUS_MAP = {
  [DISH_STATUS.AVAILABLE]: '可用',
  [DISH_STATUS.UNAVAILABLE]: '不可用'
}

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100]
}

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_COUNT: 5
}