// controllers/notification.js - 修复字段映射问题的通知系统控制器
const { Notification, User, Order, sequelize } = require('../models');
const { success, error, created, notFound, paginated } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

/**
 * 通知系统控制器
 */
class NotificationController {
  /**
   * 获取通知列表
   * GET /api/notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const currentUser = req.session.user;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isRead,
      targetType 
    } = req.query;

    try {
      let whereCondition = {};

      // 根据用户角色确定查看权限
      if (currentUser.role === 'admin') {
        // 管理员可以查看所有通知或指定目标的通知
        if (targetType) {
          whereCondition.targetType = targetType;
          if (targetType === 'user' && !req.query.targetId) {
            // 如果指定查看用户通知但没有指定用户ID，则不显示任何通知
            whereCondition.id = -1;
          }
        }
        // 如果指定了targetId，添加到条件中
        if (req.query.targetId) {
          whereCondition.targetId = req.query.targetId;
        }
      } else {
        // 普通用户只能查看自己的通知
        whereCondition = {
          [Op.or]: [
            { targetType: 'all' },
            { targetType: 'user', targetId: currentUser.id }
          ]
        };
      }

      // 类型筛选
      if (type) {
        whereCondition.type = type;
      }

      // 已读状态筛选
      if (isRead !== undefined) {
        whereCondition.isRead = isRead === 'true';
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Notification.findAndCountAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取通知列表成功');

    } catch (err) {
      console.error('获取通知列表失败:', err);
      return error(res, '获取通知列表失败', 500);
    }
  });

  /**
   * 获取通知详情
   * GET /api/notifications/:id
   */
  getNotificationDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '通知ID不能为空', 400, 'MISSING_NOTIFICATION_ID');
    }

    try {
      const notification = await Notification.findByPk(id);

      if (!notification) {
        return notFound(res, '通知不存在');
      }

      // 权限检查
      if (currentUser.role !== 'admin') {
        // 普通用户只能查看自己的通知
        if (notification.targetType === 'user' && notification.targetId !== currentUser.id) {
          return error(res, '权限不足', 403, 'FORBIDDEN');
        }
        if (notification.targetType === 'admin') {
          return error(res, '权限不足', 403, 'FORBIDDEN');
        }
      }

      // 自动标记为已读
      if (!notification.isRead && 
          (notification.targetType === 'all' || 
           (notification.targetType === 'user' && notification.targetId === currentUser.id))) {
        await notification.update({ isRead: true });
      }

      return success(res, {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        targetType: notification.targetType,
        targetId: notification.targetId,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      }, '获取通知详情成功');

    } catch (err) {
      console.error('获取通知详情失败:', err);
      return error(res, '获取通知详情失败', 500);
    }
  });

  /**
   * 发送通知（管理员）
   * POST /api/notifications
   */
  sendNotification = asyncHandler(async (req, res) => {
    const { title, content, type, targetType, targetId } = req.body;

    // 参数验证
    if (!title || !content || !type || !targetType) {
      return error(res, '标题、内容、类型和目标类型不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const validTypes = ['order', 'payment', 'system'];
    if (!validTypes.includes(type)) {
      return error(res, '通知类型无效', 400, 'INVALID_NOTIFICATION_TYPE');
    }

    const validTargetTypes = ['user', 'admin', 'all'];
    if (!validTargetTypes.includes(targetType)) {
      return error(res, '目标类型无效', 400, 'INVALID_TARGET_TYPE');
    }

    if (targetType === 'user' && !targetId) {
      return error(res, '指定用户时必须提供用户ID', 400, 'MISSING_TARGET_ID');
    }

    try {
      // 如果是发送给特定用户，验证用户是否存在
      if (targetType === 'user') {
        const targetUser = await User.findByPk(targetId);
        if (!targetUser) {
          return error(res, '目标用户不存在', 404, 'TARGET_USER_NOT_FOUND');
        }
      }

      // 创建通知
      const notification = await Notification.create({
        title: title.trim(),
        content: content.trim(),
        type,
        targetType,
        targetId: targetType === 'user' ? targetId : null,
        isRead: false
      });

      console.log('✅ 通知发送成功:', {
        id: notification.id,
        title: notification.title,
        targetType: notification.targetType,
        targetId: notification.targetId
      });

      // 如果是系统通知，可以在这里集成推送服务
      // this.sendPushNotification(notification);

      return created(res, {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        targetType: notification.targetType,
        targetId: notification.targetId,
        createdAt: notification.createdAt,
        sentTo: await this.getNotificationTargetInfo(notification)
      }, '通知发送成功');

    } catch (err) {
      console.error('发送通知失败:', err);
      return error(res, '发送通知失败', 500);
    }
  });

  /**
   * 批量发送通知（管理员）
   * POST /api/notifications/batch
   */
  batchSendNotification = asyncHandler(async (req, res) => {
    const { title, content, type, userIds } = req.body;

    // 参数验证
    if (!title || !content || !type) {
      return error(res, '标题、内容和类型不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return error(res, '用户ID列表不能为空', 400, 'MISSING_USER_IDS');
    }

    if (userIds.length > 100) {
      return error(res, '单次最多发送给100个用户', 400, 'TOO_MANY_USERS');
    }

    try {
      // 验证用户是否都存在
      const existingUsers = await User.findAll({
        where: { id: userIds, role: 'customer' },
        attributes: ['id', 'nickName']
      });

      if (existingUsers.length !== userIds.length) {
        const existingUserIds = existingUsers.map(user => user.id);
        const invalidUserIds = userIds.filter(id => !existingUserIds.includes(id));
        return error(res, `用户ID ${invalidUserIds.join(', ')} 不存在`, 400, 'INVALID_USER_IDS');
      }

      // 批量创建通知
      const notifications = await Promise.all(
        userIds.map(userId => 
          Notification.create({
            title: title.trim(),
            content: content.trim(),
            type,
            targetType: 'user',
            targetId: userId,
            isRead: false
          })
        )
      );

      console.log('✅ 批量通知发送成功:', {
        count: notifications.length,
        title: title,
        userIds
      });

      return created(res, {
        sentCount: notifications.length,
        notifications: notifications.map(notif => ({
          id: notif.id,
          targetId: notif.targetId,
          createdAt: notif.createdAt
        })),
        recipients: existingUsers.map(user => ({
          id: user.id,
          nickName: user.nickName
        }))
      }, `批量发送通知成功，共发送给${notifications.length}个用户`);

    } catch (err) {
      console.error('批量发送通知失败:', err);
      return error(res, '批量发送通知失败', 500);
    }
  });

  /**
   * 标记通知为已读
   * PUT /api/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '通知ID不能为空', 400, 'MISSING_NOTIFICATION_ID');
    }

    try {
      const notification = await Notification.findByPk(id);

      if (!notification) {
        return notFound(res, '通知不存在');
      }

      // 权限检查
      if (currentUser.role !== 'admin') {
        if (notification.targetType === 'user' && notification.targetId !== currentUser.id) {
          return error(res, '只能标记自己的通知', 403, 'FORBIDDEN');
        }
        if (notification.targetType === 'admin') {
          return error(res, '权限不足', 403, 'FORBIDDEN');
        }
      }

      // 更新为已读状态
      await notification.update({ isRead: true });

      return success(res, {
        notificationId: notification.id,
        isRead: true,
        readAt: new Date().toISOString()
      }, '标记已读成功');

    } catch (err) {
      console.error('标记已读失败:', err);
      return error(res, '标记已读失败', 500);
    }
  });

  /**
   * 批量标记已读
   * PUT /api/notifications/read-all
   */
  markAllAsRead = asyncHandler(async (req, res) => {
    const currentUser = req.session.user;
    const { notificationIds } = req.body;

    try {
      let whereCondition = { isRead: false };

      // 根据用户角色设置条件
      if (currentUser.role === 'admin') {
        // 管理员可以标记指定的通知或所有管理员通知
        if (notificationIds && Array.isArray(notificationIds)) {
          whereCondition.id = notificationIds;
        } else {
          whereCondition.targetType = ['admin', 'all'];
        }
      } else {
        // 普通用户只能标记自己的通知
        whereCondition = {
          isRead: false,
          [Op.or]: [
            { targetType: 'all' },
            { targetType: 'user', targetId: currentUser.id }
          ]
        };

        if (notificationIds && Array.isArray(notificationIds)) {
          whereCondition.id = notificationIds;
        }
      }

      const [updatedCount] = await Notification.update(
        { isRead: true },
        { where: whereCondition }
      );

      return success(res, {
        updatedCount,
        markedAt: new Date().toISOString()
      }, `批量标记${updatedCount}条通知为已读`);

    } catch (err) {
      console.error('批量标记已读失败:', err);
      return error(res, '批量标记已读失败', 500);
    }
  });

  /**
   * 删除通知
   * DELETE /api/notifications/:id
   */
  deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '通知ID不能为空', 400, 'MISSING_NOTIFICATION_ID');
    }

    try {
      const notification = await Notification.findByPk(id);

      if (!notification) {
        return notFound(res, '通知不存在');
      }

      // 权限检查
      if (currentUser.role !== 'admin') {
        if (notification.targetType === 'user' && notification.targetId !== currentUser.id) {
          return error(res, '只能删除自己的通知', 403, 'FORBIDDEN');
        }
        if (notification.targetType === 'admin') {
          return error(res, '权限不足', 403, 'FORBIDDEN');
        }
      }

      await notification.destroy();

      return success(res, {
        notificationId: id,
        deletedAt: new Date().toISOString()
      }, '删除通知成功');

    } catch (err) {
      console.error('删除通知失败:', err);
      return error(res, '删除通知失败', 500);
    }
  });

  /**
   * 批量删除通知
   * DELETE /api/notifications/batch
   */
  batchDeleteNotifications = asyncHandler(async (req, res) => {
    const { notificationIds } = req.body;
    const currentUser = req.session.user;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return error(res, '通知ID列表不能为空', 400, 'MISSING_NOTIFICATION_IDS');
    }

    if (notificationIds.length > 50) {
      return error(res, '单次最多删除50条通知', 400, 'TOO_MANY_NOTIFICATIONS');
    }

    try {
      let whereCondition = { id: notificationIds };

      // 普通用户只能删除自己的通知
      if (currentUser.role !== 'admin') {
        whereCondition = {
          id: notificationIds,
          [Op.or]: [
            { targetType: 'all' },
            { targetType: 'user', targetId: currentUser.id }
          ]
        };
      }

      const deletedCount = await Notification.destroy({
        where: whereCondition
      });

      return success(res, {
        deletedCount,
        requestedCount: notificationIds.length,
        deletedAt: new Date().toISOString()
      }, `批量删除${deletedCount}条通知成功`);

    } catch (err) {
      console.error('批量删除通知失败:', err);
      return error(res, '批量删除通知失败', 500);
    }
  });

  /**
   * 获取未读通知数量
   * GET /api/notifications/unread-count
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const currentUser = req.session.user;

    try {
      let whereCondition = { isRead: false };

      // 根据用户角色设置条件
      if (currentUser.role === 'admin') {
        whereCondition.targetType = ['admin', 'all'];
      } else {
        whereCondition = {
          isRead: false,
          [Op.or]: [
            { targetType: 'all' },
            { targetType: 'user', targetId: currentUser.id }
          ]
        };
      }

      const unreadCount = await Notification.count({
        where: whereCondition
      });

      // 按类型统计未读数量
      const unreadByType = await Notification.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereCondition,
        group: ['type'],
        raw: true
      });

      const typeStats = {};
      unreadByType.forEach(item => {
        typeStats[item.type] = parseInt(item.count);
      });

      return success(res, {
        unreadCount,
        byType: typeStats,
        lastChecked: new Date().toISOString()
      }, '获取未读通知数量成功');

    } catch (err) {
      console.error('获取未读通知数量失败:', err);
      return error(res, '获取未读通知数量失败', 500);
    }
  });

  /**
   * 获取通知统计（管理员）- 修复字段映射问题
   * GET /api/notifications/stats
   */
  getNotificationStats = asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;

    try {
      let dateCondition = {};
      const now = new Date();

      switch (period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateCondition = { createdAt: { [Op.gte]: today } };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateCondition = { createdAt: { [Op.gte]: weekAgo } };
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          dateCondition = { createdAt: { [Op.gte]: monthAgo } };
          break;
      }

      const [
        totalNotifications,
        readNotifications,
        unreadNotifications,
        
        // 按类型统计
        typeStats,
        
        // 按目标类型统计
        targetStats,
        
        // 发送趋势 - 使用原生SQL避免字段映射问题
        sendTrend
      ] = await Promise.all([
        Notification.count({ where: dateCondition }),
        
        Notification.count({ 
          where: { ...dateCondition, isRead: true } 
        }),
        
        Notification.count({ 
          where: { ...dateCondition, isRead: false } 
        }),
        
        Notification.findAll({
          attributes: [
            'type',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: dateCondition,
          group: ['type'],
          raw: true
        }),
        
        Notification.findAll({
          attributes: [
            'targetType',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: dateCondition,
          group: ['targetType'],
          raw: true
        }),
        
        // 使用原生SQL查询发送趋势，避免字段映射问题
        sequelize.query(`
          SELECT 
            DATE(created_at) as date, 
            COUNT(id) as count 
          FROM notifications 
          WHERE created_at >= :dateStart
          GROUP BY DATE(created_at) 
          ORDER BY DATE(created_at) ASC
        `, {
          replacements: { 
            dateStart: dateCondition.createdAt?.[Op.gte] || new Date(0)
          },
          type: sequelize.QueryTypes.SELECT
        })
      ]);

      // 处理统计数据
      const typeDistribution = {};
      typeStats.forEach(item => {
        typeDistribution[item.type] = parseInt(item.count);
      });

      const targetDistribution = {};
      targetStats.forEach(item => {
        targetDistribution[item.targetType] = parseInt(item.count);
      });

      return success(res, {
        period,
        summary: {
          totalNotifications,
          readNotifications,
          unreadNotifications,
          readRate: totalNotifications > 0 ? ((readNotifications / totalNotifications) * 100).toFixed(2) : 0
        },
        distribution: {
          byType: typeDistribution,
          byTarget: targetDistribution
        },
        trends: {
          sendTrend: sendTrend.map(item => ({
            date: item.date,
            count: parseInt(item.count)
          }))
        },
        generatedAt: new Date().toISOString()
      }, '获取通知统计成功');

    } catch (err) {
      console.error('获取通知统计失败:', err);
      return error(res, '获取通知统计失败', 500);
    }
  });

  /**
   * 系统自动通知创建（内部方法）
   */
  async createSystemNotification(type, title, content, targetType, targetId = null) {
    try {
      const notification = await Notification.create({
        title,
        content,
        type,
        targetType,
        targetId,
        isRead: false
      });

      console.log('✅ 系统通知创建成功:', {
        id: notification.id,
        type,
        targetType,
        targetId
      });

      return notification;
    } catch (err) {
      console.error('创建系统通知失败:', err);
      throw err;
    }
  }

  /**
   * 订单状态变更通知
   */
  async notifyOrderStatusChange(orderId, oldStatus, newStatus, userId) {
    const statusMessages = {
      'confirmed': '您的订单已确认，正在准备中',
      'cooking': '您的订单正在制作中，请耐心等待',
      'ready': '您的订单已准备完成，请前来取餐',
      'completed': '您的订单已完成，感谢您的光临',
      'cancelled': '您的订单已取消'
    };

    const message = statusMessages[newStatus];
    if (message) {
      return await this.createSystemNotification(
        'order',
        '订单状态更新',
        `订单 ${orderId} ${message}`,
        'user',
        userId
      );
    }
  }

  /**
   * 支付成功通知
   */
  async notifyPaymentSuccess(orderId, amount, userId) {
    return await this.createSystemNotification(
      'payment',
      '支付成功',
      `订单 ${orderId} 支付成功，金额：¥${amount}`,
      'user',
      userId
    );
  }

  // ===== 辅助方法 =====

  /**
   * 获取通知目标信息
   */
  async getNotificationTargetInfo(notification) {
    switch (notification.targetType) {
      case 'all':
        const totalUsers = await User.count({ where: { role: 'customer' } });
        return `所有用户 (${totalUsers}人)`;
      
      case 'user':
        if (notification.targetId) {
          const user = await User.findByPk(notification.targetId);
          return user ? `用户: ${user.nickName}` : '用户已删除';
        }
        return '指定用户';
      
      case 'admin':
        const adminCount = await User.count({ where: { role: 'admin' } });
        return `所有管理员 (${adminCount}人)`;
      
      default:
        return '未知目标';
    }
  }
}

module.exports = new NotificationController();