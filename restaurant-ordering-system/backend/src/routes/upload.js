const express = require('express');
const router = express.Router();

// 图片上传
router.post('/image', (req, res) => {
  res.json({
    success: true,
    message: '图片上传功能开发中',
    data: {
      filename: 'dish_20241201_001.jpg',
      originalName: 'gongbao_chicken.jpg',
      url: '/uploads/images/dish_20241201_001.jpg',
      size: 245760,
      uploadedAt: new Date().toISOString()
    }
  });
});

// 多图片上传
router.post('/images', (req, res) => {
  res.json({
    success: true,
    message: '多图片上传功能开发中',
    data: {
      files: [
        {
          filename: 'dish_20241201_001.jpg',
          url: '/uploads/images/dish_20241201_001.jpg',
          size: 245760
        },
        {
          filename: 'dish_20241201_002.jpg',
          url: '/uploads/images/dish_20241201_002.jpg',
          size: 198432
        }
      ],
      uploadedCount: 2,
      uploadedAt: new Date().toISOString()
    }
  });
});

// 删除文件
router.delete('/:filename', (req, res) => {
  res.json({
    success: true,
    message: '删除文件功能开发中',
    data: { filename: req.params.filename }
  });
});

// 获取文件信息
router.get('/info/:filename', (req, res) => {
  res.json({
    success: true,
    message: '获取文件信息功能开发中',
    data: {
      filename: req.params.filename,
      size: 245760,
      uploadedAt: '2024-12-01T10:30:00.000Z',
      url: `/uploads/images/${req.params.filename}`
    }
  });
});

// 获取上传文件列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '获取上传文件列表功能开发中',
    data: [
      {
        filename: 'dish_20241201_001.jpg',
        originalName: 'gongbao_chicken.jpg',
        size: 245760,
        uploadedAt: '2024-12-01T10:30:00.000Z'
      },
      {
        filename: 'dish_20241201_002.jpg',
        originalName: 'mapo_tofu.jpg',
        size: 198432,
        uploadedAt: '2024-12-01T11:15:00.000Z'
      }
    ]
  });
});

module.exports = router;