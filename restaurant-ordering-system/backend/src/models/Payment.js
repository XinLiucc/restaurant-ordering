module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentNo: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      field: 'payment_no', // 映射到数据库的实际字段名
      comment: '支付号'
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id', // 映射到数据库的实际字段名
      comment: '订单ID'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '支付金额'
    },
    paymentMethod: {
      type: DataTypes.ENUM('wechat', 'alipay', 'cash'),
      defaultValue: 'wechat',
      field: 'payment_method', // 映射到数据库的实际字段名
      comment: '支付方式'
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
      defaultValue: 'pending',
      comment: '支付状态'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transaction_id', // 映射到数据库的实际字段名
      comment: '第三方交易号'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at', // 映射到数据库的实际字段名
      comment: '支付时间'
    }
  }, {
    tableName: 'payments',
    underscored: true,  // 自动转换为下划线命名
    indexes: [
      { unique: true, fields: ['payment_no'] },
      { fields: ['order_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });
  return Payment;
};