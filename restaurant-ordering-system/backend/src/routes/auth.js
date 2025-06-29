const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');
const { auth } = require('../middleware/auth');

// 公开路由
router.post('/wechat-login', AuthController.wechatLogin);
router.post('/admin-login', AuthController.adminLogin);

// 需要认证的路由
router.get('/profile', auth.requireAuth, AuthController.getProfile);
router.put('/profile', auth.requireAuth, AuthController.updateProfile);
router.post('/logout', auth.requireAuth, AuthController.logout);
router.get('/check', AuthController.checkAuth);
router.post('/refresh', auth.requireAuth, AuthController.refreshSession);

module.exports = router;