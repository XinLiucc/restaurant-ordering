// routes/upload.js - 完整的文件上传路由
const express = require('express');
const UploadController = require('../controllers/upload');
const { auth } = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  processUploadedFile, 
  cleanupTempFiles 
} = require('../middleware/upload');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// 创建路由实例
const router = express.Router();

// 批量删除验证模式
const batchDeleteSchema = Joi.object({
  filenames: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.base': '文件名列表必须是数组',
      'array.min': '至少选择一个文件',
      'array.max': '单次最多删除50个文件',
      'any.required': '文件名列表是必填项'
    })
});

// 清理文件验证模式
const cleanupQuerySchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.base': '天数必须是数字',
      'number.integer': '天数必须是整数',
      'number.min': '天数至少为1',
      'number.max': '天数不能超过365'
    })
});

// 文件列表查询验证模式
const fileListQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional()
});

/**
 * 单图片上传（需要管理员权限）
 * POST /api/upload/image
 * Content-Type: multipart/form-data
 * Field: image
 */
router.post('/image',
  auth.requireAdmin,
  cleanupTempFiles,
  uploadSingle('image'),
  processUploadedFile,
  UploadController.uploadSingleImage
);

/**
 * 多图片上传（需要管理员权限）
 * POST /api/upload/images
 * Content-Type: multipart/form-data
 * Field: images (multiple files)
 */
router.post('/images',
  auth.requireAdmin,
  cleanupTempFiles,
  uploadMultiple('images', 5), // 最多5个文件
  processUploadedFile,
  UploadController.uploadMultipleImages
);

/**
 * 获取文件信息
 * GET /api/upload/info/:filename
 */
router.get('/info/:filename',
  auth.requireAdmin,
  UploadController.getFileInfo
);

/**
 * 获取上传文件列表（支持分页和搜索）
 * GET /api/upload/files
 * Query: page, limit, search
 */
router.get('/files',
  auth.requireAdmin,
  validate(fileListQuerySchema, 'query'),
  UploadController.getUploadedFilesList
);

/**
 * 删除单个文件（需要管理员权限）
 * DELETE /api/upload/:filename
 */
router.delete('/:filename',
  auth.requireAdmin,
  UploadController.deleteUploadedFile
);

/**
 * 批量删除文件（需要管理员权限）
 * DELETE /api/upload/batch
 * Body: { filenames: string[] }
 */
router.delete('/batch',
  auth.requireAdmin,
  validate(batchDeleteSchema),
  UploadController.batchDeleteFiles
);

/**
 * 获取上传统计信息（需要管理员权限）
 * GET /api/upload/stats
 */
router.get('/stats',
  auth.requireAdmin,
  UploadController.getUploadStats
);

/**
 * 清理过期文件（需要管理员权限）
 * POST /api/upload/cleanup
 * Query: days (default: 30)
 */
router.post('/cleanup',
  auth.requireAdmin,
  validate(cleanupQuerySchema, 'query'),
  UploadController.cleanupOldFiles
);

module.exports = router;