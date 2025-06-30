// middleware/upload.js - 文件上传中间件
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { error } = require('../utils/response');

/**
 * 确保上传目录存在
 */
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * 生成文件名
 */
const generateFileName = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const name = uuidv4();
  return `${name}${ext}`;
};

/**
 * 文件过滤器
 */
const fileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传 JPEG、PNG、WebP、GIF 格式的图片'), false);
  }
};

/**
 * 存储配置
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/images');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  }
});

/**
 * Multer配置
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
    files: 5 // 最多5个文件
  },
  fileFilter: fileFilter
});

/**
 * 单图片上传中间件
 */
const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return error(res, '文件大小不能超过5MB', 400, 'FILE_TOO_LARGE');
            case 'LIMIT_FILE_COUNT':
              return error(res, '文件数量超出限制', 400, 'TOO_MANY_FILES');
            case 'LIMIT_UNEXPECTED_FILE':
              return error(res, `字段名应为 ${fieldName}`, 400, 'INVALID_FIELD_NAME');
            default:
              return error(res, '文件上传失败', 400, 'UPLOAD_ERROR');
          }
        } else {
          return error(res, err.message, 400, 'UPLOAD_ERROR');
        }
      }
      next();
    });
  };
};

/**
 * 多图片上传中间件
 */
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return error(res, '文件大小不能超过5MB', 400, 'FILE_TOO_LARGE');
            case 'LIMIT_FILE_COUNT':
              return error(res, `最多只能上传${maxCount}个文件`, 400, 'TOO_MANY_FILES');
            case 'LIMIT_UNEXPECTED_FILE':
              return error(res, `字段名应为 ${fieldName}`, 400, 'INVALID_FIELD_NAME');
            default:
              return error(res, '文件上传失败', 400, 'UPLOAD_ERROR');
          }
        } else {
          return error(res, err.message, 400, 'UPLOAD_ERROR');
        }
      }
      next();
    });
  };
};

/**
 * 文件信息处理中间件
 */
const processUploadedFile = (req, res, next) => {
  if (req.file) {
    // 单文件上传
    req.uploadedFile = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/images/${req.file.filename}`
    };
  }
  
  if (req.files && req.files.length > 0) {
    // 多文件上传
    req.uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/images/${file.filename}`
    }));
  }
  
  next();
};

/**
 * 删除文件
 */
const deleteFile = (filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../uploads/images', filename);
    
    fs.unlink(filePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // 文件不存在，认为删除成功
          resolve();
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
};

/**
 * 验证文件是否存在
 */
const fileExists = (filename) => {
  const filePath = path.join(__dirname, '../uploads/images', filename);
  return fs.existsSync(filePath);
};

/**
 * 获取文件信息
 */
const getFileInfo = (filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../uploads/images', filename);
    
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          url: `/uploads/images/${filename}`
        });
      }
    });
  });
};

/**
 * 清理临时文件（错误处理）
 */
const cleanupTempFiles = (req, res, next) => {
  res.on('finish', () => {
    // 如果响应不成功，清理上传的文件
    if (res.statusCode >= 400) {
      if (req.file) {
        deleteFile(req.file.filename).catch(console.error);
      }
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          deleteFile(file.filename).catch(console.error);
        });
      }
    }
  });
  
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  processUploadedFile,
  cleanupTempFiles,
  deleteFile,
  fileExists,
  getFileInfo,
  ensureUploadDir
};