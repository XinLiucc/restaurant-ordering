<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bg-animation"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">
          <el-icon class="title-icon"><ForkSpoon /></el-icon>
          餐厅管理平台
        </h1>
        <p class="login-subtitle">管理员登录</p>
      </div>

      <!-- 演示信息 -->
      <el-alert 
        title="演示账号"
        type="info"
        :closable="false"
        class="demo-alert"
      >
        <template #default>
          <div class="demo-info">
            <p><strong>用户名:</strong> admin</p>
            <p><strong>密码:</strong> admin123</p>
            <el-button 
              link 
              type="primary" 
              @click="fillDemo"
              style="margin-top: 8px;"
            >
              一键填充
            </el-button>
          </div>
        </template>
      </el-alert>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入管理员用户名"
            size="large"
            :prefix-icon="User"
            :disabled="loading"
            autocomplete="username"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            :disabled="loading"
            autocomplete="current-password"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p class="copyright">© 2024 餐厅管理平台. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock, ForkSpoon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'

// 组合式函数
const { login, isLoading } = useAuth()

// 响应式数据
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

// 方法
const fillDemo = () => {
  loginForm.username = 'admin'
  loginForm.password = 'admin123'
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true
    await login(loginForm)
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -1;

  .bg-animation {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="30" r="0.8" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    animation: float 20s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 450px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 24px 24px 0 0;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;

  .login-title {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .title-icon {
      font-size: 2.2rem;
      color: #667eea;
    }
  }

  .login-subtitle {
    color: #718096;
    font-size: 1rem;
    font-weight: 500;
  }
}

.demo-alert {
  margin-bottom: 1.5rem;
  border: none;
  border-radius: 12px;

  .demo-info {
    p {
      margin: 0 0 4px 0;
      font-size: 0.875rem;
    }
  }
}

.login-form {
  margin-bottom: 1.5rem;

  :deep(.el-form-item) {
    margin-bottom: 1.5rem;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;

    &:hover {
      border-color: #667eea;
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  .login-button {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    transition: all 0.2s ease;

    &:hover:not(.is-loading) {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.login-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;

  .copyright {
    color: #9ca3af;
    font-size: 0.875rem;
    margin: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-card {
    margin: 1rem;
    padding: 2rem;
  }

  .login-header .login-title {
    font-size: 1.5rem;
  }
}
</style>