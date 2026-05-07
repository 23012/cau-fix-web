const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middlewares/auth');

// 회원 목록 조회 (관리자)
router.get('/', authMiddleware, memberController.getAll);

// 내 정보 수정 (본인)
router.put('/me', authMiddleware, memberController.updateProfile);

// 프로필 조회 (처리자 정보)
router.get('/:id/profile', authMiddleware, memberController.getProfile);

// 회원 승인 (관리자)
router.put('/:id/approve', authMiddleware, memberController.approve);

// 권한 변경 (관리자)
router.put('/:id/role', authMiddleware, memberController.updateRole);

// 담당 카테고리 변경 (관리자)
router.put('/:id/dept', authMiddleware, memberController.updateDept);

// 회원 탈퇴 (관리자)
router.delete('/:id', authMiddleware, memberController.delete);

module.exports = router;