import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getStoredUser, 
  setStoredUser, 
  getStoredSession, 
  setStoredSession,
  clearAuthStorage 
} from '@/utils/auth'
import { login, logout } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const sessionId = ref(null)
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => {
    return !!(user.value && sessionId.value)
  })

  const userName = computed(() => {
    return user.value?.nickName || user.value?.username || '管理员'
  })

  const userRole = computed(() => {
    return user.value?.role || 'admin'
  })

  // 动作
  const initAuth = () => {
    const storedUser = getStoredUser()
    const storedSession = getStoredSession()
    
    if (storedUser && storedSession) {
      user.value = storedUser
      sessionId.value = storedSession
    }
  }

  const loginAction = async (credentials) => {
    isLoading.value = true
    
    try {
      const response = await login(credentials)
      
      if (response.success) {
        user.value = response.data.user
        sessionId.value = response.data.sessionId
        
        // 存储到本地
        setStoredUser(response.data.user)
        setStoredSession(response.data.sessionId)
        
        return response
      }
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logoutAction = async () => {
    try {
      // 调用API登出
      await logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // 清除本地状态
      user.value = null
      sessionId.value = null
      clearAuthStorage()
    }
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    setStoredUser(user.value)
  }

  return {
    // 状态
    user,
    sessionId,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    userName,
    userRole,
    
    // 动作
    initAuth,
    login: loginAction,
    logout: logoutAction,
    updateUser
  }
})