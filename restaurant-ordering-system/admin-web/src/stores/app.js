import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const collapsed = ref(false)
  const loading = ref(false)
  const theme = ref('light')
  const menuActiveIndex = ref('/dashboard')

  // 计算属性
  const isCollapsed = computed(() => collapsed.value)
  const currentTheme = computed(() => theme.value)

  // 动作
  const toggleSidebar = () => {
    collapsed.value = !collapsed.value
  }

  const setSidebarCollapsed = (status) => {
    collapsed.value = status
  }

  const setLoading = (status) => {
    loading.value = status
  }

  const setTheme = (newTheme) => {
    theme.value = newTheme
    document.documentElement.className = newTheme
  }

  const setMenuActiveIndex = (index) => {
    menuActiveIndex.value = index
  }

  return {
    // 状态
    collapsed,
    loading,
    theme,
    menuActiveIndex,
    
    // 计算属性
    isCollapsed,
    currentTheme,
    
    // 动作
    toggleSidebar,
    setSidebarCollapsed,
    setLoading,
    setTheme,
    setMenuActiveIndex
  }
})   