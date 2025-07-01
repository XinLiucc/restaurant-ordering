<!-- src/views/Dashboard.vue -->
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
              <div class="header-actions">
                <el-select 
                  v-model="orderTrendPeriod" 
                  @change="loadOrderTrendData"
                  size="small"
                  style="width: 100px; margin-right: 8px;"
                >
                  <el-option label="今日" value="today" />
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                </el-select>
                <el-button type="text" @click="refreshData">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <div class="chart-container" v-loading="loading.orderTrend">
            <canvas ref="orderTrendChartRef" v-show="!loading.orderTrend"></canvas>
            <div v-if="loading.orderTrend" class="chart-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>加载订单趋势数据...</p>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>支付方式分布</span>
              <div class="payment-stats">
                <span class="total-amount">总计: ¥{{ paymentTotalAmount }}</span>
              </div>
            </div>
          </template>
          <div class="chart-container" v-loading="loading.paymentStats">
            <canvas ref="paymentChartRef" v-show="!loading.paymentStats"></canvas>
            <div v-if="loading.paymentStats" class="chart-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>加载支付数据...</p>
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
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  TrendCharts, Refresh, DataAnalysis, Document, 
  Money, User as UserIcon, Loading 
} from '@element-plus/icons-vue'
import { getOverviewStats, getOrders, getDishStats } from '@/api'
import { getPaymentStats, getSalesStats } from '@/api'
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS } from '@/utils/constants'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  DoughnutController
} from 'chart.js'

// 注册Chart.js组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  DoughnutController
)

// 响应式数据
const loading = reactive({
  overview: false,
  orders: false,
  dishes: false,
  orderTrend: false,
  paymentStats: false
})

// 图表相关
const orderTrendChartRef = ref(null)
const paymentChartRef = ref(null)
let orderTrendChart = null
let paymentChart = null
const orderTrendPeriod = ref('today')
const paymentTotalAmount = ref('0.00')

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

// 加载订单趋势数据
const loadOrderTrendData = async () => {
  loading.orderTrend = true
  try {
    const response = await getSalesStats({ period: orderTrendPeriod.value })
    if (response.success && response.data.trends) {
      const trends = response.data.trends
      updateOrderTrendChart(trends)
    } else {
      // 模拟数据用于演示
      const mockData = generateMockOrderTrend()
      updateOrderTrendChart(mockData)
    }
  } catch (error) {
    console.error('Load order trend error:', error)
    // 使用模拟数据
    const mockData = generateMockOrderTrend()
    updateOrderTrendChart(mockData)
  } finally {
    loading.orderTrend = false
  }
}

// 加载支付统计数据
const loadPaymentStats = async () => {
  loading.paymentStats = true
  try {
    const response = await getPaymentStats({ period: 'today' })
    if (response.success && response.data.paymentMethodStats) {
      const paymentData = response.data.paymentMethodStats
      paymentTotalAmount.value = response.data.summary.totalAmount.toFixed(2)
      updatePaymentChart(paymentData)
    } else {
      // 模拟数据用于演示
      const mockData = generateMockPaymentData()
      updatePaymentChart(mockData)
    }
  } catch (error) {
    console.error('Load payment stats error:', error)
    // 使用模拟数据
    const mockData = generateMockPaymentData()
    updatePaymentChart(mockData)
  } finally {
    loading.paymentStats = false
  }
}

// 生成模拟订单趋势数据
const generateMockOrderTrend = () => {
  const hours = []
  const orders = []
  const currentHour = new Date().getHours()
  
  for (let i = 0; i <= currentHour; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00`)
    // 模拟一天中的订单分布（中午和晚上高峰）
    let orderCount = Math.random() * 10
    if (i >= 11 && i <= 13) orderCount += Math.random() * 15 // 午餐高峰
    if (i >= 17 && i <= 20) orderCount += Math.random() * 20 // 晚餐高峰
    orders.push(Math.floor(orderCount))
  }
  
  return hours.map((hour, index) => ({
    period: hour,
    orderCount: orders[index],
    revenue: orders[index] * (30 + Math.random() * 50)
  }))
}

// 生成模拟支付数据
const generateMockPaymentData = () => {
  const total = 1580.50
  return {
    wechat: { count: 18, amount: total * 0.6 },
    alipay: { count: 8, amount: total * 0.25 },
    cash: { count: 3, amount: total * 0.15 }
  }
}

// 更新订单趋势图表
const updateOrderTrendChart = (data) => {
  if (!orderTrendChartRef.value) return
  
  const ctx = orderTrendChartRef.value.getContext('2d')
  
  if (orderTrendChart) {
    orderTrendChart.destroy()
  }
  
  orderTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(item => item.period),
      datasets: [{
        label: '订单数量',
        data: data.map(item => item.orderCount),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (tooltipItems) => {
              return `时间: ${tooltipItems[0].label}`
            },
            label: (context) => {
              return `订单数: ${context.parsed.y} 单`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#909399'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(144, 147, 153, 0.1)'
          },
          ticks: {
            color: '#909399',
            stepSize: 5
          }
        }
      },
      elements: {
        point: {
          hoverBackgroundColor: '#667eea'
        }
      }
    }
  })
}

// 更新支付方式图表
const updatePaymentChart = (data) => {
  if (!paymentChartRef.value) return
  
  const ctx = paymentChartRef.value.getContext('2d')
  
  if (paymentChart) {
    paymentChart.destroy()
  }
  
  const labels = []
  const amounts = []
  const colors = []
  const counts = []
  
  const methodMap = {
    wechat: { name: '微信支付', color: '#1aad19' },
    alipay: { name: '支付宝', color: '#1677ff' },
    cash: { name: '现金支付', color: '#722ed1' }
  }
  
  Object.entries(data).forEach(([method, stats]) => {
    if (methodMap[method]) {
      labels.push(methodMap[method].name)
      amounts.push(stats.amount)
      colors.push(methodMap[method].color)
      counts.push(stats.count)
    }
  })
  
  paymentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: amounts,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '40'),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const index = context.dataIndex
              const amount = amounts[index].toFixed(2)
              const count = counts[index]
              const percentage = ((amounts[index] / amounts.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
              return [
                `金额: ¥${amount}`,
                `笔数: ${count} 笔`,
                `占比: ${percentage}%`
              ]
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1000
      }
    }
  })
  
  // 更新总金额
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  paymentTotalAmount.value = total.toFixed(2)
}

// 初始化图表
const initCharts = async () => {
  await nextTick()
  loadOrderTrendData()
  loadPaymentStats()
}

const refreshData = () => {
  loadOverviewData()
  loadRecentOrders()
  loadHotDishes()
  loadOrderTrendData()
  loadPaymentStats()
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

// 清理图表
const cleanup = () => {
  if (orderTrendChart) {
    orderTrendChart.destroy()
    orderTrendChart = null
  }
  if (paymentChart) {
    paymentChart.destroy()
    paymentChart = null
  }
}

// 生命周期
onMounted(() => {
  loadOverviewData()
  loadRecentOrders()
  loadHotDishes()
  initCharts()
})

onUnmounted(() => {
  cleanup()
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
    position: relative;
    padding: 1rem;
    
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  }

  .chart-loading {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
    
    .el-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .payment-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .total-amount {
      font-size: 0.875rem;
      color: #667eea;
      font-weight: 600;
      background: rgba(102, 126, 234, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
    }
  }
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