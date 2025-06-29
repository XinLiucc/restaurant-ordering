const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// 导入所有模型
const User = require('./User')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Dish = require('./Dish')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const OrderItem = require('./OrderItem')(sequelize, DataTypes);
const Payment = require('./Payment')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);

// 定义模型关联关系
const setupAssociations = () => {
  // 用户和订单的关系
  User.hasMany(Order, {
    foreignKey: 'userId',
    as: 'orders'
  });
  Order.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 分类和菜品的关系
  Category.hasMany(Dish, {
    foreignKey: 'categoryId',
    as: 'dishes'
  });
  Dish.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });

  // 订单和订单项的关系
  Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items'
  });
  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  // 菜品和订单项的关系
  Dish.hasMany(OrderItem, {
    foreignKey: 'dishId',
    as: 'orderItems'
  });
  OrderItem.belongsTo(Dish, {
    foreignKey: 'dishId',
    as: 'dish'
  });

  // 订单和支付的关系
  Order.hasMany(Payment, {
    foreignKey: 'orderId',
    as: 'payments'
  });
  Payment.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
  });

  // 用户和通知的关系
  User.hasMany(Notification, {
    foreignKey: 'targetId',
    constraints: false,
    scope: {
      targetType: 'user'
    },
    as: 'notifications'
  });
};

// 设置关联关系
setupAssociations();

// 数据库同步
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ 数据库模型同步完成');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error);
    throw error;
  }
};

// 导出所有模型和sequelize实例
module.exports = {
  sequelize,
  User,
  Category,
  Dish,
  Order,
  OrderItem,
  Payment,
  Notification,
  syncDatabase
};