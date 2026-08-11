const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const accountSwitchController = require('../controllers/accountSwitchController');
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

// 계정 전환(멀티 계정) — 목록은 로그인한 계정(owner) 소유. 모두 로그인 필요.
router.get('/accounts', authMiddleware, accountSwitchController.list);
router.post('/accounts', authMiddleware, loginLimiter, accountSwitchController.add);
router.delete('/accounts/:member_id', authMiddleware, accountSwitchController.remove);
router.post('/switch', authMiddleware, accountSwitchController.switch);

module.exports = router;