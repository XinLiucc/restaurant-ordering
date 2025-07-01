import api from './index'

/**
 * 菜单管理API
 */

// 分类管理
export const getCategories = (params) => {
  return api.get('/menu/categories', params)
}

export const createCategory = (categoryData) => {
  return api.post('/menu/categories', categoryData)
}

export const updateCategory = (id, categoryData) => {
  return api.put(`/menu/categories/${id}`, categoryData)
}

export const deleteCategory = (id) => {
  return api.delete(`/menu/categories/${id}`)
}

export const getCategoryStats = () => {
  return api.get('/menu/categories/stats')
}

// 菜品管理
export const getDishes = (params) => {
  return api.get('/menu/dishes', params)
}

export const createDish = (dishData) => {
  return api.post('/menu/dishes', dishData)
}

export const updateDish = (id, dishData) => {
  return api.put(`/menu/dishes/${id}`, dishData)
}

export const deleteDish = (id) => {
  return api.delete(`/menu/dishes/${id}`)
}

export const batchUpdateDishStatus = (data) => {
  return api.put('/menu/dishes/batch/status', data)
}
