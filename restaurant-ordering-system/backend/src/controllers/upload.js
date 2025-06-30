// controllers/upload.js - 文件上传控制器
const { success, error, created, notFound } = require('../utils/response');
const { asyncHandler } = require('../middleware/error');
const { deleteFile, fileExists, getFileInfo } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

class UploadController {
  /**
   * 单图片上传
   */
  uploadSingleImage = asyncHandler(async (req, res) => {
    if (!req.uploadedFile) {
      return error(res, '请选择要上传的图片', 400, 'NO_FILE_UPLOADED');
    }

    const fileInfo = req.uploadedFile;
    
    try {
      // 可以在这里添加额外的处理逻辑
      // 比如图片压缩、尺寸调整等
      
      return created(res, {
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        url: fileInfo.url,
        uploadedAt: new Date().toISOString()
      }, '图片上传成功');

    } catch (err) {
      // 上传失败时清理文件
      await deleteFile(fileInfo.filename).catch(console.error);
      console.error('图片上传处理失败:', err);
      return error(res, '图片上传处理失败', 500);
    }
  });

  /**
   * 多图片上传
   */
  uploadMultipleImages = asyncHandler(async (req, res) => {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      return error(res, '请选择要上传的图片', 400, 'NO_FILES_UPLOADED');
    }

    const uploadedFiles = req.uploadedFiles;
    
    try {
      const fileResults = uploadedFiles.map(file => ({
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        url: file.url
      }));

      return created(res, {
        files: fileResults,
        uploadedCount: fileResults.length,
        totalSize: uploadedFiles.reduce((total, file) => total + file.size, 0),
        uploadedAt: new Date().toISOString()
      }, `成功上传${fileResults.length}张图片`);

    } catch (err) {
      // 上传失败时清理所有文件
      for (const file of uploadedFiles) {
        await deleteFile(file.filename).catch(console.error);
      }
      console.error('多图片上传处理失败:', err);
      return error(res, '图片上传处理失败', 500);
    }
  });

  /**
   * 删除文件
   */
  deleteUploadedFile = asyncHandler(async (req, res) => {
    const { filename } = req.params;

    if (!filename) {
      return error(res, '文件名不能为空', 400, 'MISSING_FILENAME');
    }

    // 安全检查：确保文件名不包含路径分隔符
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return error(res, '文件名格式不正确', 400, 'INVALID_FILENAME');
    }

    try {
      // 检查文件是否存在
      if (!fileExists(filename)) {
        return notFound(res, '文件不存在');
      }

      // 删除文件
      await deleteFile(filename);

      return success(res, { filename }, '文件删除成功');

    } catch (err) {
      console.error('删除文件失败:', err);
      return error(res, '删除文件失败', 500);
    }
  });

  /**
   * 获取文件信息
   */
  getFileInfo = asyncHandler(async (req, res) => {
    const { filename } = req.params;

    if (!filename) {
      return error(res, '文件名不能为空', 400, 'MISSING_FILENAME');
    }

    // 安全检查
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return error(res, '文件名格式不正确', 400, 'INVALID_FILENAME');
    }

    try {
      // 检查文件是否存在
      if (!fileExists(filename)) {
        return notFound(res, '文件不存在');
      }

      // 获取文件信息
      const fileInfo = await getFileInfo(filename);

      return success(res, fileInfo, '获取文件信息成功');

    } catch (err) {
      console.error('获取文件信息失败:', err);
      return error(res, '获取文件信息失败', 500);
    }
  });

  /**
   * 获取上传文件列表
   */
  getUploadedFilesList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;

    try {
      const uploadDir = path.join(__dirname, '../uploads/images');
      
      // 读取上传目录
      const files = await fs.readdir(uploadDir);
      
      // 过滤和搜索
      let filteredFiles = files.filter(file => {
        // 只返回图片文件
        const ext = path.extname(file).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExts.includes(ext);
      });

      // 搜索过滤
      if (search) {
        filteredFiles = filteredFiles.filter(file => 
          file.toLowerCase().includes(search.toLowerCase())
        );
      }

      // 分页计算
      const total = filteredFiles.length;
      const offset = (page - 1) * limit;
      const paginatedFiles = filteredFiles.slice(offset, offset + parseInt(limit));

      // 获取文件详细信息
      const fileInfoPromises = paginatedFiles.map(async (filename) => {
        try {
          return await getFileInfo(filename);
        } catch (err) {
          console.error(`获取文件 ${filename} 信息失败:`, err);
          return {
            filename,
            size: 0,
            createdAt: null,
            modifiedAt: null,
            url: `/uploads/images/${filename}`
          };
        }
      });

      const fileInfos = await Promise.all(fileInfoPromises);

      // 按修改时间排序（最新的在前）
      fileInfos.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

      return success(res, {
        files: fileInfos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }, '获取文件列表成功');

    } catch (err) {
      console.error('获取文件列表失败:', err);
      return error(res, '获取文件列表失败', 500);
    }
  });

  /**
   * 批量删除文件
   */
  batchDeleteFiles = asyncHandler(async (req, res) => {
    const { filenames } = req.body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return error(res, '文件名列表不能为空', 400, 'MISSING_FILENAMES');
    }

    if (filenames.length > 50) {
      return error(res, '单次最多删除50个文件', 400, 'TOO_MANY_FILES');
    }

    const results = {
      success: [],
      failed: [],
      notFound: []
    };

    try {
      for (const filename of filenames) {
        // 安全检查
        if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
          results.failed.push({ filename, error: '文件名格式不正确' });
          continue;
        }

        try {
          if (!fileExists(filename)) {
            results.notFound.push(filename);
            continue;
          }

          await deleteFile(filename);
          results.success.push(filename);

        } catch (err) {
          results.failed.push({ filename, error: err.message });
        }
      }

      return success(res, {
        results,
        summary: {
          total: filenames.length,
          success: results.success.length,
          failed: results.failed.length,
          notFound: results.notFound.length
        }
      }, `批量删除完成：成功${results.success.length}个，失败${results.failed.length}个`);

    } catch (err) {
      console.error('批量删除文件失败:', err);
      return error(res, '批量删除文件失败', 500);
    }
  });

  /**
   * 获取上传统计信息
   */
  getUploadStats = asyncHandler(async (req, res) => {
    try {
      const uploadDir = path.join(__dirname, '../uploads/images');
      
      // 读取上传目录
      const files = await fs.readdir(uploadDir);
      
      let totalSize = 0;
      let fileCount = 0;
      const fileTypes = {};

      for (const filename of files) {
        try {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            fileCount++;
            totalSize += stats.size;
            
            const ext = path.extname(filename).toLowerCase();
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          }
        } catch (err) {
          console.error(`获取文件 ${filename} 统计失败:`, err);
        }
      }

      return success(res, {
        totalFiles: fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        fileTypes,
        uploadPath: '/uploads/images',
        lastUpdated: new Date().toISOString()
      }, '获取上传统计成功');

    } catch (err) {
      console.error('获取上传统计失败:', err);
      return error(res, '获取上传统计失败', 500);
    }
  });

  /**
   * 清理过期文件（可选功能）
   */
  cleanupOldFiles = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query; // 默认清理30天前的文件

    try {
      const uploadDir = path.join(__dirname, '../uploads/images');
      const files = await fs.readdir(uploadDir);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

      const results = {
        deleted: [],
        errors: []
      };

      for (const filename of files) {
        try {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && stats.mtime < cutoffDate) {
            await deleteFile(filename);
            results.deleted.push({
              filename,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        } catch (err) {
          results.errors.push({
            filename,
            error: err.message
          });
        }
      }

      return success(res, {
        cleanupDate: cutoffDate.toISOString(),
        results,
        summary: {
          deletedCount: results.deleted.length,
          errorCount: results.errors.length,
          totalSizeFreed: results.deleted.reduce((total, file) => total + file.size, 0)
        }
      }, `清理完成：删除${results.deleted.length}个过期文件`);

    } catch (err) {
      console.error('清理过期文件失败:', err);
      return error(res, '清理过期文件失败', 500);
    }
  });
}

module.exports = new UploadController();