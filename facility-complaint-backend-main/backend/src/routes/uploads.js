const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/auth');
const { uploadComplain, uploadProcess } = require('../middlewares/upload');

// 민원 이미지 업로드 (최대 10장)
router.post('/complain', authMiddleware, uploadComplain.array('images', 10), uploadController.uploadComplainImages);

// 처리 이미지 업로드 (최대 10장)
router.post('/process', authMiddleware, uploadProcess.array('images', 10), uploadController.uploadProcessImages);

// 민원 이미지 삭제
router.delete('/complain/:id', authMiddleware, uploadController.deleteComplainImage);

// 처리 이미지 삭제
router.delete('/process/:id', authMiddleware, uploadController.deleteProcessImage);

module.exports = router;