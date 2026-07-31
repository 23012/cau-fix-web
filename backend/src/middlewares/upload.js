const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 없으면 자동 생성
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const allowedMimeTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const getSafeFilename = (prefix, mimetype) => {
  const ext = allowedMimeTypes[mimetype] || '.bin';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`;
};

// 민원 이미지 스토리지
const complainStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/complain');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, getSafeFilename('complain', file.mimetype));
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
    cb(null, getSafeFilename('process', file.mimetype));
  },
});

// 이미지 파일만 허용
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)'), false);
  }
};

// 최대 10장, 장당 50MB (아이폰 고해상도/ProRAW 사진이 25MB를 넘는 경우가 있어 상향)
const limits = { fileSize: 50 * 1024 * 1024 };

const uploadComplain = multer({ storage: complainStorage, fileFilter, limits });
const uploadProcess = multer({ storage: processStorage, fileFilter, limits });

module.exports = { uploadComplain, uploadProcess };