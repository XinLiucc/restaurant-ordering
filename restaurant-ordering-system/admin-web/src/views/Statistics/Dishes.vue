<!-- src/views/Statistics/Dishes.vue -->
<template>
  <div class="dishes-statistics">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">菜品统计</h1>
          <p class="page-subtitle">分析菜品销售数据和热门趋势</p>
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
      <div class="stat-card" v-for="stat in dishStats" :key="stat.key">
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

    <!-- 筛选工具栏 -->
    <el-card class="filter-card">
      <div class="filter-toolbar">
        <div class="filter-left">
          <el-select
            v-model="filters.period"
            @change="loadDishData"
            style="width: 120px; margin-right: 10px"
          >
            <el-option label="今日" value="today" />
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="本年" value="year" />
          </el-select>
          <el-select
            v-model="filters.categoryId"
            placeholder="选择分类"
            style="width: 150px; margin-right: 10px"
            @change="loadDishData"
            clearable
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
          <el-select
            v-model="filters.sortBy"
            @change="loadDishData"
            style="width: 120px; margin-right: 10px"
          >
            <el-option label="按销量" value="quantity" />
            <el-option label="按收入" value="revenue" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="loadDishData" :icon="Refresh">
            刷新
          </el-button>
          <el-button type="primary" @click="exportData" :icon="Download">
            导出数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 热销菜品排行 -->
      <el-card class="ranking-card">
        <template #header>
          <div class="card-header">
            <span>热销菜品TOP10</span>
            <div class="ranking-metrics">
              <el-radio-group v-model="rankingMetric" size="small" @change="updateRankingDisplay">
                <el-radio-button value="quantity">销量</el-radio-button>
                <el-radio-button value="revenue">收入</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        
        <div class="ranking-content" v-loading="loading.ranking">
          <div class="ranking-list">
            <div 
              v-for="(dish, index) in topDishes" 
              :key="dish.dishId"
              class="ranking-item"
              :class="{ 'top-three': index < 3 }"
            >
              <div class="ranking-position">
                <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
              </div>
              <div class="dish-avatar">
                <el-avatar
                  :src="dish.image"
                  :size="40"
                  shape="square"
                  style="border-radius: 8px"
                >
                  <el-icon><Picture /></el-icon>
                </el-avatar>
              </div>
              <div class="dish-info">
                <div class="dish-name">{{ dish.dishName }}</div>
                <div class="dish-category">{{ dish.category?.name }}</div>
              </div>
              <div class="dish-metrics">
                <div class="primary-metric">
                  <span v-if="rankingMetric === 'quantity'" class="metric-value">
                    {{ dish.totalQuantity }}份
                  </span>
                  <span v-else class="metric-value amount">
                    ¥{{ dish.totalRevenue }}
                  </span>
                </div>
                <div class="secondary-metric">
                  <span v-if="rankingMetric === 'quantity'">
                    ¥{{ dish.totalRevenue }}
                  </span>
                  <span v-else>
                    {{ dish.totalQuantity }}份
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 分类销售分析 -->
      <el-card class="category-card">
        <template #header>
          <div class="card-header">
            <span>分类销售分析</span>
          </div>
        </template>
        
        <div class="chart-container" v-loading="loading.category">
          <canvas ref="categoryChartRef" v-show="!loading.category"></canvas>
        </div>
      </el-card>

      <!-- 销售趋势 -->
      <el-card class="trend-card">
        <template #header>
          <div class="card-header">
            <span>菜品销售趋势</span>
          </div>
        </template>
        
        <div class="chart-container" v-loading="loading.trends">
          <canvas ref="trendChartRef" v-show="!loading.trends"></canvas>
        </div>
      </el-card>

      <!-- 详细数据表格 -->
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>详细数据</span>
            <div class="table-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索菜品..."
                style="width: 200px"
                :prefix-icon="Search"
                @input="filterTableData"
                clearable
              />
            </div>
          </div>
        </template>
        
        <el-table 
          :data="filteredTableData" 
          style="width: 100%" 
          v-loading="loading.table"
          :default-sort="{ prop: 'totalQuantity', order: 'descending' }"
        >
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <span class="table-rank">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="菜品信息" min-width="200">
            <template #default="{ row }">
              <div class="dish-detail">
                <el-avatar
                  :src="row.image"
                  :size="40"
                  shape="square"
                  style="border-radius: 6px; margin-right: 12px"
                >
                  <el-icon><Picture /></el-icon>
                </el-avatar>
                <div>
                  <div class="dish-name">{{ row.dishName }}</div>
                  <div class="dish-meta">
                    <el-tag size="small" type="info">{{ row.category?.name }}</el-tag>
                    <span class="dish-price">¥{{ row.price }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="totalQuantity" label="销量" width="100" align="center" sortable>
            <template #default="{ row }">
              <span class="quantity">{{ row.totalQuantity }}份</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="totalRevenue" label="收入" width="120" align="center" sortable>
            <template #default="{ row }">
              <span class="amount">¥{{ row.totalRevenue }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="orderCount" label="订单数" width="100" align="center" sortable>
            <template #default="{ row }">
              <span>{{ row.orderCount }}单</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="averageQuantityPerOrder" label="单均销量" width="120" align="center">
            <template #default="{ row }">
              <span>{{ row.averageQuantityPerOrder }}份/单</span>
            </template>
          </el-table-column>
          
          <el-table-column label="贡献度" width="100" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getContributionType(row.contribution)"
                size="small"
              >
                {{ row.contribution }}%
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
  TrendCharts, Refresh, Download, Search, Picture,
  Bowl, DataAnalysis, Trophy, Timer
} from '@element-plus/icons-vue'
import { getDishStats } from '@/api/statistics'
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
  DoughnutController,
  PieController
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
  DoughnutController,
  PieController
)

// 响应式数据
const useMockData = ref(true)
const rankingMetric = ref('quantity')
const searchKeyword = ref('')

const filters = reactive({
  period: 'month',
  categoryId: '',
  sortBy: 'quantity'
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const loading = reactive({
  overview: false,
  ranking: false,
  category: false,
  trends: false,
  table: false
})

// 图表引用
const categoryChartRef = ref(null)
const trendChartRef = ref(null)
let categoryChart = null
let trendChart = null

// API调用函数
const apiCall = {
  getDishStats: (params) => useMockData.value ? mockStatisticsAPI.getDishStats(params) : getDishStats(params)
}

// 模拟分类数据
const categories = ref([
  { id: 1, name: '热菜' },
  { id: 2, name: '凉菜' },
  { id: 3, name: '汤品' },
  { id: 4, name: '主食' },
  { id: 5, name: '饮品' }
])

// 统计数据
const dishStats = ref([
  {
    key: 'totalQuantity',
    label: '总销量',
    value: '0',
    trend: '+0%',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: Bowl
  },
  {
    key: 'totalRevenue',
    label: '总收入',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: DataAnalysis
  },
  {
    key: 'uniqueDishes',
    label: '在售菜品',
    value: '0',
    trend: '+0',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: Trophy
  },
  {
    key: 'avgOrderValue',
    label: '平均单价',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: Timer
  }
])

const dishData = ref(null)
const tableData = ref([])

// 计算属性
const topDishes = computed(() => {
  if (!dishData.value?.dishRanking) return []
  return dishData.value.dishRanking.slice(0, 10)
})

const filteredTableData = computed(() => {
  if (!searchKeyword.value) return tableData.value
  
  return tableData.value.filter(dish =>
    dish.dishName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    dish.category?.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 方法
const getContributionType = (contribution) => {
  if (contribution >= 10) return 'danger'
  if (contribution >= 5) return 'warning'
  if (contribution >= 2) return 'success'
  return 'info'
}

// 加载菜品数据
const loadDishData = async () => {
  loading.overview = true
  loading.ranking = true
  loading.category = true
  loading.trends = true
  loading.table = true

  try {
    const params = {
      period: filters.period,
      sortBy: filters.sortBy,
      limit: 50
    }
    // ✅ 只有在有值时才加 categoryId
    if (filters.categoryId) {
      params.categoryId = filters.categoryId
    }

    const response = await apiCall.getDishStats(params)
    
    if (response.success) {
      dishData.value = response.data
      
      // 更新统计卡片
      const summary = response.data.summary
      dishStats.value[0].value = summary.totalQuantity?.toString() || '0'
      dishStats.value[1].value = `¥${summary.totalRevenue?.toFixed(2) || '0.00'}`
      dishStats.value[2].value = summary.uniqueDishes?.toString() || '0'
      
      // 计算平均单价
      const avgPrice = summary.totalQuantity > 0 
        ? (summary.totalRevenue / summary.totalQuantity).toFixed(2)
        : '0.00'
      dishStats.value[3].value = `¥${avgPrice}`
      
      // 处理表格数据，添加贡献度
      const totalRevenue = summary.totalRevenue
      tableData.value = response.data.dishRanking.map(dish => ({
        ...dish,
        contribution: totalRevenue > 0 
          ? ((dish.totalRevenue / totalRevenue) * 100).toFixed(1)
          : '0.0'
      }))
      
      pagination.total = tableData.value.length
      
      // 更新图表
      await nextTick()
      updateCategoryChart()
      updateTrendChart()
    }
  } catch (error) {
    console.error('Load dish data error:', error)
    ElMessage.error('加载菜品数据失败')
  } finally {
    loading.overview = false
    loading.ranking = false
    loading.category = false
    loading.trends = false
    loading.table = false
  }
}

// 更新排行显示
const updateRankingDisplay = () => {
  // 排行榜数据已经通过computed属性自动更新
}

// 更新分类图表
const updateCategoryChart = () => {
  if (!categoryChartRef.value || !dishData.value?.categoryStats) return
  
  const ctx = categoryChartRef.value.getContext('2d')
  
  if (categoryChart) {
    categoryChart.destroy()
  }
  
  const categoryStats = dishData.value.categoryStats
  
  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categoryStats.map(item => item.category.name),
      datasets: [{
        data: categoryStats.map(item => item.totalRevenue),
        backgroundColor: [
          '#667eea',
          '#f093fb',
          '#43e97b',
          '#4facfe',
          '#ffd93d',
          '#ff6b6b',
          '#4ecdc4',
          '#45b7d1'
        ],
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
              const category = categoryStats[context.dataIndex]
              const total = categoryStats.reduce((sum, item) => sum + item.totalRevenue, 0)
              const percentage = ((category.totalRevenue / total) * 100).toFixed(1)
              return [
                `收入: ¥${category.totalRevenue.toFixed(2)}`,
                `销量: ${category.totalQuantity}份`,
                `占比: ${percentage}%`,
                `菜品数: ${category.dishCount}个`
              ]
            }
          }
        }
      }
    }
  })
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChartRef.value || !dishData.value?.trends) return
  
  const ctx = trendChartRef.value.getContext('2d')
  
  if (trendChart) {
    trendChart.destroy()
  }
  
  const trends = dishData.value.trends
  
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.map(item => {
        const date = new Date(item.date)
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
      }),
      datasets: [
        {
          label: '总销量',
          data: trends.map(item => item.totalSales),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: '热门菜品销量',
          data: trends.map(item => item.topDishSales),
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4
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

// 筛选表格数据
const filterTableData = () => {
  // 通过computed属性自动处理
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
  loadDishData()
}

// 清理图表
const cleanup = () => {
  if (categoryChart) {
    categoryChart.destroy()
    categoryChart = null
  }
  if (trendChart) {
    trendChart.destroy()
    trendChart = null
  }
}

// 生命周期
onMounted(() => {
  loadDishData()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="scss">
.dishes-statistics {
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

.filter-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  margin-bottom: 1.5rem;
  
  .filter-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .filter-left {
      display: flex;
      align-items: center;
    }
    
    .filter-right {
      display: flex;
      gap: 0.5rem;
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  .ranking-card {
    grid-row: span 2;
  }
  
  .table-card {
    grid-column: 1 / -1;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;

  .ranking-metrics {
    .el-radio-group {
      --el-radio-button-checked-bg-color: #667eea;
      --el-radio-button-checked-border-color: #667eea;
    }
  }
  
  .table-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.ranking-content {
  .ranking-list {
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 1rem 0;
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
      
      .ranking-position {
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
      
      .dish-avatar {
        margin-right: 1rem;
      }
      
      .dish-info {
        flex: 1;
        margin-right: 1rem;
        
        .dish-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 0.25rem;
        }
        
        .dish-category {
          font-size: 0.75rem;
          color: #909399;
        }
      }
      
      .dish-metrics {
        text-align: right;
        
        .primary-metric {
          .metric-value {
            font-size: 1.1rem;
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
}

.chart-container {
  height: 300px;
  position: relative;
  padding: 1rem;
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

.dish-detail {
  display: flex;
  align-items: center;
  
  .dish-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 0.25rem;
  }
  
  .dish-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .dish-price {
      font-size: 0.75rem;
      color: #f56c6c;
      font-weight: 500;
    }
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

.quantity {
  color: #667eea;
  font-weight: 600;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 1.5rem;
  justify-content: center;
}

// 响应式设计
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    
    .ranking-card {
      grid-row: span 1;
    }
  }
  
  .filter-toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .filter-left,
    .filter-right {
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .dishes-statistics {
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
  
  .ranking-item {
    .dish-info {
      min-width: 0; // 防止flex item过度伸展
    }
    
    .dish-metrics {
      min-width: 80px;
    }
  }
}
</style>