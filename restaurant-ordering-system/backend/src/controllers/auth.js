const { User } = require('../models');
const { Op } = require('sequelize');
const WechatUtil = require('../utils/wechat');
const { success, error, unauthorized, forbidden, created } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const bcrypt = require('bcryptjs');

class AuthController {
  /**
   * 微信小程序登录 - OAuth方式
   */
  wechatLogin = asyncHandler(async (req, res) => {
    const { code, userInfo } = req.body;

    if (!code) {
      return error(res, '登录凭证code不能为空', 400, 'MISSING_CODE');
    }

    try {
      // 开发环境模拟微信登录
      let wechatData;
      if (process.env.NODE_ENV === 'development' && !process.env.WECHAT_APP_ID) {
        wechatData = {
          openid: 'test_openid_' + code,
          sessionKey: 'test_session_key',
          unionid: null
        };
        console.log('🔧 开发环境：使用模拟微信登录');
      } else {
        wechatData = await WechatUtil.getWechatUserInfo(code);
      }
      
      // 查找或创建用户
      let user = await User.findByOpenid(wechatData.openid);

      if (!user) {
        user = await User.create({
          openid: wechatData.openid,
          nickName: userInfo?.nickName || '微信用户',
          avatar: userInfo?.avatarUrl || '',
          role: 'customer',
          status: 'active'
        });
        
        console.log('✅ 创建新用户:', user.id, user.nickName);
      } else {
        if (userInfo) {
          await user.update({
            nickName: userInfo.nickName || user.nickName,
            avatar: userInfo.avatarUrl || user.avatar
          });
        }
        
        console.log('✅ 用户登录:', user.id, user.nickName);
      }

      // 设置Session
      req.session.user = {
        id: user.id,
        openid: user.openid,
        nickName: user.nickName,
        avatar: user.avatar,
        role: user.role,
        loginTime: new Date().toISOString()
      };

      return success(res, {
        user: user.toSafeJSON(),
        sessionId: req.sessionID
      }, '微信登录成功');

    } catch (err) {
      console.error('❌ 微信登录失败:', err);
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '登录失败，请重试', 500);
    }
  });
  
  /**
   * 管理员登录 - 基于数据库验证
   */
  adminLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400, 'MISSING_CREDENTIALS');
    }

    try {
      // 从数据库查找管理员用户
      const admin = await User.findByUsername(username);

      if (!admin) {
        return unauthorized(res, '用户名或密码错误');
      }

      // 验证密码
      const isPasswordValid = await admin.validatePassword(password);
      
      if (!isPasswordValid) {
        return unauthorized(res, '用户名或密码错误');
      }

      // 检查账户状态
      if (admin.status !== 'active') {
        return forbidden(res, '账户已被禁用');
      }

      // 设置Session
      req.session.user = {
        id: admin.id,
        username: admin.username,
        nickName: admin.nickName,
        avatar: admin.avatar,
        role: admin.role,
        loginTime: new Date().toISOString()
      };

      return success(res, {
        user: admin.toSafeJSON(),
        sessionId: req.sessionID
      }, '管理员登录成功');

    } catch (err) {
      console.error('❌ 管理员登录失败:', err);
      return error(res, '登录失败，请重试', 500);
    }
  });

  /**
   * 创建管理员账户
   */
  createAdmin = asyncHandler(async (req, res) => {
    const { username, password, nickName, phone } = req.body;
    
    // 验证参数
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400, 'MISSING_CREDENTIALS');
    }

    if (password.length < 6) {
      return error(res, '密码长度不能少于6位', 400, 'PASSWORD_TOO_SHORT');
    }

    try {
      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return error(res, '用户名已存在', 400, 'USERNAME_EXISTS');
      }

      // 生成唯一的openid（管理员不使用微信登录）
      const adminOpenid = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 创建管理员用户
      const newAdmin = await User.create({
        openid: adminOpenid,
        username: username,
        password: password, // 会被hook自动加密
        nickName: nickName || '管理员',
        avatar: '',
        phone: phone,
        role: 'admin',
        status: 'active'
      });

      return created(res, {
        admin: newAdmin.toSafeJSON()
      }, '管理员账户创建成功');

    } catch (err) {
      console.error('❌ 创建管理员失败:', err);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return error(res, '用户名已存在', 400, 'USERNAME_EXISTS');
      }
      return error(res, '创建管理员失败', 500);
    }
  });

  /**
   * 修改管理员密码
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return unauthorized(res, '未登录');
    }

    if (!currentPassword || !newPassword) {
      return error(res, '当前密码和新密码不能为空', 400, 'MISSING_PASSWORDS');
    }

    if (newPassword.length < 6) {
      return error(res, '新密码长度不能少于6位', 400, 'PASSWORD_TOO_SHORT');
    }

    try {
      const user = await User.findByPk(userId);

      if (!user || user.role !== 'admin') {
        return forbidden(res, '只有管理员可以修改密码');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return error(res, '当前密码错误', 400, 'INVALID_CURRENT_PASSWORD');
      }

      // 更新密码
      await user.update({ password: newPassword });

      return success(res, null, '密码修改成功');

    } catch (err) {
      console.error('❌ 修改密码失败:', err);
      return error(res, '修改密码失败', 500);
    }
  });

   /**
   * 获取管理员列表
   */
  getAdminList = asyncHandler(async (req, res) => {
    const currentUser = req.session.user;

    if (!currentUser || currentUser.role !== 'admin') {
      return forbidden(res, '需要管理员权限');
    }

    try {
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });

      return success(res, admins.map(admin => admin.toSafeJSON()), '获取管理员列表成功');

    } catch (err) {
      console.error('❌ 获取管理员列表失败:', err);
      return error(res, '获取管理员列表失败', 500);
    }
  });
  /**
   * 模拟微信登录（开发测试用）- 增强版
   * POST /api/auth/mock-wechat-login
   * 
   * Body参数：
   * - mode: 'create' | 'login' | 'auto' (默认auto)
   * - nickName: string (创建新用户时必填)
   * - avatar: string (可选)
   * - userId: number (登录已存在用户时使用)
   * - phone: string (可选)
   */
  mockWechatLogin = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return error(res, '生产环境不支持模拟登录', 403);
    }

    const { 
      mode = 'auto', 
      nickName, 
      avatar, 
      userId, 
      phone 
    } = req.body;

    if (!['create', 'login', 'auto'].includes(mode)) {
      return error(res, '模式参数无效，应为 create、login 或 auto', 400, 'INVALID_MODE');
    }

    try {
      let user = null;

      switch (mode) {
        case 'create':
          // 强制创建新用户
          if (!nickName) {
            return error(res, '创建新用户时昵称不能为空', 400, 'MISSING_NICKNAME');
          }
          
          user = await this.createMockUser(nickName, avatar, phone);
          console.log('✅ 创建新的模拟用户:', user.id, user.nickName);
          break;

        case 'login':
          // 登录已存在的用户
          if (!userId) {
            return error(res, '登录模式下用户ID不能为空', 400, 'MISSING_USER_ID');
          }
          
          user = await User.findByPk(userId);
          if (!user) {
            return error(res, '指定的用户不存在', 404, 'USER_NOT_FOUND');
          }
          
          if (user.role !== 'customer') {
            return error(res, '只能登录普通用户账户', 400, 'INVALID_USER_ROLE');
          }
          
          console.log('✅ 登录已存在用户:', user.id, user.nickName);
          break;

        case 'auto':
        default:
          // 自动模式：优先使用最近的用户，如果没有则创建新用户
          const recentUser = await User.findOne({
            where: { role: 'customer' },
            order: [['createdAt', 'DESC']]
          });

          if (recentUser && !nickName) {
            // 使用最近的用户
            user = recentUser;
            console.log('✅ 自动登录最近用户:', user.id, user.nickName);
          } else {
            // 创建新用户
            const displayName = nickName || `测试用户${Date.now().toString().slice(-4)}`;
            user = await this.createMockUser(displayName, avatar, phone);
            console.log('✅ 自动创建新用户:', user.id, user.nickName);
          }
          break;
      }

      // 设置Session
      req.session.user = {
        id: user.id,
        openid: user.openid,
        nickName: user.nickName,
        avatar: user.avatar,
        role: user.role,
        loginTime: new Date().toISOString()
      };

      return success(res, {
        user: user.toSafeJSON(),
        sessionId: req.sessionID,
        mode: mode,
        isNewUser: mode === 'create' || (mode === 'auto' && nickName)
      }, `模拟微信登录成功 (${mode}模式)`);

    } catch (err) {
      console.error('❌ 模拟登录失败:', err);
      return error(res, '模拟登录失败', 500);
    }
  });

  /**
   * 创建模拟用户的辅助方法
   */
  async createMockUser(nickName, avatar, phone) {
    const mockOpenid = 'mock_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    
    return await User.create({
      openid: mockOpenid,
      nickName: nickName.trim(),
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickName)}&background=random`,
      phone: phone || null,
      role: 'customer',
      status: 'active'
    });
  }

    /**
   * 获取测试用户列表（开发环境）
   * GET /api/auth/test-users
   */
  getTestUsers = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return error(res, '生产环境不支持此功能', 403);
    }
    try {
      const testUsers = await User.findAll({
        where: { 
          role: 'customer',
          openid: { [Op.like]: 'mock_%' }
        },
        attributes: ['id', 'nickName', 'avatar', 'phone', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      return success(res, {
        users: testUsers,
        total: testUsers.length,
        tip: '这些是模拟创建的测试用户，可以在mock-wechat-login接口中使用userId参数登录'
      }, '获取测试用户列表成功');

    } catch (err) {
      console.error('获取测试用户列表失败:', err);
      return error(res, '获取测试用户列表失败', 500);
    }
  });

    /**
   * 清理测试用户（开发环境）
   * DELETE /api/auth/test-users
   */
  cleanTestUsers = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return error(res, '生产环境不支持此功能', 403);
    }

    const { keepRecent = 5 } = req.body;

    try {
      // 保留最近的几个用户，删除其他测试用户
      const allTestUsers = await User.findAll({
        where: { 
          role: 'customer',
          openid: { [Op.like]: 'mock_%' }
        },
        order: [['createdAt', 'DESC']]
      });

      if (allTestUsers.length <= keepRecent) {
        return success(res, {
          deletedCount: 0,
          remainingCount: allTestUsers.length,
          message: '测试用户数量未超过保留数量'
        }, '无需清理测试用户');
      }

      const usersToDelete = allTestUsers.slice(keepRecent);
      const userIdsToDelete = usersToDelete.map(user => user.id);

      // 删除用户（关联的订单等数据会根据外键设置处理）
      const deletedCount = await User.destroy({
        where: { id: userIdsToDelete }
      });

      console.log(`🧹 清理了 ${deletedCount} 个测试用户`);

      return success(res, {
        deletedCount,
        remainingCount: keepRecent,
        deletedUsers: usersToDelete.map(user => ({
          id: user.id,
          nickName: user.nickName,
          createdAt: user.createdAt
        }))
      }, `清理测试用户成功，保留最近${keepRecent}个`);

    } catch (err) {
      console.error('清理测试用户失败:', err);
      return error(res, '清理测试用户失败', 500);
    }
  });

  /**
   * 获取当前用户信息
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;

    if (!userId) {
      return unauthorized(res, '未登录');
    }

    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return error(res, '用户不存在', 404);
      }

      return success(res, user.toSafeJSON(), '获取用户信息成功');

    } catch (err) {
      console.error('❌ 获取用户信息失败:', err);
      return error(res, '获取用户信息失败', 500);
    }
  });

  /**
   * 更新用户信息
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.session.user?.id;
    const { nickName, avatar, phone } = req.body;

    if (!userId) {
      return unauthorized(res, '未登录');
    }

    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return error(res, '用户不存在', 404);
      }

      // 更新用户信息
      const updateData = {};
      if (nickName !== undefined) updateData.nickName = nickName;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (phone !== undefined) updateData.phone = phone;

      await user.update(updateData);

      // 更新session中的用户信息
      req.session.user = {
        ...req.session.user,
        nickName: user.nickName,
        avatar: user.avatar
      };

      return success(res, {
        id: user.id,
        nickName: user.nickName,
        avatar: user.avatar,
        phone: user.phone
      }, '更新用户信息成功');

    } catch (err) {
      console.error('更新用户信息失败:', err);
      return error(res, '更新用户信息失败', 500);
    }
  });

  /**
   * 退出登录
   */
  logout = asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ 退出登录失败:', err);
        return error(res, '退出登录失败', 500);
      }
      
      res.clearCookie('restaurant_session');
      return success(res, null, '退出登录成功');
    });
  });

  /**
   * 检查登录状态
   */
  checkAuth = asyncHandler(async (req, res) => {
    const user = req.session.user;

    if (!user) {
      return unauthorized(res, '未登录');
    }

    return success(res, {
      isLoggedIn: true,
      user: {
        id: user.id,
        nickName: user.nickName,
        role: user.role
      },
      loginTime: user.loginTime
    }, '已登录');
  });

  /**
   * 刷新会话
   */
  refreshSession = asyncHandler(async (req, res) => {
    const user = req.session.user;

    if (!user) {
      return unauthorized(res, '未登录');
    }

    // 更新登录时间
    req.session.user.loginTime = new Date().toISOString();

    return success(res, {
      sessionId: req.sessionID,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, '会话刷新成功');
  });
}

module.exports = new AuthController();
