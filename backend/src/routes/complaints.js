const express = require('express');
const router = express.Router();
const complainController = require('../controllers/complainController');
const authMiddleware = require('../middlewares/auth');

// 민원 등록
router.post('/', authMiddleware, complainController.create);

// 민원 목록 조회 (역할별 + 필터링)
router.get('/', authMiddleware, complainController.getAll);

// 민원 엑셀 다운로드 (관리자/처리자)
router.get('/export', authMiddleware, complainController.exportExcel);

// 민원 상세 조회
router.get('/:id', authMiddleware, complainController.getOne);

// 민원 수정 (접수전 본인만)
router.put('/:id', authMiddleware, complainController.update);

// 민원 삭제 (접수전 본인만)
router.delete('/:id', authMiddleware, complainController.delete);

// 민원 상태 변경 (처리자/관리자)
router.put('/:id/state', authMiddleware, complainController.updateState);

// 민원 처리 등록 (처리자/관리자)
router.post('/:id/process', authMiddleware, complainController.createProcess);

// 수정 요청 제출 (처리자)
const editRequestController = require('../controllers/editRequestController');
router.post('/:id/edit-request', authMiddleware, editRequestController.submit);

// 수정 요청 조회
router.get('/:id/edit-request', authMiddleware, editRequestController.get);

module.exports = router;