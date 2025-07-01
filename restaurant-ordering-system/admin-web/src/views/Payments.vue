<!-- src/views/Payments.vue -->
<template>
  <div class="payments-management">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">支付管理</h1>
          <p class="page-subtitle">查看和管理所有支付记录</p>
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
      <div class="stat-card" v-for="stat in paymentStats" :key="stat.key">
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
            @click="refreshPayments"
            :icon="Refresh"
          >
            刷新
          </el-button>
          <el-button
            @click="exportPayments"
            :icon="Download"
          >
            导出
          </el-button>
          <el-button
            type="info"
            @click="showStatsDialog"
            :icon="DataAnalysis"
          >
            详细统计
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-select
            v-model="filters.status"
            placeholder="支付状态"
            style="width: 120px; margin-right: 10px"
            @change="loadPayments"
            clearable
          >
            <el-option
              v-for="(label, value) in PAYMENT_STATUS_MAP"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
          <el-select
            v-model="filters.paymentMethod"
            placeholder="支付方式"
            style="width: 120px; margin-right: 10px"
            @change="loadPayments"
            clearable
          >
            <el-option
              v-for="(label, value) in PAYMENT_METHOD_MAP"
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
            placeholder="搜索支付订单号/交易号..."
            style="width: 200px"
            :prefix-icon="Search"
            @input="searchPayments"
            clearable
          />
        </div>
      </div>

      <!-- 支付记录列表 -->
      <el-table
        v-loading="loading.payments"
        :data="payments"
        style="width: 100%"
        row-key="id"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
      >
        <el-table-column label="支付信息" min-width="200" fixed="left">
          <template #default="{ row }">
            <div class="payment-info">
              <div class="payment-no">
                <span class="payment-number">{{ row.paymentNo }}</span>
                <el-tag
                  :type="getPaymentStatusType(row.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ PAYMENT_STATUS_MAP[row.status] }}
                </el-tag>
              </div>
              <div class="payment-meta">
                <span class="transaction-id">交易号: {{ row.transactionId || '无' }}</span>
                <span class="payment-time">{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="关联订单" width="180">
          <template #default="{ row }">
            <div class="order-info">
              <div class="order-link">
                <el-button
                  type="primary"
                  link
                  @click="viewOrderDetail(row.order)"
                  :icon="Link"
                >
                  {{ row.order?.orderNo }}
                </el-button>
              </div>
              <div class="order-meta">
                <span class="user-name">{{ row.order?.user?.nickName || '匿名用户' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="支付方式" width="120" align="center">
          <template #default="{ row }">
            <div class="payment-method">
              <el-icon 
                :style="{ color: getPaymentMethodColor(row.paymentMethod) }"
                size="20"
              >
                <component :is="getPaymentMethodIcon(row.paymentMethod)" />
              </el-icon>
              <span>{{ PAYMENT_METHOD_MAP[row.paymentMethod] }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="金额" width="120" align="center">
          <template #default="{ row }">
            <div class="amount">¥{{ row.amount }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="支付状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getPaymentStatusType(row.status)"
              size="small"
            >
              {{ PAYMENT_STATUS_MAP[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="支付时间" width="160">
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.paidAt" class="paid-time">
                {{ formatDateTime(row.paidAt) }}
              </div>
              <div v-else class="pending-time">
                <span class="pending-text">待支付</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="showPaymentDetail(row)"
              :icon="View"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'success'"
              type="warning"
              link
              @click="handleRefund(row)"
              :icon="RefreshLeft"
            >
              退款
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

    <!-- 支付详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="支付详情"
      width="700px"
      :before-close="handleDetailClose"
    >
      <div v-if="currentPayment" class="payment-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">支付订单号：</span>
                <span class="value">{{ currentPayment.paymentNo }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">支付状态：</span>
                <el-tag :type="getPaymentStatusType(currentPayment.status)">
                  {{ PAYMENT_STATUS_MAP[currentPayment.status] }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">支付金额：</span>
                <span class="value amount">¥{{ currentPayment.amount }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">支付方式：</span>
                <span class="value payment-method-text">
                  <el-icon 
                    :style="{ color: getPaymentMethodColor(currentPayment.paymentMethod) }"
                  >
                    <component :is="getPaymentMethodIcon(currentPayment.paymentMethod)" />
                  </el-icon>
                  {{ PAYMENT_METHOD_MAP[currentPayment.paymentMethod] }}
                </span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDateTime(currentPayment.createdAt) }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="label">支付时间：</span>
                <span class="value">{{ currentPayment.paidAt ? formatDateTime(currentPayment.paidAt) : '未支付' }}</span>
              </div>
            </el-col>
          </el-row>
          <div v-if="currentPayment.transactionId" class="detail-item full-width">
            <span class="label">第三方交易号：</span>
            <span class="value transaction-id">{{ currentPayment.transactionId }}</span>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="detail-section" v-if="currentPayment.order">
          <h3 class="section-title">关联订单</h3>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">订单号：</span>
                <el-button
                  type="primary"
                  link
                  @click="viewOrderDetail(currentPayment.order)"
                >
                  {{ currentPayment.order.orderNo }}
                </el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">订单状态：</span>
                <el-tag 
                  :type="getOrderStatusType(currentPayment.order.status)"
                  size="small"
                >
                  {{ ORDER_STATUS_MAP[currentPayment.order.status] }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">订单金额：</span>
                <span class="value">¥{{ currentPayment.order.totalAmount }}</span>
              </div>
            </el-col>
          </el-row>
          <div v-if="currentPayment.order.user" class="detail-item">
            <span class="label">用户信息：</span>
            <span class="value">
              {{ currentPayment.order.user.nickName }}
              <span v-if="currentPayment.order.user.phone" class="user-phone">
                ({{ currentPayment.order.user.phone }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialog.visible = false">关闭</el-button>
          <el-button
            v-if="currentPayment?.status === 'success'"
            type="warning"
            @click="handleRefund(currentPayment)"
          >
            申请退款
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog
      v-model="refundDialog.visible"
      title="申请退款"
      width="500px"
    >
      <div class="refund-content">
        <el-alert
          title="退款提醒"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>退款后资金将原路返回，到账时间为1-3个工作日</p>
          </template>
        </el-alert>
        
        <div class="refund-info">
          <div class="info-item">
            <span class="label">支付订单号：</span>
            <span class="value">{{ refundForm.paymentNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">退款金额：</span>
            <span class="value amount">¥{{ refundForm.amount }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付方式：</span>
            <span class="value">{{ PAYMENT_METHOD_MAP[refundForm.paymentMethod] }}</span>
          </div>
        </div>

        <el-form :model="refundForm" label-width="80px">
          <el-form-item label="退款原因">
            <el-input
              v-model="refundForm.reason"
              type="textarea"
              placeholder="请输入退款原因（可选）"
              maxlength="200"
              show-word-limit
              :rows="3"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="refundDialog.visible = false">取消</el-button>
        <el-button
          type="warning"
          @click="confirmRefund"
          :loading="loading.refund"
        >
          确认退款
        </el-button>
      </template>
    </el-dialog>

    <!-- 详细统计对话框 -->
    <el-dialog
      v-model="statsDialog.visible"
      title="详细统计"
      width="800px"
    >
      <div v-loading="loading.detailStats" class="stats-detail">
        <div class="stats-section">
          <h4>支付方式分布</h4>
          <div class="method-stats">
            <div 
              v-for="(data, method) in detailStats.paymentMethodStats" 
              :key="method"
              class="method-item"
            >
              <div class="method-header">
                <el-icon 
                  :style="{ color: getPaymentMethodColor(method) }"
                  size="20"
                >
                  <component :is="getPaymentMethodIcon(method)" />
                </el-icon>
                <span class="method-name">{{ PAYMENT_METHOD_MAP[method] }}</span>
              </div>
              <div class="method-data">
                <div class="data-item">
                  <span class="data-label">笔数：</span>
                  <span class="data-value">{{ data.count }}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">金额：</span>
                  <span class="data-value amount">¥{{ data.amount?.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-section">
          <h4>状态分布</h4>
          <div class="status-stats">
            <div 
              v-for="(count, status) in detailStats.statusStats" 
              :key="status"
              class="status-item"
            >
              <el-tag 
                :type="getPaymentStatusType(status)"
                size="large"
              >
                {{ PAYMENT_STATUS_MAP[status] }}
              </el-tag>
              <span class="status-count">{{ count }}笔</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, Search, View, RefreshLeft, Link,
  TrendCharts, Money, SuccessFilled, WarningFilled, DataAnalysis,
  ChatDotRound, Wallet
} from '@element-plus/icons-vue'
import {
  getPayments, getPaymentStats, refundPayment
} from '@/api/payment'

// 模拟数据（用于演示）
import { mockPaymentAPI } from '@/utils/demo-data-payments'

// 常量定义
const PAYMENT_STATUS_MAP = {
  pending: '待支付',
  success: '支付成功',
  failed: '支付失败',
  refunded: '已退款'
}

const PAYMENT_METHOD_MAP = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金支付'
}

const ORDER_STATUS_MAP = {
  pending: '待确认',
  confirmed: '已确认',
  cooking: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消'
}

// 响应式数据
const useMockData = ref(true)
const loading = reactive({
  payments: false,
  stats: false,
  detailStats: false,
  refund: false
})

// API调用函数
const apiCall = {
  getPayments: (params) => useMockData.value ? mockPaymentAPI.getPayments(params) : getPayments(params),
  getPaymentStats: (params) => useMockData.value ? mockPaymentAPI.getPaymentStats(params) : getPaymentStats(params),
  refundPayment: (id, data) => useMockData.value ? mockPaymentAPI.refundPayment(id, data) : refundPayment(id, data)
}

// 支付数据
const payments = ref([])
const currentPayment = ref(null)

// 筛选条件
const filters = reactive({
  status: '',
  paymentMethod: '',
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
const paymentStats = ref([
  {
    key: 'total',
    label: '今日支付',
    value: '0',
    trend: '+0%',
    trendType: 'neutral',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: Money
  },
  {
    key: 'success',
    label: '成功支付',
    value: '0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: SuccessFilled
  },
  {
    key: 'failed',
    label: '失败支付',
    value: '0',
    trend: '0',
    trendType: 'negative',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: WarningFilled
  },
  {
    key: 'revenue',
    label: '今日收入',
    value: '¥0',
    trend: '+0%',
    trendType: 'positive',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: Money
  }
])

const detailStats = ref({
  paymentMethodStats: {},
  statusStats: {}
})

// 对话框
const detailDialog = reactive({
  visible: false
})

const refundDialog = reactive({
  visible: false
})

const statsDialog = reactive({
  visible: false
})

const refundForm = reactive({
  paymentNo: '',
  amount: '',
  paymentMethod: '',
  reason: ''
})

// 方法
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getPaymentStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    success: 'success',
    failed: 'danger',
    refunded: 'info'
  }
  return typeMap[status] || 'info'
}

const getOrderStatusType = (status) => {
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

// 加载支付数据
const loadPayments = async () => {
  loading.payments = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(dateRange.value?.length === 2 ? {
        startDate: dateRange.value[0],
        endDate: dateRange.value[1]
      } : {})
    }

    const response = await apiCall.getPayments(params)
    if (response.success) {
      payments.value = response.data.items
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('Load payments error:', error)
    ElMessage.error('加载支付记录失败')
  } finally {
    loading.payments = false
  }
}

// 加载统计数据
const loadStats = async () => {
  loading.stats = true
  try {
    const response = await apiCall.getPaymentStats({ period: 'today' })
    if (response.success) {
      const data = response.data.summary
      
      paymentStats.value[0].value = data.totalPayments?.toString() || '0'
      paymentStats.value[1].value = data.successPayments?.toString() || '0'
      paymentStats.value[2].value = data.failedPayments?.toString() || '0'
      paymentStats.value[3].value = `¥${data.totalAmount?.toFixed(2) || '0.00'}`
      
      // 保存详细统计数据
      detailStats.value = {
        paymentMethodStats: response.data.paymentMethodStats || {},
        statusStats: response.data.statusStats || {}
      }
    }
  } catch (error) {
    console.error('Load stats error:', error)
  } finally {
    loading.stats = false
  }
}

// 搜索支付记录
const searchPayments = () => {
  pagination.page = 1
  loadPayments()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  pagination.page = 1
  loadPayments()
}

// 刷新支付记录
const refreshPayments = () => {
  filters.status = ''
  filters.paymentMethod = ''
  filters.search = ''
  dateRange.value = []
  pagination.page = 1
  loadPayments()
  loadStats()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadPayments()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadPayments()
}

// 显示支付详情
const showPaymentDetail = (payment) => {
  currentPayment.value = payment
  detailDialog.visible = true
}

// 关闭详情对话框
const handleDetailClose = () => {
  detailDialog.visible = false
  currentPayment.value = null
}

// 查看订单详情
const viewOrderDetail = (order) => {
  // 这里可以跳转到订单详情页面或打开订单详情对话框
  ElMessage.info(`查看订单：${order.orderNo}`)
}

// 处理退款
const handleRefund = (payment) => {
  refundForm.paymentNo = payment.paymentNo
  refundForm.amount = payment.amount
  refundForm.paymentMethod = payment.paymentMethod
  refundForm.reason = ''
  refundDialog.visible = true
}

// 确认退款
const confirmRefund = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要对支付订单"${refundForm.paymentNo}"申请退款吗？`,
      '确认退款',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.refund = true
    const payment = currentPayment.value || payments.value.find(p => p.paymentNo === refundForm.paymentNo)
    
    const response = await apiCall.refundPayment(payment.id, {
      reason: refundForm.reason || '用户申请退款'
    })

    if (response.success) {
      ElMessage.success('退款申请成功')
      refundDialog.visible = false
      if (detailDialog.visible) {
        detailDialog.visible = false
      }
      loadPayments()
      loadStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Refund error:', error)
      ElMessage.error('退款申请失败')
    }
  } finally {
    loading.refund = false
  }
}

// 显示详细统计
const showStatsDialog = () => {
  statsDialog.visible = true
}

// 导出支付记录
const exportPayments = () => {
  ElMessage.info('导出功能开发中...')
}

// 处理模拟数据开关
const handleMockDataChange = (value) => {
  ElMessage.info(value ? '已切换到演示模式' : '已切换到真实API模式')
  loadPayments()
  loadStats()
}

// 生命周期
onMounted(() => {
  loadPayments()
  loadStats()
})
</script>

<style scoped lang="scss">
.payments-management {
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

.payment-info {
  .payment-no {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    
    .payment-number {
      font-weight: 600;
      color: #303133;
    }
    
    .status-tag {
      font-size: 0.75rem;
    }
  }
  
  .payment-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #909399;
    
    .transaction-id {
      font-family: monospace;
    }
  }
}

.order-info {
  .order-link {
    margin-bottom: 0.25rem;
  }
  
  .order-meta {
    font-size: 0.75rem;
    color: #909399;
  }
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  span {
    font-size: 0.875rem;
  }
}

.amount {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f56c6c;
}

.time-info {
  .paid-time {
    color: #303133;
    font-size: 0.875rem;
  }
  
  .pending-time {
    .pending-text {
      color: #e6a23c;
      font-size: 0.875rem;
    }
  }
}

.pagination {
  margin-top: 1.5rem;
  justify-content: center;
}

// 支付详情样式
.payment-detail {
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
      min-width: 100px;
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
      
      &.payment-method-text {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      &.transaction-id {
        font-family: monospace;
        background: #f5f7fa;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
      }
    }
    
    .user-phone {
      color: #909399;
      margin-left: 0.5rem;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

// 退款对话框样式
.refund-content {
  .refund-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        color: #606266;
        font-weight: 500;
      }
      
      .value {
        color: #303133;
        
        &.amount {
          font-weight: 600;
          color: #f56c6c;
        }
      }
    }
  }
}

// 详细统计样式
.stats-detail {
  .stats-section {
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
  
  .method-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    
    .method-item {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      
      .method-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        
        .method-name {
          font-weight: 500;
          color: #303133;
        }
      }
      
      .method-data {
        .data-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          
          .data-label {
            color: #606266;
            font-size: 0.875rem;
          }
          
          .data-value {
            color: #303133;
            font-weight: 500;
            
            &.amount {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
  
  .status-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      
      .status-count {
        font-weight: 600;
        color: #303133;
      }
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
  .payments-management {
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