module.exports = (sequelize, DataTypes) => {
  const Dish = sequelize.define('Dish', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '菜品名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '菜品描述'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '价格'
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '图片URL'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id', // 映射到数据库的实际字段名
      comment: '分类ID'
    },
    status: {
      type: DataTypes.ENUM('available', 'unavailable'),
      defaultValue: 'available',
      comment: '状态'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '标签'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order', // 映射到数据库的实际字段名
      comment: '排序'
    }
  }, {
    tableName: 'dishes',
    // 配置字段命名策略
    underscored: true,  // 自动转换为下划线命名
    indexes: [
      { fields: ['category_id', 'status'] },
      { fields: ['status'] },
      { fields: ['sort_order'] }
    ]
  });
  return Dish;
};
