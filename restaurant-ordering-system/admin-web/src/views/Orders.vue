<!-- src/views/Orders.vue -->
<template>
  <div class="orders-management">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">订单管理</h1>
          <p class="page-subtitle">查看和管理所有订单信息</p>
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
    <div class="stats-grid" v-loading="loading.stats">
      <div class="stat-card" v-for="stat in orderStats" :key="stat.key">
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

    <!-- 主要内容区 -->
    <el-card class="main-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button
            type="warning"
            @click="showBatchStatusDialog"
            :disabled="selectedOrders.length === 0"
            :icon="Edit"
          >
            批量操作 ({{ selectedOrders.length }})
          </el-button>
          <el-button
            @click="refreshOrders"
            :icon="Refresh"
          >
            刷新
          </el-button>
          <el-button
            @click="exportOrders"
            :icon="Download"
          >
            导出
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-select
            v-model="filters.status"
            placeholder="订单状态"
            style="width: 120px; margin-right: 10px"
            @change="loadOrders"
            clearable
          >
            <el-option
              v-for="(label, value) in ORDER_STATUS_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
            style="width: 240px; margin-right: 10px"
          />
          <el-input
            v-model="filters.search"
            placeholder="搜索订单号/桌号/用户..."
            style="width: 200px"
            :prefix-icon="Search"
            @input="searchOrders"
            clearable
          />
        </div>
      </div>

      <!-- 订单列表 -->
      <el-table
        v-loading="loading.orders"
        :data="orders"
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="订单信息" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="order-info">
              <div class="order-no">
                <span class="order-number">{{ row.orderNo }}</span>
                <el-tag
                  :type="getStatusType(row.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ ORDER_STATUS_MAP[row.status] }}
                </el-tag>
              </div>
              <div class="order-meta">
                <span class="table-number">桌号: {{ row.tableNumber }}</span>
                <span class="order-time">{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.user?.nickName || '匿名用户' }}</div>
              <div class="user-phone" v-if="row.user?.phone">{{ row.user.phone }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="菜品详情" min-width="300">
          <template #default="{ row }">
            <div class="dishes-list">
              <div 
                v-for="item in row.items.slice(0, 3)" 
                :key="item.id" 
                class="dish-item"
              >
                <span class="dish-name">{{ item.dishName }}</span>
                <span class="dish-quantity">×{{ item.quantity }}</span>
                <span class="dish-price">¥{{ item.subtotal }}</span>
              </div>
              <div v-if="row.items.length > 3" class="more-dishes">
                <el-button 
                  type="text" 
                  size="small"
                  @click="showOrderDetail(row)"
                >
                  +{{ row.items.length - 3 }}个菜品
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="金额" width="100" align="center">
          <template #default="{ row }">
            <div class="amount">¥{{ row.totalAmount }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-select
              v-model="row.status"
              @change="handleUpdateOrderStatus(row)"
              :disabled="row.status === 'completed' || row.status === 'cancelled'"
              size="small"
            >
              <el-option
                v-for="(label, value) in getAvailableStatuses(row.status)"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="备注" width="120">
          <template #default="{ row }">
            <el-tooltip 
              :content="row.remark" 
              placement="top"
              :disabled="!row.remark"
            >
              <span class="remark">{{ row.remark || '无' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="showOrderDetail(row)"
              :icon="View"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              @click="quickConfirm(row)"
              :icon="Check"
            >
              确认
            </el-button>
            <el-button
              v-if="['pending', 'confirmed'].includes(row.status)"
              type="danger"
              link
              @click="cancelOrder(row)"
              :icon="Close"
            >
              取消
            </el-button>
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

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="订单详情"
      width="800px"
      :before-close="handleDetailClose"
    >
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">订单号：</span>
                <span class="value">{{ currentOrder.orderNo }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">状态：</span>
                <el-tag :type="getStatusType(currentOrder.status)">
                  {{ ORDER_STATUS_MAP[currentOrder.status] }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">桌号：</span>
                <span class="value">{{ currentOrder.tableNumber }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">总金额：</span>
                <span class="value amount">¥{{ currentOrder.totalAmount }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">下单时间：</span>
                <span class="value">{{ formatDateTime(currentOrder.createdAt) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">更新时间：</span>
                <span class="value">{{ formatDateTime(currentOrder.updatedAt) }}</span>
              </div>
            </el-col>
          </el-row>
          <div v-if="currentOrder.remark" class="detail-item full-width">
            <span class="label">备注：</span>
            <span class="value">{{ currentOrder.remark }}</span>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="detail-section">
          <h3 class="section-title">用户信息</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">昵称：</span>
                <span class="value">{{ currentOrder.user?.nickName || '匿名用户' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">手机：</span>
                <span class="value">{{ currentOrder.user?.phone || '未提供' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 菜品列表 -->
        <div class="detail-section">
          <h3 class="section-title">菜品详情</h3>
          <el-table :data="currentOrder.items" style="width: 100%">
            <el-table-column label="菜品" min-width="200">
              <template #default="{ row }">
                <div class="dish-detail">
                  <el-avatar
                    v-if="row.dish?.image"
                    :src="row.dish.image"
                    :size="40"
                    shape="square"
                    style="border-radius: 4px; margin-right: 12px"
                  />
                  <div>
                    <div class="dish-name">{{ row.dishName }}</div>
                    <div class="dish-category" v-if="row.dish?.category">
                      {{ row.dish.category.name }}
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="center">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="数量" width="80" align="center">
              <template #default="{ row }">{{ row.quantity }}</template>
            </el-table-column>
            <el-table-column label="小计" width="100" align="center">
              <template #default="{ row }">
                <span class="subtotal">¥{{ row.subtotal }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button
            v-if="currentOrder?.status === 'pending'"
            type="success"
            @click="quickConfirm(currentOrder)"
          >
            确认订单
          </el-button>
          <el-button
            v-if="['pending', 'confirmed'].includes(currentOrder?.status)"
            type="danger"
            @click="cancelOrder(currentOrder)"
          >
            取消订单
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量操作对话框 -->
    <el-dialog
      v-model="batchDialog.visible"
      title="批量操作"
      width="450px"
    >
      <div class="batch-content">
        <el-alert
          :title="`已选择 ${selectedOrders.length} 个订单`"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form :model="batchForm" label-width="80px">
          <el-form-item label="操作类型">
            <el-select 
              v-model="batchForm.action" 
              placeholder="选择操作"
              style="width: 100%"
            >
              <el-option label="确认订单" value="confirmed" />
              <el-option label="开始制作" value="cooking" />
              <el-option label="制作完成" value="ready" />
              <el-option label="订单完成" value="completed" />
              <el-option label="取消订单" value="cancelled" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="selected-orders">
          <h4>选中的订单：</h4>
          <div class="order-chips">
            <el-tag
              v-for="order in selectedOrders"
              :key="order.id"
              style="margin: 2px"
            >
              {{ order.orderNo }}
            </el-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="batchDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmBatchOperation"
          :loading="loading.batchOperation"
        >
          确认操作
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit, Refresh, Download, Search, View, Check, Close,
  TrendCharts, Document, Clock, Money, UserFilled
} from '@element-plus/icons-vue'
import {
  getOrders, getOrderDetail, getOrderStats,
  updateOrderStatus, batchUpdateOrderStatus
} from '@/api/order'
import { ORDER_STATUS_MAP, ORDER_STATUS_COLORS } from '@/utils/constants'

// 模拟数据（用于演示）
import { mockOrderAPI } from '@/utils/demo-data-orders'

// 响应式数据
const useMockData = ref(true)
const loading = reactive({
  orders: false,
  stats: false,
  batchOperation: false
})

// API调用函数
const apiCall = {
  getOrders: (params) => useMockData.value ? mockOrderAPI.getOrders(params) : getOrders(params),
  getOrderDetail: (id) => useMockData.value ? mockOrderAPI.getOrderDetail(id) : getOrderDetail(id),
  getOrderStats: (params) => useMockData.value ? mockOrderAPI.getOrderStats(params) : getOrderStats(params),
  updateOrderStatus: (id, data) => useMockData.value ? mockOrderAPI.updateOrderStatus(id, data) : updateOrderStatus(id, data),
  batchUpdateOrderStatus: (data) => useMockData.value ? mockOrderAPI.batchUpdateOrderStatus(data) : batchUpdateOrderStatus(data)
}

// 订单数据
const orders = ref([])
const selectedOrders = ref([])
const currentOrder = ref(null)

// 筛选条件
const filters = reactive({
  status: '',
  search: ''
})
const dateRange = ref([])

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 统计数据
const orderStats = ref([
  {
    key: 'total',
    label: '今日订单',
    value: '0',
    trend: '+0%',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: Document
  },
  {
    key: 'pending',
    label: '待处理',
    value: '0',
    trend: '0',
    trendType: 'warning',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: Clock
  },
  {
    key: 'completed',
    label: '已完成',
    value: '0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: Check
  },
  {
    key: 'revenue',
    label: '今日营收',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: Money
  }
])

// 对话框
const detailDialog = reactive({
  visible: false
})

const batchDialog = reactive({
  visible: false
})

const batchForm = reactive({
  action: ''
})

// 方法
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    confirmed: 'primary',
    cooking: 'info',
    ready: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getAvailableStatuses = (currentStatus) => {
  const statusFlow = {
    pending: { confirmed: '确认', cancelled: '取消' },
    confirmed: { cooking: '制作中', cancelled: '取消' },
    cooking: { ready: '制作完成' },
    ready: { completed: '完成' },
    completed: {},
    cancelled: {}
  }
  return statusFlow[currentStatus] || {}
}

// 加载订单数据
const loadOrders = async () => {
  loading.orders = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(dateRange.value?.length === 2 ? {
        startDate: dateRange.value[0],
        endDate: dateRange.value[1]
      } : {})
    }

    const response = await apiCall.getOrders(params)
    if (response.success) {
      orders.value = response.data.items
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('Load orders error:', error)
    ElMessage.error('加载订单失败')
  } finally {
    loading.orders = false
  }
}

// 加载统计数据
const loadStats = async () => {
  loading.stats = true
  try {
    const response = await apiCall.getOrderStats({ period: 'today' })
    if (response.success) {
      const data = response.data
      
      orderStats.value[0].value = data.totalOrders?.toString() || '0'
      orderStats.value[1].value = data.pendingOrders?.toString() || '0'
      orderStats.value[2].value = data.completedOrders?.toString() || '0'
      orderStats.value[3].value = `¥${data.totalRevenue?.toFixed(2) || '0.00'}`
    }
  } catch (error) {
    console.error('Load stats error:', error)
  } finally {
    loading.stats = false
  }
}

// 搜索订单
const searchOrders = () => {
  pagination.page = 1
  loadOrders()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  pagination.page = 1
  loadOrders()
}

// 刷新订单
const refreshOrders = () => {
  filters.status = ''
  filters.search = ''
  dateRange.value = []
  pagination.page = 1
  loadOrders()
  loadStats()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadOrders()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadOrders()
}

// 选择处理
const handleSelectionChange = (selection) => {
  selectedOrders.value = selection
}

// 显示订单详情
const showOrderDetail = async (order) => {
  try {
    const response = await apiCall.getOrderDetail(order.id)
    if (response.success) {
      currentOrder.value = response.data
      detailDialog.visible = true
    }
  } catch (error) {
    console.error('Get order detail error:', error)
    ElMessage.error('获取订单详情失败')
  }
}

// 关闭详情对话框
const handleDetailClose = () => {
  detailDialog.visible = false
  currentOrder.value = null
}

// 更新订单状态
const handleUpdateOrderStatus = async (order) => {
  try {
    const response = await apiCall.updateOrderStatus(order.id, {
      status: order.status
    })
    if (response.success) {
      ElMessage.success('状态更新成功')
      loadOrders()
    }
  } catch (error) {
    console.error('Update order status error:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    loadOrders()
  }
}

// 快速确认订单
const quickConfirm = async (order) => {
  try {
    const response = await apiCall.updateOrderStatus(order.id, {
      status: 'confirmed'
    })
    if (response.success) {
      ElMessage.success('订单确认成功')
      loadOrders()
      if (detailDialog.visible && currentOrder.value?.id === order.id) {
        currentOrder.value.status = 'confirmed'
      }
    }
  } catch (error) {
    console.error('Confirm order error:', error)
    ElMessage.error('确认订单失败')
  }
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单"${order.orderNo}"吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await apiCall.updateOrderStatus(order.id, {
      status: 'cancelled'
    })
    if (response.success) {
      ElMessage.success('订单取消成功')
      loadOrders()
      if (detailDialog.visible && currentOrder.value?.id === order.id) {
        detailDialog.visible = false
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel order error:', error)
      ElMessage.error('取消订单失败')
    }
  }
}

// 批量操作
const showBatchStatusDialog = () => {
  batchForm.action = ''
  batchDialog.visible = true
}

const confirmBatchOperation = async () => {
  if (!batchForm.action) {
    ElMessage.warning('请选择操作类型')
    return
  }

  try {
    loading.batchOperation = true
    const orderIds = selectedOrders.value.map(order => order.id)
    
    const response = await apiCall.batchUpdateOrderStatus({
      orderIds,
      status: batchForm.action
    })

    if (response.success) {
      ElMessage.success(`批量操作成功，已更新 ${response.data.updatedCount} 个订单`)
      batchDialog.visible = false
      selectedOrders.value = []
      loadOrders()
      loadStats()
    }
  } catch (error) {
    console.error('Batch operation error:', error)
    ElMessage.error('批量操作失败')
  } finally {
    loading.batchOperation = false
  }
}

// 导出订单
const exportOrders = () => {
  ElMessage.info('导出功能开发中...')
}

// 处理模拟数据开关
const handleMockDataChange = (value) => {
  ElMessage.info(value ? '已切换到演示模式' : '已切换到真实API模式')
  loadOrders()
  loadStats()
}

// 生命周期
onMounted(() => {
  loadOrders()
  loadStats()
})
</script>

<style scoped lang="scss">
.orders-management {
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

    &.warning {
      color: #e6a23c;
    }

    &.neutral {
      color: #909399;
    }
  }
}

.main-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  .toolbar-left {
    display: flex;
    gap: 0.5rem;
  }
  
  .toolbar-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}

.order-info {
  .order-no {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    
    .order-number {
      font-weight: 600;
      color: #303133;
    }
    
    .status-tag {
      font-size: 0.75rem;
    }
  }
  
  .order-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #909399;
    
    .table-number {
      font-weight: 500;
    }
  }
}

.user-info {
  .user-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 0.25rem;
  }
  
  .user-phone {
    font-size: 0.75rem;
    color: #909399;
  }
}

.dishes-list {
  .dish-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.875rem;
    
    .dish-name {
      flex: 1;
      color: #303133;
    }
    
    .dish-quantity {
      color: #909399;
      margin: 0 0.5rem;
    }
    
    .dish-price {
      color: #f56c6c;
      font-weight: 500;
    }
  }
  
  .more-dishes {
    text-align: center;
    padding: 0.25rem 0;
  }
}

.amount {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f56c6c;
}

.remark {
  display: inline-block;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #606266;
}

.pagination {
  margin-top: 1.5rem;
  justify-content: center;
}

// 订单详情样式
.order-detail {
  .detail-section {
    margin-bottom: 2rem;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #303133;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #ebeef5;
    }
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
    
    &.full-width {
      flex-direction: column;
      align-items: flex-start;
      
      .label {
        margin-bottom: 0.5rem;
      }
    }
    
    .label {
      min-width: 80px;
      font-weight: 500;
      color: #606266;
    }
    
    .value {
      color: #303133;
      
      &.amount {
        font-weight: 600;
        color: #f56c6c;
        font-size: 1.1rem;
      }
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
    
    .dish-category {
      font-size: 0.75rem;
      color: #909399;
    }
  }
  
  .subtotal {
    font-weight: 600;
    color: #f56c6c;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

// 批量操作样式
.batch-content {
  .selected-orders {
    margin-top: 1rem;
    
    h4 {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #606266;
    }
    
    .order-chips {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      padding: 0.5rem;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .toolbar-left,
    .toolbar-right {
      justify-content: center;
    }
    
    .toolbar-right {
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .orders-management {
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