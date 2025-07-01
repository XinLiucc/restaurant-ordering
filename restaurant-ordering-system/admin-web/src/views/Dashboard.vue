<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表板</h1>
      <p class="page-subtitle">餐厅运营数据概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.key">
        <div class="stat-icon" :style="{ background: stat.color }">
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-change" :class="stat.changeType">
            <el-icon><TrendCharts /></el-icon>
            {{ stat.change }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图表和数据 -->
    <div class="dashboard-content">
      <div class="chart-section">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>今日订单趋势</span>
              <el-button type="text" @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              📊 订单趋势图表
              <p class="chart-note">这里将显示今日订单数量变化趋势</p>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>支付方式分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="chart-placeholder">
              🥧 支付方式饼图
              <p class="chart-note">显示各种支付方式的使用比例</p>
            </div>
          </div>
        </el-card>
      </div>

      <div class="data-section">
        <!-- 最近订单 -->
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="text" @click="$router.push('/orders')">
                查看全部
              </el-button>
            </div>
          </template>
          
          <div v-loading="loading.orders">
            <div v-if="recentOrders.length === 0" class="empty-state">
              <el-empty description="暂无订单数据" />
            </div>
            <div v-else class="order-list">
              <div 
                v-for="order in recentOrders" 
                :key="order.id" 
                class="order-item"
              >
                <div class="order-info">
                  <div class="order-no">{{ order.orderNo }}</div>
                  <div class="order-time">{{ formatTime(order.createdAt) }}</div>
                </div>
                <div class="order-amount">¥{{ order.totalAmount }}</div>
                <el-tag 
                  :type="getOrderStatusType(order.status)"
                  size="small"
                >
                  {{ getOrderStatusText(order.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 热销菜品 -->
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>热销菜品</span>
              <el-button type="text" @click="$router.push('/statistics/dishes')">
                查看详情
              </el-button>
            </div>
          </template>
          
          <div v-loading="loading.dishes">
            <div v-if="hotDishes.length === 0" class="empty-state">
              <el-empty description="暂无数据" />
            </div>
            <div v-else class="dish-list">
              <div 
                v-for="(dish, index) in hotDishes" 
                :key="dish.dishId" 
                class="dish-item"
              >
                <div class="dish-rank">{{ index + 1 }}</div>
                <div class="dish-info">
                  <div class="dish-name">{{ dish.dishName }}</div>
                  <div class="dish-sales">销量: {{ dish.totalQuantity }}</div>
                </div>
                <div class="dish-revenue">¥{{ dish.totalRevenue }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  TrendCharts, Refresh, DataAnalysis, Document, 
  Money, User as UserIcon 
} from '@element-plus/icons-vue'
import { getOverviewStats, getOrders, getDishStats } from '@/api'
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS } from '@/utils/constants'

// 响应式数据
const loading = reactive({
  overview: false,
  orders: false,
  dishes: false
})

const stats = ref([
  {
    key: 'todayOrders',
    label: '今日订单',
    value: '0',
    change: '+0%',
    changeType: 'positive',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: Document
  },
  {
    key: 'todayRevenue',
    label: '今日营收',
    value: '¥0',
    change: '+0%',
    changeType: 'positive',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: Money
  },
  {
    key: 'pendingOrders',
    label: '待处理订单',
    value: '0',
    change: '0',
    changeType: 'neutral',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: DataAnalysis
  },
  {
    key: 'totalCustomers',
    label: '总用户数',
    value: '0',
    change: '+0',
    changeType: 'positive',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: UserIcon
  }
])

const recentOrders = ref([])
const hotDishes = ref([])

// 方法
const loadOverviewData = async () => {
  loading.overview = true
  try {
    const response = await getOverviewStats()
    if (response.success) {
      const data = response.data.summary
      
      // 更新统计数据
      stats.value[0].value = data.todayOrders?.toString() || '0'
      stats.value[1].value = `¥${data.todayRevenue?.toFixed(2) || '0.00'}`
      stats.value[2].value = data.pendingOrders?.toString() || '0'
      stats.value[3].value = data.totalCustomers?.toString() || '0'
    }
  } catch (error) {
    console.error('Load overview data error:', error)
  } finally {
    loading.overview = false
  }
}

const loadRecentOrders = async () => {
  loading.orders = true
  try {
    const response = await getOrders({ 
      page: 1, 
      limit: 5, 
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    })
    if (response.success) {
      recentOrders.value = response.data.items
    }
  } catch (error) {
    console.error('Load recent orders error:', error)
  } finally {
    loading.orders = false
  }
}

const loadHotDishes = async () => {
  loading.dishes = true
  try {
    const response = await getDishStats({ 
      period: 'week',
      limit: 5,
      sortBy: 'quantity'
    })
    if (response.success) {
      hotDishes.value = response.data.dishRanking
    }
  } catch (error) {
    console.error('Load hot dishes error:', error)
  } finally {
    loading.dishes = false
  }
}

const refreshData = () => {
  loadOverviewData()
  loadRecentOrders()
  loadHotDishes()
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getOrderStatusText = (status) => {
  return ORDER_STATUS_MAP[status] || status
}

const getOrderStatusType = (status) => {
  const colorMap = {
    pending: 'warning',
    confirmed: 'primary',
    cooking: 'info',
    ready: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return colorMap[status] || 'info'
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped lang="scss">
.dashboard {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
  
  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #303133;
    margin-bottom: 0.5rem;
  }
  
  .page-subtitle {
    color: #909399;
    font-size: 1rem;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #303133;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #909399;
    margin-bottom: 0.5rem;
  }

  .stat-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;

    &.positive {
      color: #67c23a;
    }

    &.negative {
      color: #f56c6c;
    }

    &.neutral {
      color: #909399;
    }
  }
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;

  .chart-container {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-placeholder {
    text-align: center;
    color: #909399;
    font-size: 2rem;

    .chart-note {
      font-size: 0.875rem;
      margin-top: 1rem;
      color: #c0c4cc;
    }
  }
}

.data-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.data-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.order-list, .dish-list {
  max-height: 300px;
  overflow-y: auto;
}

.order-item, .dish-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
}

.order-item {
  .order-info {
    flex: 1;
    
    .order-no {
      font-weight: 500;
      color: #303133;
      margin-bottom: 0.25rem;
    }
    
    .order-time {
      font-size: 0.75rem;
      color: #909399;
    }
  }

  .order-amount {
    font-weight: 600;
    color: #667eea;
    margin-right: 1rem;
  }
}

.dish-item {
  .dish-rank {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
  }

  .dish-info {
    flex: 1;
    
    .dish-name {
      font-weight: 500;
      color: #303133;
      margin-bottom: 0.25rem;
    }
    
    .dish-sales {
      font-size: 0.75rem;
      color: #909399;
    }
  }

  .dish-revenue {
    font-weight: 600;
    color: #f56c6c;
  }
}

.empty-state {
  padding: 2rem;
  text-align: center;
}

// 响应式设计
@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard {
    padding: 1rem;
  }
}</style>