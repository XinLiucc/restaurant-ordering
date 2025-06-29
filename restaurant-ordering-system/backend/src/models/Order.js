module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNo: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      field: 'order_no', // 映射到数据库的实际字段名
      comment: '订单号'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id', // 映射到数据库的实际字段名
      comment: '用户ID'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount', // 映射到数据库的实际字段名
      comment: '总金额'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'),
      defaultValue: 'pending',
      comment: '订单状态'
    },
    tableNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'table_number', // 映射到数据库的实际字段名
      comment: '桌号'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  }, {
    tableName: 'orders',
    underscored: true,  // 自动转换为下划线命名
    indexes: [
      { unique: true, fields: ['order_no'] },
      { fields: ['user_id', 'status'] },
      { fields: ['created_at', 'status'] },
      { fields: ['status', 'created_at'] }
    ]
  });
  return Order;
};