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
