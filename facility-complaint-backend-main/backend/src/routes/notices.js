const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middlewares/auth');

// 공지사항 등록 (처리자/관리자)
router.post('/', authMiddleware, noticeController.create);

// 공지사항 목록 조회 (전체)
router.get('/', authMiddleware, noticeController.getAll);

// 공지사항 상세 조회 (전체)
router.get('/:id', authMiddleware, noticeController.getOne);

// 공지사항 수정 (작성자/관리자)
router.put('/:id', authMiddleware, noticeController.update);

// 공지사항 삭제 (작성자/관리자)
router.delete('/:id', authMiddleware, noticeController.delete);

module.exports = router;