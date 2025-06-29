const { User } = require('../models');
const WechatUtil = require('../utils/wechat');
const { success, error, unauthorized } = require('../utils/response');
const { CustomError, asyncHandler } = require('../middleware/error');
const bcrypt = require('bcryptjs');

class AuthController {
  /**
   * 微信小程序登录
   */
  wechatLogin = asyncHandler(async (req, res) => {
    const { code, userInfo } = req.body;

    // 验证参数
    if (!code) {
      return error(res, '登录凭证code不能为空', 400, 'MISSING_CODE');
    }

    try {
      // 1. 调用微信接口获取用户信息
      const wechatData = await WechatUtil.getWechatUserInfo(code);
      
      // 2. 查找或创建用户
      let user = await User.findOne({ 
        where: { openid: wechatData.openid } 
      });

      if (!user) {
        // 创建新用户
        user = await User.create({
          openid: wechatData.openid,
          nickName: userInfo?.nickName || '微信用户',
          avatar: userInfo?.avatarUrl || '',
          role: 'customer',
          status: 'active'
        });
        
        console.log('创建新用户:', user.id);
      } else {
        // 更新用户信息（如果有传入）
        if (userInfo) {
          await user.update({
            nickName: userInfo.nickName || user.nickName,
            avatar: userInfo.avatarUrl || user.avatar
          });
        }
        
        console.log('用户登录:', user.id);
      }

      // 3. 设置Session
      req.session.user = {
        id: user.id,
        openid: user.openid,
        nickName: user.nickName,
        avatar: user.avatar,
        role: user.role,
        loginTime: new Date().toISOString()
      };

      // 4. 保存session key（可选，用于数据解密）
      req.session.wechat = {
        sessionKey: wechatData.sessionKey,
        unionid: wechatData.unionid
      };

      return success(res, {
        user: {
          id: user.id,
          openid: user.openid,
          nickName: user.nickName,
          avatar: user.avatar,
          role: user.role
        },
        sessionId: req.sessionID
      }, '登录成功');

    } catch (err) {
      console.error('微信登录失败:', err);
      
      if (err.isCustomError) {
        return error(res, err.message, err.status, err.code);
      }
      
      return error(res, '登录失败，请重试', 500);
    }
  });

  /**
   * 管理员登录
   */
  adminLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // 验证参数
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400, 'MISSING_CREDENTIALS');
    }

    try {
      // 查找管理员用户
      const admin = await User.findOne({
        where: { 
          role: 'admin',
          status: 'active'
        }
      });

      if (!admin) {
        return unauthorized(res, '管理员账户不存在');
      }

      // 验证密码（这里简化处理，实际应该用加密密码）
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== defaultUsername || password !== defaultPassword) {
        return unauthorized(res, '用户名或密码错误');
      }

      // 设置Session
      req.session.user = {
        id: admin.id,
        nickName: admin.nickName,
        avatar: admin.avatar,
        role: 'admin',
        loginTime: new Date().toISOString()
      };

      return success(res, {
        user: {
          id: admin.id,
          nickName: admin.nickName,
          avatar: admin.avatar,
          role: 'admin'
        },
        sessionId: req.sessionID
      }, '管理员登录成功');

    } catch (err) {
      console.error('管理员登录失败:', err);
      return error(res, '登录失败，请重试', 500);
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
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return error(res, '用户不存在', 404);
      }

      return success(res, user, '获取用户信息成功');

    } catch (err) {
      console.error('获取用户信息失败:', err);
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
        console.error('退出登录失败:', err);
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
