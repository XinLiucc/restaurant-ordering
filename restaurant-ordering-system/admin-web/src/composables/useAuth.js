import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

/**
 * 认证相关组合式函数
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // 计算属性
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const userName = computed(() => authStore.userName)
  const isLoading = computed(() => authStore.isLoading)

  // 登录方法
  const login = async (credentials) => {
    try {
      const response = await authStore.login(credentials)
      ElMessage.success('登录成功！')
      router.push('/dashboard')
      return response
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      throw error
    }
  }

  // 登出方法
  const logout = async () => {
    try {
      await authStore.logout()
      ElMessage.success('已安全退出')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // 即使API失败也要清除本地状态
      router.push('/login')
    }
  }

  // 检查权限
  const hasPermission = (permission) => {
    // 这里可以根据用户角色和权限进行判断
    return user.value?.role === 'admin'
  }

  return {
    // 状态
    isAuthenticated,
    user,
    userName,
    isLoading,

    // 方法
    login,
    logout,
    hasPermission
  }
}