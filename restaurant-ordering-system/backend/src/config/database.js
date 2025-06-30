const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'restaurant_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'asdjkl_root',
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+08:00',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: false,
    freezeTableName: false
  }
};

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  config
};