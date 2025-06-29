module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    type: {
      type: DataTypes.ENUM('order', 'payment', 'system'),
      allowNull: false,
      comment: '通知类型'
    },
    targetType: {
      type: DataTypes.ENUM('user', 'admin', 'all'),
      allowNull: false,
      field: 'target_type', // 映射到数据库的实际字段名
      comment: '目标类型'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_id', // 映射到数据库的实际字段名
      comment: '目标用户ID'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read', // 映射到数据库的实际字段名
      comment: '是否已读'
    }
  }, {
    tableName: 'notifications',
    underscored: true,  // 自动转换为下划线命名
    updatedAt: false,
    indexes: [
      { fields: ['target_type', 'target_id'] },
      { fields: ['type'] },
      { fields: ['is_read', 'created_at'] },
      { fields: ['created_at'] }
    ]
  });
  return Notification;
};