import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true // 支持跨域cookie
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    
    // 添加认证token
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // 添加session ID
    if (authStore.sessionId) {
      config.headers['X-Session-ID'] = authStore.sessionId
    }

    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    
    // API返回成功
    if (data.success) {
      return data
    }
    
    // API返回失败
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(data)
  },
  error => {
    console.error('Response Error:', error)
    
    let message = '网络错误'
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message = '登录已过期，请重新登录'
          // 清除认证状态
          const authStore = useAuthStore()
          authStore.logout()
          router.push('/login')
          break
        case 403:
          message = '没有访问权限'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data?.message || `请求失败(${status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    }
    
    ElMessage.error(message)
    return Promise.reject({ 
      message, 
      status: error.response?.status,
      data: error.response?.data 
    })
  }
)

export default request