module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '分类名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分类描述'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order', // 映射到数据库的实际字段名
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    tableName: 'categories',
    underscored: true,  // 自动转换为下划线命名
    indexes: [
      { fields: ['sort_order', 'status'] },
      { fields: ['status'] }
    ]
  });
  return Category;
};