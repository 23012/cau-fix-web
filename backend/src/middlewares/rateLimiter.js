const rateLimit = require('express-rate-limit');

// 로그인 무차별 대입 방어
// - 성공한 로그인은 카운트하지 않음(skipSuccessfulRequests)
//   → NAT로 공인 IP를 공유하는 환경에서도 정상 사용자가 잠기지 않음
// - 실패한 로그인 시도만 누적되어 무차별 대입을 차단
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  limit: 30, // 15분 내 실패 30회 초과 시 차단
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

// 회원가입 / 아이디 중복확인 등 인증 관련 엔드포인트 스팸 방어
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

module.exports = { loginLimiter, authLimiter };
