const axios = require('axios');
const { CustomError } = require('../middleware/error');

/**
 * 微信小程序工具类
 */
class WechatUtil {
  constructor() {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    this.code2SessionUrl = 'https://api.weixin.qq.com/sns/jscode2session';
  }

  /**
   * 通过code获取微信用户信息
   * @param {string} code - 小程序登录code
   * @returns {Promise<Object>} 微信用户信息
   */
  async getWechatUserInfo(code) {
    try {
      const response = await axios.get(this.code2SessionUrl, {
        params: {
          appid: this.appId,
          secret: this.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        },
        timeout: 10000 // 10秒超时
      });

      const data = response.data;

      // 检查是否有错误
      if (data.errcode) {
        console.error('微信API错误:', data);
        throw new CustomError(
          this.getWechatErrorMessage(data.errcode),
          400,
          'WECHAT_API_ERROR'
        );
      }

      // 检查必要字段
      if (!data.openid) {
        throw new CustomError('未获取到用户openid', 400, 'INVALID_WECHAT_RESPONSE');
      }

      return {
        openid: data.openid,
        sessionKey: data.session_key,
        unionid: data.unionid || null
      };

    } catch (error) {
      if (error.isCustomError) {
        throw error;
      }
      
      console.error('调用微信API失败:', error.message);
      throw new CustomError('微信登录服务暂不可用', 500, 'WECHAT_SERVICE_ERROR');
    }
  }

  /**
   * 获取微信错误码对应的中文描述
   * @param {number} errcode - 错误码
   * @returns {string} 错误描述
   */
  getWechatErrorMessage(errcode) {
    const errorMessages = {
      40029: '登录凭证code无效',
      45011: '频率限制，请稍后再试',
      40013: '不合法的AppID',
      40125: '不合法的密钥',
      40226: '高风险等级用户，小程序登录拦截'
    };

    return errorMessages[errcode] || `微信登录失败，错误码：${errcode}`;
  }

  /**
   * 验证微信小程序数据签名
   * @param {string} rawData - 原始数据
   * @param {string} signature - 签名
   * @param {string} sessionKey - 会话密钥
   * @returns {boolean} 验证结果
   */
  validateSignature(rawData, signature, sessionKey) {
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1');
    sha1.update(rawData + sessionKey);
    return sha1.digest('hex') === signature;
  }
}

module.exports = new WechatUtil();