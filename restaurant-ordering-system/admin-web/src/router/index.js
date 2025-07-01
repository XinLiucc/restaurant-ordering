import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '管理员登录',
      requiresAuth: false 
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '仪表板',
          requiresAuth: true 
        }
      },
      {
        path: '/menu',
        name: 'Menu',
        component: () => import('@/views/Menu.vue'),
        meta: { 
          title: '菜单管理',
          requiresAuth: true 
        }
      },
      {
        path: '/menu/categories',
        name: 'MenuCategories',
        component: () => import('@/views/Menu.vue'),
        meta: { 
          title: '分类管理',
          requiresAuth: true 
        }
      },
      {
        path: '/menu/dishes',
        name: 'MenuDishes', 
        component: () => import('@/views/Menu.vue'),
        meta: { 
          title: '菜品管理',
          requiresAuth: true 
        }
      },
      {
        path: '/orders',
        name: 'Orders', 
        component: () => import('@/views/Orders.vue'),
        meta: { 
          title: '订单管理',
          requiresAuth: true 
        }
      },
      {
        path: '/payments',
        name: 'Payments',
        component: () => import('@/views/Payments.vue'),
        meta: { 
          title: '支付管理',
          requiresAuth: true 
        }
      },
      {
        path: '/statistics',
        name: 'Statistics',
        redirect: '/statistics/sales',
        meta: { 
          title: '数据统计',
          requiresAuth: true 
        }
      },
      {
        path: '/statistics/sales',
        name: 'StatisticsSales',
        component: () => import('@/views/Statistics/Sales.vue'),
        meta: { 
          title: '销售统计',
          requiresAuth: true 
        }
      },
      {
        path: '/statistics/dishes',
        name: 'StatisticsDishes',
        component: () => import('@/views/Statistics/Dishes.vue'),
        meta: { 
          title: '菜品统计',
          requiresAuth: true 
        }
      },
      {
        path: '/statistics/users',
        name: 'StatisticsUsers',
        component: () => import('@/views/Statistics/Users.vue'),
        meta: { 
          title: '用户统计',
          requiresAuth: true 
        }
      },
      {
        path: '/upload',
        name: 'Upload',
        component: () => import('@/views/Upload.vue'),
        meta: { 
          title: '文件管理',
          requiresAuth: true 
        }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { 
          title: '系统设置',
          requiresAuth: true 
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 餐厅管理平台`
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router