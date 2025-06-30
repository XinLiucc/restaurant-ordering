// models/User.js - 优化后的用户模型（减少索引数量）

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
      unique: 'unique_openid', // 使用命名的唯一索引
      comment: '微信openid'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: 'unique_username', // 使用命名的唯一索引
      comment: '管理员用户名（仅管理员使用）'
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '管理员密码（仅管理员使用，bcrypt加密）'
    },
    nickName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'nick_name',
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
    underscored: true,
    // 🔧 优化索引定义 - 只保留必要的索引
    indexes: [
      {
        unique: true,
        fields: ['openid'],
        name: 'idx_users_openid_unique'
      },
      {
        unique: true,
        fields: ['username'],
        name: 'idx_users_username_unique',
        where: {
          username: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['role', 'status'], // 组合索引，减少索引数量
        name: 'idx_users_role_status'
      },
      {
        fields: ['phone'],
        name: 'idx_users_phone'
      }
    ],
    hooks: {
      // 密码加密钩子
      beforeCreate: async (user, options) => {
        if (user.password) {
          const bcrypt = require('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user, options) => {
        if (user.changed('password') && user.password) {
          const bcrypt = require('bcryptjs');
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // 实例方法
  User.prototype.toSafeJSON = function() {
    const values = this.get();
    delete values.password;
    return values;
  };

  // 验证密码方法
  User.prototype.validatePassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
  };

  // 类方法
  User.findByOpenid = function(openid) {
    return this.findOne({ where: { openid } });
  };

  User.findByUsername = function(username) {
    return this.findOne({ where: { username, role: 'admin' } });
  };

  User.findActiveUsers = function() {
    return this.findAll({ where: { status: 'active' } });
  };

  return User;
};