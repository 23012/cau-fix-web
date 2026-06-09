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

const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: This origin is not allowed.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.disable('x-powered-by');
// nginx 리버스 프록시 1대 뒤에서 동작 → 실제 클라이언트 IP(X-Forwarded-For) 신뢰
// (rate limiter가 IP별로 올바르게 동작하도록 필요)
app.set('trust proxy', 1);
// API 응답 캐시 비활성화 (304 방지)
app.set('etag', false);

// 미들웨어
app.use(helmet());
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
});
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 본문 크기 제한: 기본 50kb로 DoS 표면을 최소화하되,
// 공지(notices)는 본문에 base64 이미지가 포함될 수 있어 더 큰 한도 적용
// (nginx client_max_body_size 10m 보다 작게 8mb)
const jsonSmall = express.json({ limit: '50kb' });
const jsonLarge = express.json({ limit: '8mb' });
app.use((req, res, next) => {
  if (req.path.startsWith('/api/notices')) return jsonLarge(req, res, next);
  return jsonSmall(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 정적 파일 서빙 (이미지 접근용)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  dotfiles: 'deny',
  index: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

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