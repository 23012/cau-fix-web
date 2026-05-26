const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const authRouter = require('./routes/auth');
const memberRouter = require('./routes/members');
const complainRouter = require('./routes/complaints');
const noticeRouter = require('./routes/notices');
const notificationRouter = require('./routes/notifications');
const categoryRouter = require('./routes/categories');
const uploadRouter = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

// API 응답 캐시 비활성화 (304 방지)
app.set('etag', false);

// 미들웨어
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (이미지 접근용)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 라우터
app.use('/api/auth', authRouter);
app.use('/api/members', memberRouter);
app.use('/api/complaints', complainRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/uploads', uploadRouter);

// 헬스체크
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// VAPID public key 제공
app.get('/api/push/vapid-public-key', (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: '요청한 경로를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;