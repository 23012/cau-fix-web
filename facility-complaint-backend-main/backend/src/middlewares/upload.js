const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 없으면 자동 생성
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 민원 이미지 스토리지
const complainStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/complain');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `complain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, filename);
  },
});

// 처리 이미지 스토리지
const processStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/process');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, filename);
  },
});

// 이미지 파일만 허용
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)'), false);
  }
};

// 최대 10장, 장당 10MB
const limits = { fileSize: 10 * 1024 * 1024 };

const uploadComplain = multer({ storage: complainStorage, fileFilter, limits });
const uploadProcess = multer({ storage: processStorage, fileFilter, limits });

module.exports = { uploadComplain, uploadProcess };