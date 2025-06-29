module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id', // 映射到数据库的实际字段名
      comment: '订单ID'
    },
    dishId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dish_id', // 映射到数据库的实际字段名
      comment: '菜品ID'
    },
    dishName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'dish_name', // 映射到数据库的实际字段名
      comment: '菜品名称'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '单价'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '数量'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '小计'
    }
  }, {
    tableName: 'order_items',
    underscored: true,  // 自动转换为下划线命名
    updatedAt: false,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['dish_id'] },
      { fields: ['created_at'] }
    ]
  });
  return OrderItem;
};