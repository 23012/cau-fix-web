const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const { loginLimiter, authLimiter } = require('../middlewares/rateLimiter');

// 아이디 중복 확인
router.get('/check-id/:login_id', authLimiter, authController.checkId);

// 회원가입
router.post('/register', authLimiter, authController.register);

// 로그인
router.post('/login', loginLimiter, authController.login);

// 로그아웃 (토큰 필요)
router.post('/logout', authMiddleware, authController.logout);

// 내 정보 조회 (토큰 필요)
router.get('/me', authMiddleware, authController.me);

module.exports = router;