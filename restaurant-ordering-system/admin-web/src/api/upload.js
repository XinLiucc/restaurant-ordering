import api from './index'

/**
 * 文件上传API
 */

// 单图片上传
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  return api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 多图片上传
export const uploadImages = (files) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('images', file)
  })
  
  return api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取文件列表
export const getFiles = (params) => {
  return api.get('/upload/files', params)
}

// 获取上传统计
export const getUploadStats = () => {
  return api.get('/upload/stats')
}

// 删除文件
export const deleteFile = (filename) => {
  return api.delete(`/upload/${filename}`)
}

// 批量删除文件
export const batchDeleteFiles = (filenames) => {
  return api.delete('/upload/batch', { filenames })
}

// 清理过期文件
export const cleanupFiles = (days = 30) => {
  return api.post('/upload/cleanup', { days })
}