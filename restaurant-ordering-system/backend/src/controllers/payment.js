// controllers/payment.js - 支付系统控制器
const { Payment, Order, OrderItem, User, Dish, sequelize } = require('../models');
const { success, error, created, notFound, paginated } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * 支付系统控制器
 */
class PaymentController {
  /**
   * 生成支付订单号
   */
  generatePaymentNo() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-8);
    return `PAY${year}${month}${day}${timestamp}`;
  }

  /**
   * 创建支付订单
   * POST /api/payments/create
   */
  createPayment = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { orderId, paymentMethod = 'wechat' } = req.body;

    if (!userId) {
      return error(res, '请先登录', 401, 'UNAUTHORIZED');
    }

    if (!orderId) {
      return error(res, '订单ID不能为空', 400, 'MISSING_ORDER_ID');
    }

    const validMethods = ['wechat', 'alipay', 'cash'];
    if (!validMethods.includes(paymentMethod)) {
      return error(res, '支付方式无效', 400, 'INVALID_PAYMENT_METHOD');
    }

    const transaction = await sequelize.transaction();

    try {
      // 验证订单
      const order = await Order.findByPk(orderId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nickName']
        }],
        transaction
      });

      if (!order) {
        await transaction.rollback();
        return notFound(res, '订单不存在');
      }

      // 权限检查：只能为自己的订单创建支付或管理员
      if (req.session.user.role !== 'admin' && order.userId !== userId) {
        await transaction.rollback();
        return error(res, '只能为自己的订单创建支付', 403, 'FORBIDDEN');
      }

      // 订单状态检查
      if (!['pending', 'confirmed'].includes(order.status)) {
        await transaction.rollback();
        return error(res, '该订单状态下无法支付', 400, 'ORDER_STATUS_INVALID');
      }

      // 检查是否已有待支付的支付记录
      const existingPayment = await Payment.findOne({
        where: {
          orderId: orderId,
          status: 'pending'
        },
        transaction
      });

      if (existingPayment) {
        await transaction.rollback();
        return error(res, '该订单已有待支付记录', 400, 'PAYMENT_EXISTS');
      }

      // 创建支付记录
      const paymentNo = this.generatePaymentNo();
      const payment = await Payment.create({
        paymentNo,
        orderId: order.id,
        amount: order.totalAmount,
        paymentMethod,
        status: 'pending'
      }, { transaction });

      await transaction.commit();

      // 模拟支付接口调用（开发环境）
      let paymentData = {
        id: payment.id,
        paymentNo: payment.paymentNo,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        orderId: payment.orderId,
        orderNo: order.orderNo,
        createdAt: payment.createdAt
      };

      // 如果是现金支付，直接标记为成功（餐厅场景）
      if (paymentMethod === 'cash') {
        await this.processPaymentSuccess(payment.id, null, 'CASH_' + Date.now());
        paymentData.status = 'success';
        paymentData.paidAt = new Date().toISOString();
        paymentData.message = '现金支付已确认';
      } else {
        // 微信/支付宝支付返回支付参数（模拟）
        paymentData.paymentParams = this.generateMockPaymentParams(paymentMethod, payment);
        paymentData.message = '支付订单创建成功，请完成支付';
      }

      console.log('✅ 支付订单创建成功:', {
        paymentNo: payment.paymentNo,
        orderId: order.id,
        amount: payment.amount,
        method: paymentMethod
      });

      return created(res, paymentData, '创建支付订单成功');

    } catch (err) {
      await transaction.rollback();
      console.error('创建支付订单失败:', err);
      
      if (err.name === 'SequelizeUniqueConstraintError') {
        return error(res, '支付订单号重复，请重试', 500, 'DUPLICATE_PAYMENT_NO');
      }
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '创建支付订单失败', 500);
    }
  });

  /**
   * 生成模拟支付参数
   */
  generateMockPaymentParams(paymentMethod, payment) {
    const baseParams = {
      paymentNo: payment.paymentNo,
      amount: payment.amount,
      timestamp: Date.now(),
      nonceStr: uuidv4().replace(/-/g, '').substring(0, 16)
    };

    if (paymentMethod === 'wechat') {
      return {
        ...baseParams,
        appId: process.env.WECHAT_APP_ID || 'mock_app_id',
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        package: `prepay_id=mock_prepay_${payment.id}_${Date.now()}`,
        signType: 'MD5',
        paySign: 'mock_sign_' + Math.random().toString(36).substring(7)
      };
    } else if (paymentMethod === 'alipay') {
      return {
        ...baseParams,
        orderInfo: `app_id=mock_alipay&biz_content={"out_trade_no":"${payment.paymentNo}","total_amount":"${payment.amount}","subject":"餐厅订单支付"}`,
        sign: 'mock_alipay_sign_' + Math.random().toString(36).substring(7)
      };
    }

    return baseParams;
  }

  /**
   * 模拟支付成功（开发测试用）
   * POST /api/payments/:id/mock-success
   */
  mockPaymentSuccess = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return error(res, '生产环境不支持模拟支付', 403, 'MOCK_NOT_ALLOWED');
    }

    const { id } = req.params;
    const { transactionId } = req.body;

    if (!id) {
      return error(res, '支付ID不能为空', 400, 'MISSING_PAYMENT_ID');
    }

    try {
      const mockTransactionId = transactionId || `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const result = await this.processPaymentSuccess(id, null, mockTransactionId);

      return success(res, result, '模拟支付成功');

    } catch (err) {
      console.error('模拟支付失败:', err);
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '模拟支付失败', 500);
    }
  });

  /**
   * 模拟支付失败（开发测试用）
   * POST /api/payments/:id/mock-fail
   */
  mockPaymentFail = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return error(res, '生产环境不支持模拟支付', 403, 'MOCK_NOT_ALLOWED');
    }

    const { id } = req.params;
    const { reason = '用户取消支付' } = req.body;

    if (!id) {
      return error(res, '支付ID不能为空', 400, 'MISSING_PAYMENT_ID');
    }

    try {
      const result = await this.processPaymentFailure(id, reason);

      return success(res, result, '模拟支付失败');

    } catch (err) {
      console.error('模拟支付失败处理失败:', err);
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '模拟支付失败处理失败', 500);
    }
  });

  /**
   * 支付回调通知处理
   * POST /api/payments/notify
   */
  handlePaymentNotify = asyncHandler(async (req, res) => {
    const { paymentNo, status, transactionId, amount } = req.body;

    console.log('收到支付回调通知:', req.body);

    if (!paymentNo || !status) {
      return error(res, '回调参数不完整', 400, 'INVALID_NOTIFY_PARAMS');
    }

    try {
      const payment = await Payment.findOne({
        where: { paymentNo },
        include: [{
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNo', 'userId', 'totalAmount', 'status']
        }]
      });

      if (!payment) {
        console.error('支付记录不存在:', paymentNo);
        return error(res, '支付记录不存在', 404, 'PAYMENT_NOT_FOUND');
      }

      if (payment.status !== 'pending') {
        console.log('支付状态已处理:', payment.status);
        return success(res, { status: payment.status }, '支付状态已处理');
      }

      // 验证金额（如果提供）
      if (amount && parseFloat(amount) !== parseFloat(payment.amount)) {
        console.error('支付金额不匹配:', { expected: payment.amount, received: amount });
        return error(res, '支付金额不匹配', 400, 'AMOUNT_MISMATCH');
      }

      let result;
      if (status === 'success' || status === 'SUCCESS') {
        result = await this.processPaymentSuccess(payment.id, payment, transactionId);
      } else {
        result = await this.processPaymentFailure(payment.id, '支付失败');
      }

      // 返回成功响应（支付平台要求）
      return success(res, result, '回调处理成功');

    } catch (err) {
      console.error('处理支付回调失败:', err);
      return error(res, '处理支付回调失败', 500);
    }
  });

  /**
   * 处理支付成功逻辑
   */
  async processPaymentSuccess(paymentId, paymentRecord = null, transactionId) {
    const transaction = await sequelize.transaction();

    try {
      // 获取支付记录
      let payment = paymentRecord;
      if (!payment) {
        payment = await Payment.findByPk(paymentId, {
          include: [{
            model: Order,
            as: 'order'
          }],
          transaction
        });
      }

      if (!payment) {
        await transaction.rollback();
        throw new CustomError('支付记录不存在', 404, 'PAYMENT_NOT_FOUND');
      }

      if (payment.status === 'success') {
        await transaction.rollback();
        throw new CustomError('支付已成功，请勿重复处理', 400, 'PAYMENT_ALREADY_SUCCESS');
      }

      if (payment.status !== 'pending') {
        await transaction.rollback();
        throw new CustomError('支付状态异常', 400, 'INVALID_PAYMENT_STATUS');
      }

      // 更新支付状态
      await payment.update({
        status: 'success',
        transactionId: transactionId || `AUTO_${Date.now()}`,
        paidAt: new Date()
      }, { transaction });

      // 更新订单状态为已确认
      if (payment.order && payment.order.status === 'pending') {
        await payment.order.update({
          status: 'confirmed'
        }, { transaction });
      }

      await transaction.commit();

      console.log('✅ 支付成功处理完成:', {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        orderId: payment.orderId,
        amount: payment.amount,
        transactionId: payment.transactionId
      });

      return {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        status: 'success',
        paidAt: payment.paidAt,
        transactionId: payment.transactionId,
        order: {
          id: payment.order?.id,
          orderNo: payment.order?.orderNo,
          status: payment.order?.status
        }
      };

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * 处理支付失败逻辑
   */
  async processPaymentFailure(paymentId, reason = '支付失败') {
    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [{
          model: Order,
          as: 'order'
        }],
        transaction
      });

      if (!payment) {
        await transaction.rollback();
        throw new CustomError('支付记录不存在', 404, 'PAYMENT_NOT_FOUND');
      }

      if (payment.status !== 'pending') {
        await transaction.rollback();
        throw new CustomError('支付状态异常', 400, 'INVALID_PAYMENT_STATUS');
      }

      // 更新支付状态
      await payment.update({
        status: 'failed'
      }, { transaction });

      await transaction.commit();

      console.log('❌ 支付失败处理完成:', {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        reason
      });

      return {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        status: 'failed',
        reason,
        order: {
          id: payment.order?.id,
          orderNo: payment.order?.orderNo,
          status: payment.order?.status
        }
      };

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * 查询支付状态
   * GET /api/payments/:id
   */
  getPaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    if (!id) {
      return error(res, '支付ID不能为空', 400, 'MISSING_PAYMENT_ID');
    }

    try {
      const payment = await Payment.findByPk(id, {
        include: [{
          model: Order,
          as: 'order',
          attributes: ['id', 'orderNo', 'userId', 'status', 'totalAmount'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nickName']
          }]
        }]
      });

      if (!payment) {
        return notFound(res, '支付记录不存在');
      }

      // 权限检查
      if (currentUser.role !== 'admin' && payment.order.userId !== currentUser.id) {
        return error(res, '只能查看自己的支付记录', 403, 'FORBIDDEN');
      }

      return success(res, {
        id: payment.id,
        paymentNo: payment.paymentNo,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        order: {
          id: payment.order.id,
          orderNo: payment.order.orderNo,
          status: payment.order.status,
          totalAmount: payment.order.totalAmount,
          user: payment.order.user
        }
      }, '获取支付状态成功');

    } catch (err) {
      console.error('查询支付状态失败:', err);
      return error(res, '查询支付状态失败', 500);
    }
  });

  /**
   * 根据订单号查询支付状态
   * GET /api/payments/order/:orderNo
   */
  getPaymentByOrderNo = asyncHandler(async (req, res) => {
    const { orderNo } = req.params;
    const currentUser = req.session.user;

    if (!orderNo) {
      return error(res, '订单号不能为空', 400, 'MISSING_ORDER_NO');
    }

    try {
      const payment = await Payment.findOne({
        include: [{
          model: Order,
          as: 'order',
          where: { orderNo },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'nickName']
          }]
        }],
        order: [['createdAt', 'DESC']] // 获取最新的支付记录
      });

      if (!payment) {
        return notFound(res, '该订单暂无支付记录');
      }

      // 权限检查
      if (currentUser.role !== 'admin' && payment.order.userId !== currentUser.id) {
        return error(res, '只能查看自己的支付记录', 403, 'FORBIDDEN');
      }

      return success(res, {
        id: payment.id,
        paymentNo: payment.paymentNo,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        order: {
          id: payment.order.id,
          orderNo: payment.order.orderNo,
          status: payment.order.status,
          totalAmount: payment.order.totalAmount
        }
      }, '获取支付状态成功');

    } catch (err) {
      console.error('查询支付状态失败:', err);
      return error(res, '查询支付状态失败', 500);
    }
  });

  /**
   * 获取支付记录列表（管理员）
   * GET /api/payments
   */
  getPaymentList = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentMethod,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    try {
      const whereCondition = {};
      
      // 状态筛选
      if (status) {
        whereCondition.status = status;
      }

      // 支付方式筛选
      if (paymentMethod) {
        whereCondition.paymentMethod = paymentMethod;
      }

      // 日期范围筛选
      if (startDate || endDate) {
        whereCondition.createdAt = {};
        if (startDate) {
          whereCondition.createdAt[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          whereCondition.createdAt[Op.lte] = end;
        }
      }

      // 搜索条件
      const include = [{
        model: Order,
        as: 'order',
        attributes: ['id', 'orderNo', 'userId', 'status', 'totalAmount'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nickName', 'phone']
        }]
      }];

      if (search) {
        whereCondition[Op.or] = [
          { paymentNo: { [Op.like]: `%${search}%` } },
          { transactionId: { [Op.like]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      // 构建排序条件
      let orderCondition = [['createdAt', 'DESC']];
      if (sortBy === 'amount') {
        orderCondition = [['amount', sortOrder.toUpperCase()]];
      } else if (sortBy === 'status') {
        orderCondition = [['status', sortOrder.toUpperCase()]];
      } else if (sortBy === 'paidAt') {
        orderCondition = [['paidAt', sortOrder.toUpperCase()]];
      }

      const { count, rows } = await Payment.findAndCountAll({
        where: whereCondition,
        include,
        order: orderCondition,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return paginated(res, rows, {
        page,
        limit,
        total: count
      }, '获取支付记录成功');

    } catch (err) {
      console.error('获取支付记录失败:', err);
      return error(res, '获取支付记录失败', 500);
    }
  });

  /**
   * 申请退款（管理员）
   * POST /api/payments/:id/refund
   */
  refundPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason = '用户申请退款' } = req.body;

    if (!id) {
      return error(res, '支付ID不能为空', 400, 'MISSING_PAYMENT_ID');
    }

    const transaction = await sequelize.transaction();

    try {
      const payment = await Payment.findByPk(id, {
        include: [{
          model: Order,
          as: 'order'
        }],
        transaction
      });

      if (!payment) {
        await transaction.rollback();
        return notFound(res, '支付记录不存在');
      }

      if (payment.status !== 'success') {
        await transaction.rollback();
        return error(res, '只有支付成功的订单才能退款', 400, 'INVALID_PAYMENT_STATUS');
      }

      // 检查订单状态
      if (['completed'].includes(payment.order.status)) {
        await transaction.rollback();
        return error(res, '该订单状态下不能退款', 400, 'ORDER_CANNOT_REFUND');
      }

      // 更新支付状态为已退款
      await payment.update({
        status: 'refunded'
      }, { transaction });

      // 更新订单状态为已取消
      await payment.order.update({
        status: 'cancelled'
      }, { transaction });

      await transaction.commit();

      console.log('✅ 退款处理成功:', {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        amount: payment.amount,
        reason
      });

      return success(res, {
        paymentId: payment.id,
        paymentNo: payment.paymentNo,
        refundAmount: payment.amount,
        refundTime: new Date().toISOString(),
        reason,
        order: {
          id: payment.order.id,
          orderNo: payment.order.orderNo,
          status: payment.order.status
        }
      }, '退款处理成功');

    } catch (err) {
      await transaction.rollback();
      console.error('退款处理失败:', err);
      return error(res, '退款处理失败', 500);
    }
  });

  /**
   * 获取支付统计（管理员）
   * GET /api/payments/stats
   */
  getPaymentStats = asyncHandler(async (req, res) => {
    const { period = 'today' } = req.query;

    try {
      let dateCondition = {};
      const now = new Date();

      switch (period) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateCondition = {
            createdAt: {
              [Op.gte]: today
            }
          };
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          dateCondition = {
            createdAt: {
              [Op.gte]: weekAgo
            }
          };
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          dateCondition = {
            createdAt: {
              [Op.gte]: monthAgo
            }
          };
          break;
      }

      // 获取统计数据
      const [
        totalPayments,
        successPayments,
        failedPayments,
        refundedPayments,
        totalAmount,
        refundAmount
      ] = await Promise.all([
        Payment.count({ where: dateCondition }),
        Payment.count({ where: { ...dateCondition, status: 'success' } }),
        Payment.count({ where: { ...dateCondition, status: 'failed' } }),
        Payment.count({ where: { ...dateCondition, status: 'refunded' } }),
        Payment.sum('amount', { where: { ...dateCondition, status: 'success' } }),
        Payment.sum('amount', { where: { ...dateCondition, status: 'refunded' } })
      ]);

      // 支付方式统计
      const paymentMethodStats = await Payment.findAll({
        where: { ...dateCondition, status: 'success' },
        attributes: [
          'paymentMethod',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
        ],
        group: ['paymentMethod'],
        raw: true
      });

      // 支付状态统计
      const statusStats = await Payment.findAll({
        where: dateCondition,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      return success(res, {
        period,
        summary: {
          totalPayments,
          successPayments,
          failedPayments,
          refundedPayments,
          totalAmount: totalAmount || 0,
          refundAmount: refundAmount || 0,
          netAmount: (totalAmount || 0) - (refundAmount || 0),
          successRate: totalPayments > 0 ? ((successPayments / totalPayments) * 100).toFixed(2) : 0
        },
        paymentMethodStats: paymentMethodStats.reduce((acc, stat) => {
          acc[stat.paymentMethod] = {
            count: parseInt(stat.count),
            amount: parseFloat(stat.amount) || 0
          };
          return acc;
        }, {}),
        statusStats: statusStats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        generatedAt: new Date().toISOString()
      }, '获取支付统计成功');

    } catch (err) {
      console.error('获取支付统计失败:', err);
      return error(res, '获取支付统计失败', 500);
    }
  });
}

module.exports = new PaymentController();