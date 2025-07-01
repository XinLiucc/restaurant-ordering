<!-- src/views/Statistics/Sales.vue -->
<template>
  <div class="sales-statistics">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">销售统计</h1>
          <p class="page-subtitle">分析销售数据和收入趋势</p>
        </div>
        <div class="header-right">
          <div class="demo-switch">
            <span class="switch-label">演示模式：</span>
            <el-switch
              v-model="useMockData"
              @change="handleMockDataChange"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" v-loading="loading.overview">
      <div class="stat-card" v-for="stat in salesStats" :key="stat.key">
        <div class="stat-icon" :style="{ background: stat.color }">
          <component :is="stat.icon" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-trend" :class="stat.trendType">
            <el-icon><TrendCharts /></el-icon>
            {{ stat.trend }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图表和数据区域 -->
    <div class="content-grid">
      <!-- 销售趋势图 -->
      <el-card class="chart-card large">
        <template #header>
          <div class="card-header">
            <span>销售趋势</span>
            <div class="header-actions">
              <el-select 
                v-model="period" 
                @change="loadSalesData"
                size="small"
                style="width: 100px; margin-right: 8px;"
              >
                <el-option label="今日" value="today" />
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
                <el-option label="本年" value="year" />
              </el-select>
              <el-button type="text" @click="loadSalesData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>
        <div class="chart-container" v-loading="loading.trends">
          <canvas ref="salesChartRef" v-show="!loading.trends"></canvas>
          <div v-if="loading.trends" class="chart-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>加载销售趋势数据...</p>
          </div>
        </div>
      </el-card>

      <!-- 支付方式分布 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>支付方式分布</span>
            <div class="payment-total">
              总计: ¥{{ paymentTotalAmount }}
            </div>
          </div>
        </template>
        <div class="chart-container small" v-loading="loading.payment">
          <canvas ref="paymentChartRef" v-show="!loading.payment"></canvas>
        </div>
      </el-card>

      <!-- 时段分析 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>24小时订单分布</span>
          </div>
        </template>
        <div class="chart-container small" v-loading="loading.hourly">
          <canvas ref="hourlyChartRef" v-show="!loading.hourly"></canvas>
        </div>
      </el-card>

      <!-- 数据详情表格
      <el-card class="data-card">
        <template #header>
          <div class="card-header">
            <span>详细数据</span>
            <div class="header-actions">
              <el-button 
                type="primary" 
                size="small"
                @click="exportData"
                :icon="Download"
              >
                导出数据
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="data-tabs">
          <el-tabs v-model="activeDataTab">
            <el-tab-pane label="趋势数据" name="trends">
              <el-table :data="trendsTableData" style="width: 100%" size="small">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="orderCount" label="订单数" width="100" align="center" />
                <el-table-column prop="revenue" label="收入(元)" width="120" align="center">
                  <template #default="{ row }">
                    <span class="amount">¥{{ row.revenue }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="averageOrderValue" label="客单价(元)" width="120" align="center">
                  <template #default="{ row }">
                    <span class="amount">¥{{ row.averageOrderValue }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="同比增长" align="center">
                  <template #default="{ row, $index }">
                    <el-tag 
                      v-if="$index > 0"
                      :type="row.growth >= 0 ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ row.growth >= 0 ? '+' : '' }}{{ row.growth }}%
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            
            <el-tab-pane label="支付统计" name="payment">
              <el-table :data="paymentTableData" style="width: 100%" size="small">
                <el-table-column label="支付方式" width="120">
                  <template #default="{ row }">
                    <div class="payment-method">
                      <el-icon 
                        :style="{ color: getPaymentMethodColor(row.method) }"
                        size="16"
                      >
                        <component :is="getPaymentMethodIcon(row.method)" />
                      </el-icon>
                      <span>{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="count" label="笔数" width="100" align="center" />
                <el-table-column prop="amount" label="金额(元)" width="120" align="center">
                  <template #default="{ row }">
                    <span class="amount">¥{{ row.amount }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="percentage" label="占比" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag type="info" size="small">{{ row.percentage }}%</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="avgAmount" label="单笔均额" align="center">
                  <template #default="{ row }">
                    <span class="amount">¥{{ row.avgAmount }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card> -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Refresh, Download, Loading,
  Money, Document, DataAnalysis, Timer,
  ChatDotRound, Wallet
} from '@element-plus/icons-vue'
import { getSalesStats } from '@/api/statistics'
import { mockStatisticsAPI } from '@/utils/demo-data-statistics'
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
  BarController,
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
  BarController,
  DoughnutController
)

// 响应式数据
const useMockData = ref(true)
const period = ref('month')
const activeDataTab = ref('trends')

const loading = reactive({
  overview: false,
  trends: false,
  payment: false,
  hourly: false
})

// 图表引用
const salesChartRef = ref(null)
const paymentChartRef = ref(null)
const hourlyChartRef = ref(null)
let salesChart = null
let paymentChart = null
let hourlyChart = null

const paymentTotalAmount = ref('0.00')

// API调用函数
const apiCall = {
  getSalesStats: (params) => useMockData.value ? mockStatisticsAPI.getSalesStats(params) : getSalesStats(params)
}

// 统计数据
const salesStats = ref([
  {
    key: 'totalOrders',
    label: '总订单数',
    value: '0',
    trend: '+0%',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: Document
  },
  {
    key: 'totalRevenue',
    label: '总收入',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: Money
  },
  {
    key: 'averageOrderValue',
    label: '平均客单价',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: DataAnalysis
  },
  {
    key: 'completionRate',
    label: '完成率',
    value: '0%',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: TrendCharts
  }
])

const salesData = ref(null)

// 计算属性
const trendsTableData = computed(() => {

  if (!salesData.value?.trends) return []
  
  return salesData.value.trends.map((item, index) => {
    console.log('原始 item:', item)
    const prevItem = salesData.value.trends[index - 1]
    let growth = 0
    
    if (prevItem && prevItem.revenue > 0) {
      growth = Number(((item.revenue - prevItem.revenue) / prevItem.revenue * 100).toFixed(1))
    }
    
    return {
      ...item,
      date: formatDate(item.period),
      growth
    }
  }).reverse() // 最新的在前面
})

const paymentTableData = computed(() => {
  if (!salesData.value?.paymentMethodStats) return []
  
  const stats = salesData.value.paymentMethodStats
  const totalAmount = Object.values(stats).reduce((sum, item) => sum + item.amount, 0)
  
  const methodMap = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金支付'
  }
  
  return Object.entries(stats).map(([method, data]) => ({
    method,
    name: methodMap[method],
    count: data.count,
    amount: data.amount.toFixed(2),
    percentage: totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : '0.0',
    avgAmount: data.count > 0 ? (data.amount / data.count).toFixed(2) : '0.00'
  }))
})

// 方法
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

const getPaymentMethodIcon = (method) => {
  const iconMap = {
    wechat: 'ChatDotRound',
    alipay: 'Wallet',
    cash: 'Money'
  }
  return iconMap[method] || 'Money'
}

const getPaymentMethodColor = (method) => {
  const colorMap = {
    wechat: '#1aad19',
    alipay: '#1677ff',
    cash: '#722ed1'
  }
  return colorMap[method] || '#606266'
}

// 加载销售数据
const loadSalesData = async () => {
  loading.overview = true
  loading.trends = true
  loading.payment = true
  loading.hourly = true

  try {
    const response = await apiCall.getSalesStats({ period: period.value })
    
    if (response.success) {
      salesData.value = response.data
      
      // 更新统计卡片
      const summary = response.data.summary
      salesStats.value[0].value = summary.totalOrders?.toString() || '0'
      salesStats.value[1].value = `¥${summary.totalRevenue?.toFixed(2) || '0.00'}`
      salesStats.value[2].value = `¥${summary.averageOrderValue?.toFixed(2) || '0.00'}`
      salesStats.value[3].value = `${Number(summary.completionRate)?.toFixed(1) || '0.0'}%`
      
      // 更新图表
      await nextTick()
      updateSalesChart()
      updatePaymentChart()
      updateHourlyChart()
    }
  } catch (error) {
    console.error('Load sales data error:', error)
    ElMessage.error('加载销售数据失败')
  } finally {
    loading.overview = false
    loading.trends = false
    loading.payment = false
    loading.hourly = false
  }
}

// 更新销售趋势图表
const updateSalesChart = () => {
  if (!salesChartRef.value || !salesData.value?.trends) return
  
  const ctx = salesChartRef.value.getContext('2d')
  
  if (salesChart) {
    salesChart.destroy()
  }
  
  const trends = salesData.value.trends
  
  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.map(item => formatDate(item.date)),
      datasets: [
        {
          label: '订单数量',
          data: trends.map(item => item.orderCount),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '收入金额',
          data: trends.map(item => item.revenue),
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              if (context.datasetIndex === 0) {
                return `订单数: ${context.parsed.y} 单`
              } else {
                return `收入: ¥${context.parsed.y.toFixed(2)}`
              }
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
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: {
            color: 'rgba(144, 147, 153, 0.1)'
          },
          ticks: {
            color: '#909399',
            stepSize: 5
          },
          title: {
            display: true,
            text: '订单数量',
            color: '#667eea'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#909399',
            callback: function(value) {
              return '¥' + value.toFixed(0)
            }
          },
          title: {
            display: true,
            text: '收入金额',
            color: '#f093fb'
          }
        }
      }
    }
  })
}

// 更新支付方式图表
const updatePaymentChart = () => {
  if (!paymentChartRef.value || !salesData.value?.paymentMethodStats) return
  
  const ctx = paymentChartRef.value.getContext('2d')
  
  if (paymentChart) {
    paymentChart.destroy()
  }
  
  const stats = salesData.value.paymentMethodStats
  const labels = []
  const amounts = []
  const colors = []
  
  const methodMap = {
    wechat: { name: '微信支付', color: '#1aad19' },
    alipay: { name: '支付宝', color: '#1677ff' },
    cash: { name: '现金支付', color: '#722ed1' }
  }
  
  Object.entries(stats).forEach(([method, data]) => {
    if (methodMap[method]) {
      labels.push(methodMap[method].name)
      amounts.push(data.amount)
      colors.push(methodMap[method].color)
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
            padding: 15,
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
              const total = amounts.reduce((a, b) => a + b, 0)
              const percentage = ((context.parsed / total) * 100).toFixed(1)
              return [
                `金额: ¥${context.parsed.toFixed(2)}`,
                `占比: ${percentage}%`
              ]
            }
          }
        }
      }
    }
  })
  
  // 更新总金额
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  paymentTotalAmount.value = total.toFixed(2)
}

// 更新时段分析图表
const updateHourlyChart = () => {
  if (!hourlyChartRef.value || !salesData.value?.hourlyStats) return
  
  const ctx = hourlyChartRef.value.getContext('2d')
  
  if (hourlyChart) {
    hourlyChart.destroy()
  }
  
  const hourlyStats = salesData.value.hourlyStats
  
  hourlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hourlyStats.map(item => `${item.hour}:00`),
      datasets: [{
        label: '订单数量',
        data: hourlyStats.map(item => item.orderCount),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
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
          callbacks: {
            title: (tooltipItems) => {
              return `${tooltipItems[0].label}`
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
            color: '#909399',
            font: {
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(144, 147, 153, 0.1)'
          },
          ticks: {
            color: '#909399',
            stepSize: 2
          }
        }
      }
    }
  })
}

// 导出数据
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

// 处理模拟数据开关
const handleMockDataChange = (value) => {
  ElMessage.info(value ? '已切换到演示模式' : '已切换到真实API模式')
  loadSalesData()
}

// 清理图表
const cleanup = () => {
  if (salesChart) {
    salesChart.destroy()
    salesChart = null
  }
  if (paymentChart) {
    paymentChart.destroy()
    paymentChart = null
  }
  if (hourlyChart) {
    hourlyChart.destroy()
    hourlyChart = null
  }
}

// 生命周期
onMounted(() => {
  loadSalesData()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.sales-statistics {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .header-left {
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
  
  .header-right {
    .demo-switch {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      
      .switch-label {
        font-size: 0.875rem;
        color: #606266;
        font-weight: 500;
      }
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

  .stat-trend {
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

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  
  .chart-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    
    &.large {
      grid-row: span 2;
    }
    
    .chart-container {
      height: 300px;
      position: relative;
      padding: 1rem;
      
      &.small {
        height: 250px;
      }
      
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
  }
  
  .data-card {
    grid-column: 1 / -1;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
  }
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

  .payment-total {
    font-size: 0.875rem;
    color: #667eea;
    font-weight: 600;
    background: rgba(102, 126, 234, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
}

.data-tabs {
  .amount {
    color: #f56c6c;
    font-weight: 600;
  }
  
  .payment-method {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    
    .chart-card.large {
      grid-row: span 1;
    }
  }
}

@media (max-width: 768px) {
  .sales-statistics {
    padding: 1rem;
  }
  
  .page-header .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .header-right {
      align-self: flex-start;
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>