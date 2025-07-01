<!-- src/views/Statistics/Users.vue -->
<template>
  <div class="users-statistics">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">用户统计</h1>
          <p class="page-subtitle">分析用户行为和消费趋势</p>
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
      <div class="stat-card" v-for="stat in userStats" :key="stat.key">
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

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 用户增长趋势 -->
      <el-card class="chart-card large">
        <template #header>
          <div class="card-header">
            <span>用户增长趋势</span>
            <div class="header-actions">
              <el-select 
                v-model="trendPeriod" 
                @change="updateTrendChart"
                size="small"
                style="width: 100px; margin-right: 8px;"
              >
                <el-option label="近30天" value="30" />
                <el-option label="近60天" value="60" />
                <el-option label="近90天" value="90" />
              </el-select>
              <el-button type="text" @click="loadUserData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
        </template>
        <div class="chart-container" v-loading="loading.trends">
          <canvas ref="trendChartRef" v-show="!loading.trends"></canvas>
        </div>
      </el-card>

      <!-- 消费分布 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>用户消费分布</span>
          </div>
        </template>
        <div class="chart-container small" v-loading="loading.spending">
          <canvas ref="spendingChartRef" v-show="!loading.spending"></canvas>
        </div>
      </el-card>

      <!-- 用户画像 -->
      <el-card class="demographics-card">
        <template #header>
          <div class="card-header">
            <span>用户画像</span>
          </div>
        </template>
        <div class="demographics-content" v-loading="loading.demographics">
          <div class="demographics-section">
            <h4>年龄分布</h4>
            <div class="age-distribution">
              <div 
                v-for="age in userData?.demographics?.ageGroups" 
                :key="age.range"
                class="age-item"
              >
                <div class="age-label">{{ age.range }}</div>
                <div class="age-bar">
                  <div 
                    class="age-progress" 
                    :style="{ width: age.percentage + '%' }"
                  ></div>
                </div>
                <div class="age-value">{{ age.count }}人</div>
              </div>
            </div>
          </div>

          <div class="demographics-section">
            <h4>性别分布</h4>
            <div class="gender-distribution">
              <div class="gender-item">
                <div class="gender-icon male">
                  <el-icon><Male /></el-icon>
                </div>
                <div class="gender-info">
                  <div class="gender-label">男性</div>
                  <div class="gender-count">{{ userData?.demographics?.genderDistribution?.male || 0 }}人</div>
                  <div class="gender-percentage">
                    {{ getGenderPercentage('male') }}%
                  </div>
                </div>
              </div>
              <div class="gender-item">
                <div class="gender-icon female">
                  <el-icon><Female /></el-icon>
                </div>
                <div class="gender-info">
                  <div class="gender-label">女性</div>
                  <div class="gender-count">{{ userData?.demographics?.genderDistribution?.female || 0 }}人</div>
                  <div class="gender-percentage">
                    {{ getGenderPercentage('female') }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- TOP用户排行 -->
      <el-card class="top-users-card">
        <template #header>
          <div class="card-header">
            <span>TOP用户排行</span>
            <div class="ranking-controls">
              <el-radio-group v-model="rankingType" size="small" @change="updateTopUsersDisplay">
                <el-radio-button value="spending">消费金额</el-radio-button>
                <el-radio-button value="orders">订单数量</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        
        <div class="top-users-content" v-loading="loading.topUsers">
          <div class="user-list">
            <div 
              v-for="(user, index) in displayTopUsers" 
              :key="user.id"
              class="user-item"
              :class="{ 'top-three': index < 3 }"
            >
              <div class="user-position">
                <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
              </div>
              <div class="user-avatar">
                <el-avatar :size="36">
                  {{ user.nickName.charAt(0) }}
                </el-avatar>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.nickName }}</div>
                <div class="user-meta">
                  <el-tag size="small" :type="getMemberLevelType(user.memberLevel)">
                    {{ user.memberLevel }}
                  </el-tag>
                </div>
              </div>
              <div class="user-metrics">
                <div class="primary-metric">
                  <span v-if="rankingType === 'spending'" class="metric-value amount">
                    ¥{{ user.totalSpent }}
                  </span>
                  <span v-else class="metric-value">
                    {{ user.orderCount }}单
                  </span>
                </div>
                <div class="secondary-metric">
                  <span v-if="rankingType === 'spending'">
                    {{ user.orderCount }}单
                  </span>
                  <span v-else>
                    ¥{{ user.totalSpent }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 用户活跃度 -->
      <el-card class="activity-card">
        <template #header>
          <div class="card-header">
            <span>用户活跃度</span>
          </div>
        </template>
        <div class="chart-container small" v-loading="loading.activity">
          <canvas ref="activityChartRef" v-show="!loading.activity"></canvas>
        </div>
      </el-card>

      <!-- 详细数据表格 -->
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>用户详细数据</span>
            <div class="table-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索用户..."
                style="width: 200px; margin-right: 10px"
                :prefix-icon="Search"
                @input="filterUserData"
                clearable
              />
              <el-button type="primary" @click="exportData" :icon="Download">
                导出数据
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredUserData" 
          style="width: 100%" 
          v-loading="loading.table"
          :default-sort="{ prop: 'totalSpent', order: 'descending' }"
        >
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <span class="table-rank">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="用户信息" min-width="180">
            <template #default="{ row }">
              <div class="user-detail">
                <el-avatar :size="32" style="margin-right: 12px">
                  {{ row.nickName.charAt(0) }}
                </el-avatar>
                <div>
                  <div class="user-name">{{ row.nickName }}</div>
                  <div class="user-level">
                    <el-tag size="small" :type="getMemberLevelType(row.memberLevel)">
                      {{ row.memberLevel }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="orderCount" label="订单数" width="100" align="center" sortable>
            <template #default="{ row }">
              <span class="order-count">{{ row.orderCount }}单</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="totalSpent" label="总消费" width="120" align="center" sortable>
            <template #default="{ row }">
              <span class="amount">¥{{ row.totalSpent }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="avgOrderValue" label="客单价" width="100" align="center" sortable>
            <template #default="{ row }">
              <span class="avg-value">¥{{ row.avgOrderValue }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="lastOrderDate" label="最近订单" width="120" align="center">
            <template #default="{ row }">
              <span class="last-order">{{ formatDate(row.lastOrderDate) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="活跃度" width="100" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getActivityType(row.daysSinceLastOrder)"
                size="small"
              >
                {{ getActivityText(row.daysSinceLastOrder) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          class="pagination"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Refresh, Download, Search,
  User, UserFilled, DataAnalysis, Timer, Male, Female
} from '@element-plus/icons-vue'
import { getUserStats } from '@/api/statistics'
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
const trendPeriod = ref('30')
const rankingType = ref('spending')
const searchKeyword = ref('')

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const loading = reactive({
  overview: false,
  trends: false,
  spending: false,
  demographics: false,
  topUsers: false,
  activity: false,
  table: false
})

// 图表引用
const trendChartRef = ref(null)
const spendingChartRef = ref(null)
const activityChartRef = ref(null)
let trendChart = null
let spendingChart = null
let activityChart = null

// API调用函数
const apiCall = {
  getUserStats: () => useMockData.value ? mockStatisticsAPI.getUserStats() : getUserStats()
}

// 统计数据
const userStats = ref([
  {
    key: 'totalUsers',
    label: '总用户数',
    value: '0',
    trend: '+0',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: UserFilled
  },
  {
    key: 'activeUsers',
    label: '活跃用户',
    value: '0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: User
  },
  {
    key: 'newUsersMonth',
    label: '本月新增',
    value: '0',
    trend: '+0',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: DataAnalysis
  },
  {
    key: 'activeRate',
    label: '活跃率',
    value: '0%',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: TrendCharts
  }
])

const userData = ref(null)
const filteredUserData = ref([])

// 计算属性
const displayTopUsers = computed(() => {
  if (!userData.value?.topUsers) return []
  
  const users = [...userData.value.topUsers]
  
  if (rankingType.value === 'orders') {
    users.sort((a, b) => b.orderCount - a.orderCount)
  } else {
    users.sort((a, b) => b.totalSpent - a.totalSpent)
  }
  
  return users.slice(0, 8)
})

// 方法
const getMemberLevelType = (level) => {
  const typeMap = {
    '普通会员': '',
    'VIP会员': 'warning',
    '钻石会员': 'danger'
  }
  return typeMap[level] || ''
}

const getGenderPercentage = (gender) => {
  if (!userData.value?.demographics?.genderDistribution) return '0'
  
  const distribution = userData.value.demographics.genderDistribution
  const total = distribution.male + distribution.female
  
  if (total === 0) return '0'
  
  const percentage = ((distribution[gender] / total) * 100).toFixed(1)
  return percentage
}

const getActivityType = (daysSinceLastOrder) => {
  if (daysSinceLastOrder <= 7) return 'success'
  if (daysSinceLastOrder <= 30) return 'warning'
  return 'danger'
}

const getActivityText = (daysSinceLastOrder) => {
  if (daysSinceLastOrder <= 7) return '活跃'
  if (daysSinceLastOrder <= 30) return '一般'
  return '沉睡'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

// 加载用户数据
const loadUserData = async () => {
  loading.overview = true
  loading.trends = true
  loading.spending = true
  loading.demographics = true
  loading.topUsers = true
  loading.activity = true
  loading.table = true

  try {
    const response = await apiCall.getUserStats()
    
    if (response.success) {
      userData.value = response.data
      
      // 更新统计卡片
      const summary = response.data.summary
      userStats.value[0].value = summary.totalUsers?.toString() || '0'
      userStats.value[1].value = summary.activeUsers?.toString() || '0'
      userStats.value[2].value = summary.newUsersMonth?.toString() || '0'
      userStats.value[3].value = `${summary.activeRate || 0}%`
      
      // 处理用户表格数据
      const users = response.data.topUsers.map(user => {
        const lastOrderDate = new Date(user.lastOrderDate)
        const now = new Date()
        const daysSinceLastOrder = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24))
        
        return {
          ...user,
          daysSinceLastOrder
        }
      })
      
      filteredUserData.value = users
      pagination.total = users.length
      
      // 更新图表
      await nextTick()
      updateTrendChart()
      updateSpendingChart()
      updateActivityChart()
    }
  } catch (error) {
    console.error('Load user data error:', error)
    ElMessage.error('加载用户数据失败')
  } finally {
    loading.overview = false
    loading.trends = false
    loading.spending = false
    loading.demographics = false
    loading.topUsers = false
    loading.activity = false
    loading.table = false
  }
}

// 更新增长趋势图表
const updateTrendChart = () => {
  if (!trendChartRef.value || !userData.value?.trends?.registrationTrend) return
  
  const ctx = trendChartRef.value.getContext('2d')
  
  if (trendChart) {
    trendChart.destroy()
  }
  
  const trends = userData.value.trends.registrationTrend.slice(-parseInt(trendPeriod.value))
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.map(item => formatDate(item.date)),
      datasets: [
        {
          label: '新增用户',
          data: trends.map(item => item.newUsers),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: '累计用户',
          data: trends.map(item => item.cumulativeUsers),
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
          cornerRadius: 8
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
            color: '#909399'
          },
          title: {
            display: true,
            text: '新增用户数',
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
            color: '#909399'
          },
          title: {
            display: true,
            text: '累计用户数',
            color: '#f093fb'
          }
        }
      }
    }
  })
}

// 更新消费分布图表
const updateSpendingChart = () => {
  if (!spendingChartRef.value || !userData.value?.spendingDistribution) return
  
  const ctx = spendingChartRef.value.getContext('2d')
  
  if (spendingChart) {
    spendingChart.destroy()
  }
  
  const distribution = userData.value.spendingDistribution
  
  spendingChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distribution.map(item => item.range),
      datasets: [{
        data: distribution.map(item => item.count),
        backgroundColor: [
          '#667eea',
          '#f093fb',
          '#43e97b',
          '#4facfe',
          '#ffd93d'
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3
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
            pointStyle: 'circle'
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
              const item = distribution[context.dataIndex]
              const total = distribution.reduce((sum, d) => sum + d.count, 0)
              const percentage = ((item.count / total) * 100).toFixed(1)
              return [
                `用户数: ${item.count}人`,
                `占比: ${percentage}%`
              ]
            }
          }
        }
      }
    }
  })
}

// 更新活跃度图表
const updateActivityChart = () => {
  if (!activityChartRef.value || !userData.value?.trends?.activityTrend) return
  
  const ctx = activityChartRef.value.getContext('2d')
  
  if (activityChart) {
    activityChart.destroy()
  }
  
  const activity = userData.value.trends.activityTrend
  
  activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: activity.map(item => formatDate(item.date)),
      datasets: [
        {
          label: '活跃用户',
          data: activity.map(item => item.activeUsers),
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: '#667eea',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: '下单用户',
          data: activity.map(item => item.orderUsers),
          backgroundColor: 'rgba(240, 147, 251, 0.6)',
          borderColor: '#f093fb',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#909399',
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(144, 147, 153, 0.1)'
          },
          ticks: {
            color: '#909399'
          }
        }
      }
    }
  })
}

// 更新TOP用户显示
const updateTopUsersDisplay = () => {
  // 通过computed属性自动更新
}

// 筛选用户数据
const filterUserData = () => {
  if (!userData.value?.topUsers) return
  
  const users = userData.value.topUsers.map(user => {
    const lastOrderDate = new Date(user.lastOrderDate)
    const now = new Date()
    const daysSinceLastOrder = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24))
    
    return {
      ...user,
      daysSinceLastOrder
    }
  })
  
  if (!searchKeyword.value) {
    filteredUserData.value = users
  } else {
    filteredUserData.value = users.filter(user =>
      user.nickName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  pagination.total = filteredUserData.value.length
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
}

const handlePageChange = (page) => {
  pagination.page = page
}

// 导出数据
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

// 处理模拟数据开关
const handleMockDataChange = (value) => {
  ElMessage.info(value ? '已切换到演示模式' : '已切换到真实API模式')
  loadUserData()
}

// 清理图表
const cleanup = () => {
  if (trendChart) {
    trendChart.destroy()
    trendChart = null
  }
  if (spendingChart) {
    spendingChart.destroy()
    spendingChart = null
  }
  if (activityChart) {
    activityChart.destroy()
    activityChart = null
  }
}

// 生命周期
onMounted(() => {
  loadUserData()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.users-statistics {
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
      min-height: 300px;
      max-height: 300px;
      position: relative;
      padding: 1rem;
      overflow: hidden;
      
      &.small {
        height: 250px;
        min-height: 250px;
        max-height: 250px;
      }
      
      canvas {
        width: 100% !important;
        height: 100% !important;
        max-height: calc(100% - 2rem);
      }
    }
  }
  
  .demographics-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    
    .demographics-content {
      padding: 1rem;
    }
    
    .demographics-section {
      margin-bottom: 2rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      h4 {
        margin-bottom: 1rem;
        color: #303133;
        font-weight: 600;
      }
    }
    
    .age-distribution {
      .age-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
        
        .age-label {
          width: 80px;
          font-size: 0.875rem;
          color: #606266;
        }
        
        .age-bar {
          flex: 1;
          height: 8px;
          background: #f0f2f5;
          border-radius: 4px;
          margin: 0 1rem;
          position: relative;
          
          .age-progress {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
            transition: width 0.3s ease;
          }
        }
        
        .age-value {
          width: 60px;
          text-align: right;
          font-size: 0.875rem;
          color: #303133;
          font-weight: 500;
        }
      }
    }
    
    .gender-distribution {
      display: flex;
      gap: 2rem;
      
      .gender-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        
        .gender-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
          
          &.male {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
          }
          
          &.female {
            background: linear-gradient(135deg, #f093fb, #f5576c);
          }
        }
        
        .gender-info {
          .gender-label {
            font-weight: 500;
            color: #303133;
            margin-bottom: 0.25rem;
          }
          
          .gender-count {
            font-size: 1.25rem;
            font-weight: 600;
            color: #303133;
          }
          
          .gender-percentage {
            font-size: 0.75rem;
            color: #909399;
          }
        }
      }
    }
  }
  
  .top-users-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    
    .top-users-content {
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
  }
  
  .activity-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    
    .chart-container {
      height: 250px;
      min-height: 250px;
      max-height: 250px;
      overflow: hidden;
    }
  }
  
  .table-card {
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

  .ranking-controls {
    .el-radio-group {
      --el-radio-button-checked-bg-color: #667eea;
      --el-radio-button-checked-border-color: #667eea;
    }
  }
  
  .table-actions {
    display: flex;
    align-items: center;
  }
}

.user-list {
  .user-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f2f5;
    transition: background-color 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: #f8f9fa;
    }
    
    &.top-three {
      .rank-number {
        color: white;
        
        &.rank-1 {
          background: linear-gradient(135deg, #ffd700, #ffb347);
        }
        
        &.rank-2 {
          background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
        }
        
        &.rank-3 {
          background: linear-gradient(135deg, #cd7f32, #b8860b);
        }
      }
    }
    
    .user-position {
      margin-right: 1rem;
      
      .rank-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.875rem;
        background: #f0f2f5;
        color: #606266;
      }
    }
    
    .user-avatar {
      margin-right: 1rem;
    }
    
    .user-info {
      flex: 1;
      margin-right: 1rem;
      
      .user-name {
        font-weight: 500;
        color: #303133;
        margin-bottom: 0.25rem;
      }
    }
    
    .user-metrics {
      text-align: right;
      
      .primary-metric {
        .metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: #303133;
          
          &.amount {
            color: #f56c6c;
          }
        }
      }
      
      .secondary-metric {
        font-size: 0.75rem;
        color: #909399;
        margin-top: 0.25rem;
      }
    }
  }
}

.user-detail {
  display: flex;
  align-items: center;
  
  .user-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 0.25rem;
  }
}

.table-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #606266;
  font-weight: 600;
  font-size: 0.875rem;
}

.order-count {
  color: #667eea;
  font-weight: 600;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.avg-value {
  color: #43e97b;
  font-weight: 600;
}

.last-order {
  font-size: 0.875rem;
  color: #606266;
}

.pagination {
  margin-top: 1.5rem;
  justify-content: center;
}

// 响应式设计
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    
    .chart-card.large {
      grid-row: span 1;
    }
  }
  
  .gender-distribution {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .users-statistics {
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
  
  .user-item {
    .user-info {
      min-width: 0;
    }
    
    .user-metrics {
      min-width: 80px;
    }
  }
  
  .gender-distribution {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}
</style>