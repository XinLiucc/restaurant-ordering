import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const collapsed = ref(false)
  const loading = ref(false)
  const theme = ref('light')

  // 动作
  const toggleSidebar = () => {
    collapsed.value = !collapsed.value
  }

  const setLoading = (status) => {
    loading.value = status
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    document.documentElement.className = newTheme
  }

  return {
    // 状态
    collapsed,
    loading,
    theme,
    
    // 动作
    toggleSidebar,
    setLoading,
    setTheme
  }
})

// src/api/index.js
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

export default api