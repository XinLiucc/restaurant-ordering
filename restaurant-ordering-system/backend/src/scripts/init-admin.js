// src/scripts/init-admin.js - 初始化管理员账户
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function initAdmin() {
  try {
    console.log('🔧 开始初始化管理员账户...');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查是否已有管理员
    const adminCount = await User.count({ where: { role: 'admin' } });
    
    if (adminCount > 0) {
      console.log(`ℹ️  已存在 ${adminCount} 个管理员账户`);
      
      // 显示现有管理员
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'username', 'nickName', 'phone', 'status', 'createdAt']
      });
      
      console.log('现有管理员账户：');
      admins.forEach(admin => {
        console.log(`  - ID: ${admin.id}, 用户名: ${admin.username || '未设置'}, 昵称: ${admin.nickName}`);
      });
      
      return;
    }

    // 创建默认管理员
    console.log('🔨 创建默认管理员账户...');
    
    const defaultAdmin = await User.create({
      openid: 'admin_system_default_' + Date.now(),
      username: 'admin',
      password: 'admin123', // 会被自动加密
      nickName: '系统管理员',
      phone: '13800138000',
      role: 'admin',
      status: 'active'
    });

    console.log('✅ 默认管理员账户创建成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 登录信息：');
    console.log(`   用户名: ${defaultAdmin.username}`);
    console.log(`   密码: admin123`);
    console.log(`   昵称: ${defaultAdmin.nickName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  请及时修改默认密码！');

  } catch (error) {
    console.error('❌ 初始化管理员失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 更新现有管理员的认证信息
async function updateExistingAdmin() {
  try {
    console.log('🔧 更新现有管理员认证信息...');
    
    await sequelize.authenticate();
    
    // 查找现有的管理员（没有username的）
    const existingAdmin = await User.findOne({
      where: { 
        role: 'admin',
        username: null
      }
    });

    if (existingAdmin) {
      // 更新认证信息
      await existingAdmin.update({
        username: 'admin',
        password: 'admin123' // 会被自动加密
      });
      
      console.log('✅ 现有管理员认证信息更新成功！');
      console.log(`管理员ID: ${existingAdmin.id}`);
      console.log('新用户名: admin');
      console.log('新密码: admin123');
    } else {
      console.log('ℹ️  没有找到需要更新的管理员账户');
    }

  } catch (error) {
    console.error('❌ 更新管理员失败:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 验证密码加密
async function testPasswordEncryption() {
  try {
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    
    console.log('🔐 密码加密测试：');
    console.log(`原密码: ${plainPassword}`);
    console.log(`加密后: ${hashedPassword}`);
    console.log(`验证结果: ${isValid ? '✅ 成功' : '❌ 失败'}`);
    
  } catch (error) {
    console.error('❌ 密码加密测试失败:', error);
  }
}

// 主函数
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      await initAdmin();
      break;
    case 'update':
      await updateExistingAdmin();
      break;
    case 'test':
      await testPasswordEncryption();
      break;
    default:
      console.log('使用方法：');
      console.log('  node src/scripts/init-admin.js init    # 创建新的管理员账户');
      console.log('  node src/scripts/init-admin.js update  # 更新现有管理员认证信息');
      console.log('  node src/scripts/init-admin.js test    # 测试密码加密功能');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { initAdmin, updateExistingAdmin, testPasswordEncryption };