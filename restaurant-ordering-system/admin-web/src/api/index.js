import request from '@/utils/request'

/**
 * 通用API封装
 */
export const api = {
  get: (url, params) => request.get(url, { params }),
  post: (url, data) => request.post(url, data),
  put: (url, data) => request.put(url, data),
  delete: (url) => request.delete(url),
  patch: (url, data) => request.patch(url, data)
}

export * from './auth'
export * from './menu'
export * from './order'
export * from './payment'
export * from './statistics'
export * from './upload'

export default api