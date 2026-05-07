const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/auth');

// 알림 목록 조회 (최근 7일)
router.get('/', authMiddleware, notificationController.getAll);

// 읽지 않은 알림 수 조회 (상단 뱃지용)
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

// 알림 읽음 처리
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

// 전체 읽음 처리
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);

module.exports = router;