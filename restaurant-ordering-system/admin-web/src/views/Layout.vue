<!-- src/views/Layout.vue -->
<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="layout-sidebar" :class="{ collapsed: appStore.collapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon"><ForkSpoon /></el-icon>
          <span v-show="!appStore.collapsed" class="logo-text">餐厅管理</span>
        </div>
      </div>
      
      <div class="sidebar-menu">
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.collapsed"
          :unique-opened="true"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          
          <el-sub-menu index="menu">
            <template #title>
              <el-icon><Menu /></el-icon>
              <span>菜单管理</span>
            </template>
            <el-menu-item index="/menu/categories">分类管理</el-menu-item>
            <el-menu-item index="/menu/dishes">菜品管理</el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/orders">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/payments">
            <el-icon><Money /></el-icon>
            <span>支付记录</span>
          </el-menu-item>
          
          <el-sub-menu index="statistics">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>数据统计</span>
            </template>
            <el-menu-item index="/statistics/sales">销售统计</el-menu-item>
            <el-menu-item index="/statistics/dishes">菜品统计</el-menu-item>
            <el-menu-item index="/statistics/users">用户统计</el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/upload">
            <el-icon><UploadFilled /></el-icon>
            <span>文件管理</span>
          </el-menu-item>
        </el-menu>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="layout-main">
      <!-- 顶部栏 -->
      <header class="layout-header">
        <div class="header-left">
          <el-button 
            type="text" 
            @click="appStore.toggleSidebar"
            class="toggle-button"
          >
            <el-icon><Expand v-if="appStore.collapsed" /><Fold v-else /></el-icon>
          </el-button>
          
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar size="small" :src="authStore.user?.avatar">
                {{ authStore.userName.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ authStore.userName }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useAuth } from '@/composables/useAuth'
import {
  ForkSpoon, DataAnalysis, Menu, Document, Money, TrendCharts,
  UploadFilled, Expand, Fold, ArrowDown, User, Setting, SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const { logout } = useAuth()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人信息页面
      break
    case 'settings':
      // 跳转到系统设置页面
      break
    case 'logout':
      logout()
      break
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layout-sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
  z-index: 100;

  &.collapsed {
    width: 64px;
  }

  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid #e5e7eb;

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: #667eea;
      white-space: nowrap;

      .logo-icon {
        font-size: 1.5rem;
      }
    }
  }

  .sidebar-menu {
    height: calc(100vh - 60px);
    overflow-y: auto;

    :deep(.el-menu) {
      border: none;
    }

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      margin: 0 0.5rem;
      border-radius: 8px;
      
      &:hover, &.is-active {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }
    }

    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      margin: 0 0.5rem;
      border-radius: 8px;
      
      &:hover {
        background: rgba(102, 126, 234, 0.05);
        color: #667eea;
      }
    }
  }
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;

    .toggle-button {
      font-size: 1.25rem;
      color: #606266;
      
      &:hover {
        color: #667eea;
      }
    }

    .breadcrumb {
      :deep(.el-breadcrumb__item) {
        font-weight: 500;
        
        &:last-child .el-breadcrumb__inner {
          color: #667eea;
        }
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: #f5f7fa;
      }

      .user-name {
        font-weight: 500;
        color: #303133;
      }

      .arrow-down {
        font-size: 0.875rem;
        color: #909399;
      }
    }
  }
}

.layout-content {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
}

// 过渡动画
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>