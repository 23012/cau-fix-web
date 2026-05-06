const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/auth');

// 카테고리 목록 조회 (민원 등록용 - 전체 제외, 인증 불필요)
router.get('/', categoryController.getAll);

// 카테고리 목록 조회 (처리자 가입용 - 전체 포함, 인증 불필요)
router.get('/with-total', categoryController.getAllWithTotal);

// 카테고리 등록 (관리자)
router.post('/', authMiddleware, categoryController.create);

// 카테고리 수정 (관리자)
router.put('/:id', authMiddleware, categoryController.update);

// 카테고리 삭제 (관리자)
router.delete('/:id', authMiddleware, categoryController.delete);

module.exports = router;