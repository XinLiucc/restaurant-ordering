module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    openid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '微信openid'
    },
    nickName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'nick_name', // 映射到数据库的实际字段名
      comment: '昵称'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '头像URL'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      defaultValue: 'customer',
      comment: '角色'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    tableName: 'users',
    underscored: true,  // 自动转换为下划线命名
    indexes: [
      {
        unique: true,
        fields: ['openid']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      }
    ]
  });

  // 实例方法
  User.prototype.toSafeJSON = function() {
    const values = this.get();
    delete values.password;
    return values;
  };

  // 类方法
  User.findByOpenid = function(openid) {
    return this.findOne({ where: { openid } });
  };

  User.findActiveUsers = function() {
    return this.findAll({ where: { status: 'active' } });
  };

  return User;
};