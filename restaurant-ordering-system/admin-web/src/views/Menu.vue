<!-- src/views/Menu.vue -->
<template>
  <div class="menu-management">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">菜单管理</h1>
          <p class="page-subtitle">管理餐厅菜单分类和菜品信息</p>
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

    <!-- 功能区域 -->
    <div class="menu-tabs">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <!-- 分类管理 -->
        <el-tab-pane label="分类管理" name="categories">
          <div class="tab-content">
            <!-- 操作栏 -->
            <div class="toolbar">
              <div class="toolbar-left">
                <el-button 
                  type="primary" 
                  @click="showCategoryDialog()"
                  :icon="Plus"
                >
                  添加分类
                </el-button>
                <el-button 
                  @click="refreshCategories"
                  :icon="Refresh"
                >
                  刷新
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-input
                  v-model="categorySearch"
                  placeholder="搜索分类..."
                  style="width: 200px"
                  :prefix-icon="Search"
                  @input="searchCategories"
                  clearable
                />
              </div>
            </div>

            <!-- 分类列表 -->
            <el-table
              v-loading="loading.categories"
              :data="categories"
              style="width: 100%"
              row-key="id"
            >
              <el-table-column label="排序" width="80">
                <template #default="{ row }">
                  <span class="sort-order">{{ row.sortOrder }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="分类名称" min-width="150">
                <template #default="{ row }">
                  <div class="category-name">
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="描述" min-width="200">
                <template #default="{ row }">
                  <span class="description">{{ row.description || '暂无描述' }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="菜品数量" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.dishCount || 0 }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === 'active' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ row.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="创建时间" width="150">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    @click="showCategoryDialog(row)"
                    :icon="Edit"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    @click="handleDeleteCategory(row)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-model:current-page="categoryPagination.page"
              v-model:page-size="categoryPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="categoryPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleCategorySizeChange"
              @current-change="handleCategoryPageChange"
              class="pagination"
            />
          </div>
        </el-tab-pane>

        <!-- 菜品管理 -->
        <el-tab-pane label="菜品管理" name="dishes">
          <div class="tab-content">
            <!-- 操作栏 -->
            <div class="toolbar">
              <div class="toolbar-left">
                <el-button 
                  type="primary" 
                  @click="showDishDialog()"
                  :icon="Plus"
                >
                  添加菜品
                </el-button>
                <el-button
                  type="warning"
                  @click="showBatchStatusDialog"
                  :disabled="selectedDishes.length === 0"
                  :icon="Edit"
                >
                  批量操作
                </el-button>
                <el-button 
                  @click="refreshDishes"
                  :icon="Refresh"
                >
                  刷新
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-select
                  v-model="dishFilters.categoryId"
                  placeholder="选择分类"
                  style="width: 150px; margin-right: 10px"
                  @change="loadDishes"
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
                  v-model="dishFilters.status"
                  placeholder="状态"
                  style="width: 120px; margin-right: 10px"
                  @change="loadDishes"
                  clearable
                >
                  <el-option label="可用" value="available" />
                  <el-option label="不可用" value="unavailable" />
                </el-select>
                <el-input
                  v-model="dishSearch"
                  placeholder="搜索菜品..."
                  style="width: 200px"
                  :prefix-icon="Search"
                  @input="searchDishes"
                  clearable
                />
              </div>
            </div>

            <!-- 菜品列表 -->
            <el-table
              v-loading="loading.dishes"
              :data="dishes"
              style="width: 100%"
              row-key="id"
              @selection-change="handleDishSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              
              <el-table-column label="图片" width="80">
                <template #default="{ row }">
                  <el-avatar
                    :size="50"
                    :src="row.image"
                    shape="square"
                    style="border-radius: 8px"
                  >
                    <el-icon><Picture /></el-icon>
                  </el-avatar>
                </template>
              </el-table-column>
              
              <el-table-column label="菜品名称" min-width="150">
                <template #default="{ row }">
                  <div class="dish-info">
                    <div class="dish-name">{{ row.name }}</div>
                    <div class="dish-tags" v-if="row.tags && row.tags.length">
                      <el-tag
                        v-for="tag in row.tags.slice(0, 3)"
                        :key="tag"
                        size="small"
                        style="margin-right: 4px"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="分类" width="120">
                <template #default="{ row }">
                  <el-tag type="info" size="small">
                    {{ row.category?.name || '未分类' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="价格" width="100" align="center">
                <template #default="{ row }">
                  <span class="price">¥{{ row.price }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    active-value="available"
                    inactive-value="unavailable"
                    @change="toggleDishStatus(row)"
                  />
                </template>
              </el-table-column>
              
              <el-table-column label="排序" width="80" align="center">
                <template #default="{ row }">
                  <span class="sort-order">{{ row.sortOrder }}</span>
                </template>
              </el-table-column>
              
              <el-table-column label="创建时间" width="150">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    @click="showDishDialog(row)"
                    :icon="Edit"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    @click="deleteDishItem(row)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <el-pagination
              v-model:current-page="dishPagination.page"
              v-model:page-size="dishPagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="dishPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleDishSizeChange"
              @current-change="handleDishPageChange"
              class="pagination"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 分类对话框 -->
    <el-dialog
      v-model="categoryDialog.visible"
      :title="categoryDialog.isEdit ? '编辑分类' : '添加分类'"
      width="500px"
      @close="resetCategoryForm"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            placeholder="请输入分类描述"
            maxlength="500"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number
            v-model="categoryForm.sortOrder"
            :min="0"
            :max="999"
            placeholder="排序值"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="categoryForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categoryDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="saveCategoryForm"
          :loading="loading.categorySubmit"
        >
          {{ categoryDialog.isEdit ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 菜品对话框 -->
    <el-dialog
      v-model="dishDialog.visible"
      :title="dishDialog.isEdit ? '编辑菜品' : '添加菜品'"
      width="600px"
      @close="resetDishForm"
    >
      <el-form
        ref="dishFormRef"
        :model="dishForm"
        :rules="dishRules"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜品名称" prop="name">
              <el-input
                v-model="dishForm.name"
                placeholder="请输入菜品名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-select
                v-model="dishForm.categoryId"
                placeholder="选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number
                v-model="dishForm.price"
                :min="0"
                :max="9999.99"
                :precision="2"
                placeholder="价格"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="dishForm.sortOrder"
                :min="0"
                :max="999"
                placeholder="排序值"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="dishForm.description"
            type="textarea"
            placeholder="请输入菜品描述"
            maxlength="1000"
            show-word-limit
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="菜品图片" prop="image">
          <div class="image-upload">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
              :http-request="uploadImage"
              accept="image/*"
            >
              <div v-if="dishForm.image" class="image-preview">
                <img :src="dishForm.image" alt="菜品图片" />
                <div class="image-overlay">
                  <el-icon><Plus /></el-icon>
                </div>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传图片</div>
              </div>
            </el-upload>
            <div class="upload-tips">
              <p>• 建议图片尺寸：400x300像素</p>
              <p>• 支持格式：JPG、PNG、WebP</p>
              <p>• 文件大小不超过5MB</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <div class="tags-input">
            <el-tag
              v-for="tag in dishForm.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              class="tag-input"
              size="small"
              @keyup.enter="handleTagInputConfirm"
              @blur="handleTagInputConfirm"
              style="width: 100px"
            />
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              @click="showTagInput"
            >
              + 添加标签
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dishForm.status">
            <el-radio value="available">可用</el-radio>
            <el-radio value="unavailable">不可用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dishDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="saveDishForm"
          :loading="loading.dishSubmit"
        >
          {{ dishDialog.isEdit ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量状态对话框 -->
    <el-dialog
      v-model="batchStatusDialog.visible"
      title="批量操作"
      width="400px"
    >
      <div class="batch-content">
        <p>已选择 <strong>{{ selectedDishes.length }}</strong> 个菜品</p>
        <el-form :model="batchForm" label-width="80px">
          <el-form-item label="操作类型">
            <el-select v-model="batchForm.action" placeholder="选择操作">
              <el-option label="设为可用" value="available" />
              <el-option label="设为不可用" value="unavailable" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="batchStatusDialog.visible = false">取消</el-button>
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
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Edit, Delete, Refresh, Search, Picture
} from '@element-plus/icons-vue'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getDishes, createDish, updateDish, deleteDish, batchUpdateDishStatus
} from '@/api/menu'
import { uploadImage as uploadImageAPI } from '@/api/upload'
// 导入模拟数据（用于演示）
import { 
  mockCategoryAPI, 
  mockDishAPI, 
  mockUploadAPI 
} from '@/utils/demo-data-menu'

// 响应式数据
const route = useRoute()
const router = useRouter()
const activeTab = ref('categories')

// 是否使用模拟数据（用于演示）
const useMockData = ref(true)
const loading = reactive({
  categories: false,
  dishes: false,
  categorySubmit: false,
  dishSubmit: false,
  batchOperation: false
})

// 分类相关
const categories = ref([])
const categorySearch = ref('')
const categoryPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const categoryDialog = reactive({
  visible: false,
  isEdit: false
})

const categoryForm = reactive({
  name: '',
  description: '',
  sortOrder: 0,
  status: 'active'
})

const categoryFormRef = ref()
// API调用函数（支持模拟数据）
const apiCall = {
  // 分类API
  getCategories: (params) => useMockData.value ? mockCategoryAPI.getCategories(params) : getCategories(params),
  createCategory: (data) => useMockData.value ? mockCategoryAPI.createCategory(data) : createCategory(data),
  updateCategory: (id, data) => useMockData.value ? mockCategoryAPI.updateCategory(id, data) : updateCategory(id, data),
  deleteCategory: (id) => useMockData.value ? mockCategoryAPI.deleteCategory(id) : deleteCategory(id),
  
  // 菜品API
  getDishes: (params) => useMockData.value ? mockDishAPI.getDishes(params) : getDishes(params),
  createDish: (data) => useMockData.value ? mockDishAPI.createDish(data) : createDish(data),
  updateDish: (id, data) => useMockData.value ? mockDishAPI.updateDish(id, data) : updateDish(id, data),
  deleteDish: (id) => useMockData.value ? mockDishAPI.deleteDish(id) : deleteDish(id),
  batchUpdateDishStatus: (data) => useMockData.value ? mockDishAPI.batchUpdateDishStatus(data) : batchUpdateDishStatus(data),
  
  // 上传API
  uploadImage: (file) => useMockData.value ? mockUploadAPI.uploadImage(file) : uploadImageAPI(file)
};

const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ],
  sortOrder: [
    { type: 'number', message: '排序必须是数字', trigger: 'blur' }
  ]
}

// 菜品相关
const dishes = ref([])
const dishSearch = ref('')
const dishFilters = reactive({
  categoryId: '',
  status: ''
})
const dishPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const selectedDishes = ref([])

const dishDialog = reactive({
  visible: false,
  isEdit: false
})

const dishForm = reactive({
  name: '',
  description: '',
  price: 0,
  categoryId: '',
  image: '',
  tags: [],
  sortOrder: 0,
  status: 'available'
});

const dishFormRef = ref();
const dishRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '菜品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: ['blur', 'change'] },
    { type: 'number', min: 0, max: 9999.99, message: '价格范围：0-9999.99', trigger: ['blur', 'change'] }
  ],
  description: [
    { max: 1000, message: '描述不能超过 1000 个字符', trigger: 'blur' }
  ]
};

// 标签输入
const tagInputVisible = ref(false);
const tagInputValue = ref('');
const tagInputRef = ref();

// 批量操作
const batchStatusDialog = reactive({
  visible: false
});

const batchForm = reactive({
  action: ''
});

// 方法
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 分类管理方法
const loadCategories = async () => {
  loading.categories = true
  try {
    const params = {
      page: categoryPagination.page,
      limit: categoryPagination.limit
    }
    if (categorySearch.value) {
      params.search = categorySearch.value
    }

    const response = await apiCall.getCategories(params)
    if (response.success) {
      categories.value = response.data.items
      categoryPagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('Load categories error:', error)
    ElMessage.error('加载分类失败')
  } finally {
    loading.categories = false
  }
}

const searchCategories = () => {
  categoryPagination.page = 1;
  loadCategories();
};

const refreshCategories = () => {
  categorySearch.value = '';
  categoryPagination.page = 1;
  loadCategories();
};

const handleCategorySizeChange = (size) => {
  categoryPagination.limit = size;
  categoryPagination.page = 1;
  loadCategories();
};

const handleCategoryPageChange = (page) => {
  categoryPagination.page = page;
  loadCategories();
};

const showCategoryDialog = (category = null) => {
  categoryDialog.isEdit = !!category;
  if (category) {
    Object.assign(categoryForm, category);
  }
  categoryDialog.visible = true;
};

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    name: '',
    description: '',
    sortOrder: 0,
    status: 'active'
  });
  categoryFormRef.value?.clearValidate();
};

const saveCategoryForm = async () => {
  if (!categoryFormRef.value) return

  try {
    const valid = await categoryFormRef.value.validate()
    if (!valid) return

    loading.categorySubmit = true

    let response
    if (categoryDialog.isEdit) {
      response = await apiCall.updateCategory(categoryForm.id, categoryForm)
    } else {
      response = await apiCall.createCategory(categoryForm)
    }

    if (response.success) {
      ElMessage.success(categoryDialog.isEdit ? '更新成功' : '添加成功')
      categoryDialog.visible = false
      loadCategories()
    }
  } catch (error) {
    console.error('Save category error:', error)
    ElMessage.error(categoryDialog.isEdit ? '更新失败' : '添加失败')
  } finally {
    loading.categorySubmit = false
  }
}

const handleDeleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await deleteCategory(category.id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadCategories()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete category error:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 菜品管理方法
const deleteDishItem = async (dish) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜品"${dish.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await deleteDish(dish.id)
    if (response.success) {
      ElMessage.success('删除成功')
      loadDishes()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete dish error:', error)
      ElMessage.error('删除失败')
    }
  }
}
const loadDishes = async () => {
  loading.dishes = true
  try {
    const params = {
      page: dishPagination.page,
      limit: dishPagination.limit,
      ...(dishFilters.categoryId ? { categoryId: dishFilters.categoryId } : {}),
      ...(dishFilters.status ? { status: dishFilters.status } : {}),
    }
    if (dishSearch.value) {
      params.search = dishSearch.value
    }

    const response = await getDishes(params)
    if (response.success) {
      dishes.value = response.data.items
      dishPagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('Load dishes error:', error)
    ElMessage.error('加载菜品失败')
  } finally {
    loading.dishes = false
  }
}

const searchDishes = () => {
  dishPagination.page = 1;
  loadDishes();
};

const refreshDishes = () => {
  dishSearch.value = '';
  dishFilters.categoryId = '';
  dishFilters.status = '';
  dishPagination.page = 1;
  loadDishes();
};

const handleDishSizeChange = (size) => {
  dishPagination.limit = size;
  dishPagination.page = 1;
  loadDishes();
};

const handleDishPageChange = (page) => {
  dishPagination.page = page;
  loadDishes();
};

const handleDishSelectionChange = (selection) => {
  selectedDishes.value = selection;
};

const showDishDialog = (dish = null) => {
  dishDialog.isEdit = !!dish;
  if (dish) {
    Object.assign(dishForm, dish);
  }
  dishDialog.visible = true;
};

const resetDishForm = () => {
  Object.assign(dishForm, {
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    image: '',
    tags: [],
    sortOrder: 0,
    status: 'available'
  });
  dishFormRef.value?.clearValidate();
};

const saveDishForm = async () => {
  console.log('提交的数据：', JSON.stringify(dishForm, null, 2)); // ← 在这里打印
  if (!dishFormRef.value) return

  try {
    const valid = await dishFormRef.value.validate()
    if (!valid) return

    loading.dishSubmit = true

    const payload = {
      ...dishForm,
      price: Number(dishForm.price),                 // 确保price是数字
      categoryId: Number(dishForm.categoryId),       // 确保categoryId是数字
      tags: Array.isArray(dishForm.tags) ? dishForm.tags : [],  // tags转数组
      image: dishForm.image || '',                    // 防止null传给后端
      sortOrder: Number(dishForm.sortOrder) || 0,
      status: dishForm.status || 'available'
    }

    let response
    if (dishDialog.isEdit) {
      response = await apiCall.updateDish(dishForm.id, dishForm)
    } else {
      response = await apiCall.createDish(dishForm)
    }

    if (response.success) {
      ElMessage.success(dishDialog.isEdit ? '更新成功' : '添加成功')
      dishDialog.visible = false
      loadDishes()
    }
  } catch (error) {
    console.error('Save dish error:', error)
    ElMessage.error(dishDialog.isEdit ? '更新失败' : '添加失败')
  } finally {
    loading.dishSubmit = false
  }
}

const toggleDishStatus = async (dish) => {
  try {
    const response = await apiCall.updateDish(dish.id, {
      status: dish.status
    })
    if (response.success) {
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    console.error('Toggle dish status error:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    dish.status = dish.status === 'available' ? 'unavailable' : 'available'
  }
}

// 图片上传
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

const uploadImage = async (options) => {
  try {
    const response = await apiCall.uploadImage(options.file);
    if (response.success) {
      dishForm.image = response.data.url;
      ElMessage.success('图片上传成功');
    }
  } catch (error) {
    console.error('Upload image error:', error);
    ElMessage.error('图片上传失败');
  }
};

// 标签管理
const removeTag = (tag) => {
  const index = dishForm.tags.indexOf(tag);
  if (index > -1) {
    dishForm.tags.splice(index, 1);
  }
};

const showTagInput = () => {
  tagInputVisible.value = true;
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

const handleTagInputConfirm = () => {
  if (!Array.isArray(dishForm.tags)) {
    dishForm.tags = [];
  }
  if (tagInputValue.value && !dishForm.tags.includes(tagInputValue.value)) {
    if (dishForm.tags.length < 10) {
      dishForm.tags.push(tagInputValue.value);
    } else {
      ElMessage.warning('标签数量不能超过10个');
    }
  }
  tagInputVisible.value = false;
  tagInputValue.value = '';
};

// 批量操作
const showBatchStatusDialog = () => {
  batchForm.action = '';
  batchStatusDialog.visible = true;
};

const confirmBatchOperation = async () => {
  if (!batchForm.action) {
    ElMessage.warning('请选择操作类型')
    return
  }

  try {
    loading.batchOperation = true
    const dishIds = selectedDishes.value.map(dish => dish.id)
    
    const response = await apiCall.batchUpdateDishStatus({
      dishIds,
      status: batchForm.action
    })

    if (response.success) {
      ElMessage.success(`批量操作成功，已更新 ${response.data.updatedCount} 个菜品`)
      batchStatusDialog.visible = false
      selectedDishes.value = []
      loadDishes()
    }
  } catch (error) {
    console.error('Batch operation error:', error)
    ElMessage.error('批量操作失败')
  } finally {
    loading.batchOperation = false
  }
}

// 处理模拟数据开关
const handleMockDataChange = (value) => {
  ElMessage.info(value ? '已切换到演示模式' : '已切换到真实API模式');
  // 重新加载数据
  loadCategories();
  loadDishes();
};

// 处理选项卡切换
const handleTabChange = (tab) => {
  const routeMap = {
    categories: '/menu/categories',
    dishes: '/menu/dishes'
  };
  
  if (routeMap[tab] && route.path !== routeMap[tab]) {
    router.push(routeMap[tab]);
  }
};

// 根据路由设置选项卡
const initTabFromRoute = () => {
  if (route.path.includes('/menu/dishes')) {
    activeTab.value = 'dishes';
  } else {
    activeTab.value = 'categories';
  }
};

// 监听路由变化
watch(() => route.path, () => {
  initTabFromRoute();
});

// 生命周期
onMounted(() => {
  initTabFromRoute();
  loadCategories();
  loadDishes();
});
</script>

<style scoped lang="scss">
.menu-management {
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

.menu-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;
  }
  
  :deep(.el-tabs__header) {
    background: #f8f9fa;
    border-radius: 12px 12px 0 0;
    margin: 0;
    border-bottom: 1px solid #ebeef5;
  }
  
  :deep(.el-tabs__content) {
    padding: 0;
  }
}

.tab-content {
  padding: 1.5rem;
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

.sort-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #f0f2f5;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: #606266;
}

.category-name {
  font-weight: 500;
  color: #303133;
}

.description {
  color: #606266;
  font-size: 0.875rem;
}

.dish-info {
  .dish-name {
    font-weight: 500;
    color: #303133;
    margin-bottom: 0.25rem;
  }
  
  .dish-tags {
    margin-top: 0.25rem;
  }
}

.price {
  font-weight: 600;
  color: #f56c6c;
  font-size: 1rem;
}

.pagination {
  margin-top: 1.5rem;
  justify-content: center;
}

// 图片上传样式
.image-upload {
  display: flex;
  gap: 1rem;
  
  .image-uploader {
    .image-preview {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 2px dashed #d9d9d9;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
        color: white;
        font-size: 1.5rem;
        
        &:hover {
          opacity: 1;
        }
      }
    }
    
    .upload-placeholder {
      width: 120px;
      height: 120px;
      border: 2px dashed #d9d9d9;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #667eea;
      }
      
      .upload-icon {
        font-size: 2rem;
        color: #c0c4cc;
        margin-bottom: 0.5rem;
      }
      
      .upload-text {
        font-size: 0.875rem;
        color: #606266;
      }
    }
  }
  
  .upload-tips {
    flex: 1;
    
    p {
      margin: 0.25rem 0;
      font-size: 0.75rem;
      color: #909399;
    }
  }
}

// 标签输入样式
.tags-input {
  .tag-input {
    width: 100px;
    margin-right: 8px;
    margin-bottom: 8px;
  }
  
  .button-new-tag {
    height: 24px;
    line-height: 22px;
    margin-right: 8px;
    margin-bottom: 8px;
  }
}

// 批量操作对话框
.batch-content {
  text-align: center;
  
  p {
    margin-bottom: 1rem;
    font-size: 1rem;
    
    strong {
      color: #667eea;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .menu-management {
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

  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .toolbar-left,
    .toolbar-right {
      justify-content: center;
    }
  }
  
  .image-upload {
    flex-direction: column;
  }
}
</style>