const express = require('express');
const router = express.Router();

// 获取通知列表
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '获取通知列表功能开发中',
    data: [
      {
        id: 1,
        title: '新订单通知',
        content: '您有一个新的订单待处理',
        type: 'order',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: '支付成功通知',
        content: '订单支付已完成',
        type: 'payment',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  });
});

// 发送通知（管理员）
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: '发送通知功能开发中',
    data: { 
      notificationId: 1,
      sentTo: 'all',
      sentAt: new Date().toISOString()
    }
  });
});

// 标记已读
router.put('/:id/read', (req, res) => {
  res.json({
    success: true,
    message: '标记已读功能开发中',
    data: { notificationId: req.params.id }
  });
});

// 批量标记已读
router.put('/read-all', (req, res) => {
  res.json({
    success: true,
    message: '批量标记已读功能开发中',
    data: { updatedCount: 5 }
  });
});

// 删除通知
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: '删除通知功能开发中',
    data: { notificationId: req.params.id }
  });
});

// 获取未读通知数量
router.get('/unread-count', (req, res) => {
  res.json({
    success: true,
    message: '获取未读通知数量功能开发中',
    data: { unreadCount: 3 }
  });
});

// 获取通知详情
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: '获取通知详情功能开发中',
    data: {
      id: req.params.id,
      title: '订单状态更新',
      content: '您的订单已开始制作',
      type: 'order',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;