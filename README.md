# 🏥 CAU-FIX-WEB — 시설관리팀 민원 처리 플랫폼

> 병원·기관 내 시설 고장을 신고하고, 처리 담당자가 접수·진행·완료까지 상태를 관리하는 풀스택 웹 애플리케이션. 사용자·처리자·관리자 3개 역할 기반 RBAC와 실시간 Web Push 알림을 지원하는 PWA 형식의 웹사이트
> 

---

## 🛠 기술 스택

| 영역 | 기술 |
| --- | --- |
| **Frontend** | React 19, React Router 7, Recharts, Lucide React |
| **Backend** | Node.js + Express 5 |
| **Database** | PostgreSQL 18 |
| **인증** | JWT (jsonwebtoken + bcrypt) — 자동 로그인 14일 / 일반 8시간 |
| **푸시 알림** | Web Push (VAPID) + Service Worker |
| **파일 업로드** | Multer (이미지 최대 10장, 로컬 디스크) |
| **보안** | Helmet, CORS, Rate Limiter, sanitize-html, DOMPurify |
| **배포·인프라** | Nginx (리버스 프록시 + HTTPS/HTTP2), PM2, GitHub Actions |
| **엑셀 출력** | ExcelJS (백엔드), xlsx (프론트) |

---

## 🏗 시스템 아키텍처

```
클라이언트 (브라우저)
  React 19 SPA (PWA) + Service Worker (Web Push 수신)
         │ HTTPS (443)
         ▼
  Nginx (리버스 프록시)
  ├── /           → 프론트 빌드 정적 파일 서빙 (SPA)
  └── /api/, /uploads/ → :3000 (Express 백엔드)
  HTTP→HTTPS 리다이렉트, TLS 1.2/1.3, HSTS, CSP 헤더
         │ localhost:3000
         ▼
  Express 5 API Server (PM2 관리)
  JWT 인증 → RBAC → Controller → Model → PostgreSQL
  Rate Limiter · Helmet · CORS · Multer
         │
         ▼
  PostgreSQL 18
  14개 테이블, ENUM 타입, 트리거, 부분 인덱스
```

---

## 📁 프로젝트 구조

```
cau-fix-web/
├── .github/workflows/deploy.yml    # CI/CD 파이프라인
├── nginx/nginx.prod.conf           # 프로덕션 Nginx 설정
├── ecosystem.config.js             # PM2 프로세스 관리
├── db/init.sql                     # DB 스키마 (14개 테이블)
│
├── backend/
│   └── src/
│       ├── app.js                  # Express 진입점 (미들웨어 체인)
│       ├── config/db.js            # PostgreSQL 커넥션 풀
│       ├── controllers/            # 8개 컨트롤러 (비즈니스 로직)
│       ├── models/                 # 7개 모델 (SQL 쿼리 캡슐화)
│       ├── middlewares/            # auth, rateLimiter, upload
│       ├── routes/                 # 7개 라우터 (RESTful 엔드포인트)
│       └── services/webPush.js     # VAPID 푸시 발송 서비스
│
└── frontend/
    ├── public/
    │   ├── service-worker.js       # PWA + Push 수신
    │   └── manifest.json           # PWA 매니페스트
    └── src/
        ├── App.js                  # 라우팅 (11개 페이지)
        ├── pages/                  # 페이지 컴포넌트 (11개)
        ├── components/             # UI 컴포넌트 (8개 도메인별 폴더)
        ├── services/               # API 호출 모듈 (apiClient 패턴)
        ├── hooks/                  # Custom Hooks (7개)
        ├── context/                # Context API (민원 데이터 단일 소스)
        ├── constants/              # 상수 정의 (상태, 역할, 카테고리)
        ├── utils/                  # 유틸리티 (날짜 포맷, 푸시 구독 등)
        └── styles/                 # 글로벌 CSS + 반응형 + 변수
```

---

## ✨ 주요 기능

### 1. 역할 기반 접근 제어 (RBAC)

| 역할 | 권한 |
| --- | --- |
| **사용자 (C)** | 민원 등록·조회(본인)·수정(접수 전)·삭제 |
| **처리자 (E)** | 담당 카테고리 민원 조회, 상태 변경, 처리 등록, 수정 요청 |
| **관리자 (A)** | 전체 민원 관리, 회원 승인·권한변경·탈퇴, 수정 요청 승인·반려, 공지사항 CRUD, 엑셀 다운로드 |

---

### 2. 민원 상태 머신

```
접수전(B) → 접수(A) → 진행중(P) → 완료(D)
    ↓           ↓
  수정중(R) ←────┘
  (관리자 승인 후 원래 상태로 복원)
```

- 모든 상태 변경은 `complain_state_history` 테이블에 이력 저장
- 수정 요청 워크플로우 : 처리자 요청 → 관리자 승인/반려 → 수정 완료

---

### 3. 수정 요청 워크플로우 (3종)

| 유형 | 승인 시 처리 |
| --- | --- |
| 분류 항목 변경 | 즉시 카테고리 변경 + 접수전 복원 + 기존 처리자 해제 |
| 처리 담당자 변경 | 승인 후 새 처리자 지정 API 호출 |
| 기타 (내용 수정) | 승인 후 민원 내용 수정 API 호출 |

---

### 4. 실시간 알림 시스템

- DB 저장 + Web Push 동시 발송
- VAPID 키 기반 브라우저 푸시 구독
- 구독 만료(410/404) 시 자동 정리
- 이벤트 별 대상 자동 분배 (민원인 / 처리자 / 관리자)

---

### 5. PWA (Progressive Web App)

- **Service Worker**: Network First 전략 (오프라인 폴백)
- **Push 이벤트 리스너**: 백그라운드 알림 수신
- 알림 클릭 시 앱 포커스 / 오픈
- `manifest.json`: 홈 화면 추가 지원

---

### 6. 보안 구현

| 위협 | 대응 |
| --- | --- |
| XSS | sanitize-html (백엔드), DOMPurify (프론트) |
| CSRF | SameSite 쿠키 + CORS 화이트리스트 |
| Brute Force | express-rate-limit — 로그인 15분/30회 실패 차단 |
| 헤더 보안 | Helmet (X-Frame-Options, CSP, HSTS 등) |
| 파일 업로드 공격 | Multer 파일 크기 제한 + dotfiles deny |
| SQL Injection | Parameterized Query (pg 라이브러리 `$1, $2` 바인딩) |
| 정보 노출 | x-powered-by 비활성화, Cache-Control no-store |

---

### 7. 엑셀 다운로드

- 관리자 전용, 필터 조건(카테고리 / 상태 / 기간) 조합 가능
- ExcelJS로 서버사이드 엑셀 생성 → 스트림 응답
- `Content-Disposition` 헤더로 UTF-8 파일명 전달

---

## 🗄 데이터베이스 설계

### ERD 요약 (14개 테이블)

| 테이블 | 설명 |
| --- | --- |
| `member` | 회원 (사번 로그인, 논리 삭제) |
| `member_log` | 회원 관리 이력 (승인·권한변경·비번초기화·탈퇴) |
| `complain` | 민원 (논리 삭제, 상태 머신) |
| `complain_category` | 민원 카테고리 (부서 매핑) |
| `complain_img` | 민원 첨부 이미지 |
| `complain_state_history` | 상태 변경 이력 |
| `complaint_process` | 민원 처리 (1:1) |
| `process_img` | 처리 첨부 이미지 |
| `complaint_edit_requests` | 수정 요청 |
| `complaint_edit_request_reviews` | 수정 요청 승인/반려 기록 |
| `complaint_edit_history` | 수정 이력 (before/after JSONB 스냅샷) |
| `notice` | 공지사항 (트리거로 `updated_at` 자동 갱신) |
| `push_notification` | 푸시 알림 (읽음 처리) |
| `push_subscription` | 브라우저 푸시 구독 정보 |

### DB 설계 특징

- **ENUM 타입 5종** — 역할, 민원 상태, 공지 카테고리, 로그 액션, 수정 요청 상태
- **부분 유니크 인덱스** — `WHERE is_deleted = FALSE`로 탈퇴 회원 ID 재사용 가능
- **JSONB 컬럼** — 수정 이력의 before/after 스냅샷 유연 저장
- **트리거 함수** — 공지사항 수정 시 `updated_at` 자동 갱신
- **ON DELETE RESTRICT** — 상태 이력 참조 무결성 보장

---

## 🚀 CI/CD 파이프라인

```
GitHub Actions (Self-hosted Runner)
├── CI Job (PR/Push)
│   ├── 프론트엔드: npm install → npm run build
│   └── 백엔드: npm install
│
└── Deploy Job (Push to main / Manual)
    ├── 시크릿 검증 (6개 필수 시크릿)
    ├── git pull origin main
    ├── .env 파일 동적 생성
    ├── 백엔드 npm install
    ├── 프론트엔드 빌드
    ├── PM2 reload (zero-downtime)
    └── Nginx 설정 배포 + 문법 검증 + reload
```

- **Zero-downtime 배포**: PM2 reload로 graceful restart
- **Nginx 안전 배포**: `nginx -t` 검증 실패 시 백업 복원
- **환경 변수 보안**: GitHub Secrets에서 동적 `.env` 생성 (소스에 시크릿 없음)

---

## 🖥 프론트엔드 아키텍처

### 설계 패턴

- **Context API + Custom Hooks**: 민원 데이터 단일 소스(Single Source of Truth)
- **apiClient 패턴**: fetch 래퍼로 인증 헤더 자동 주입, 에러 핸들링 통합
- **페이지/컴포넌트 분리**: `pages/`(라우팅 단위) + `components/`(도메인별 재사용 UI)
- **서비스 레이어**: API 호출 로직 분리 (`services/*.js`)
- **탭 전환 시 자동 데이터 갱신**: `visibilitychange` + `focus` 이벤트 활용

### 반응형 설계

- CSS Variables로 디자인 토큰 관리
- 별도 `responsive.css`로 미디어 쿼리 분리
- 모바일 우선 UI (PWA 홈 화면 추가 대응)

---

## ⚙️ 백엔드 아키텍처

### 레이어 구조

```
Routes → Controllers → Models → PostgreSQL
              ↓
        Services (webPush)
```

### 미들웨어 체인

```
Helmet → Cache-Control → CORS → Morgan → JSON Parser → 라우터
```

### 주요 설계 결정

- **경로별 body 크기 제한**: 일반 API 50KB / 공지사항 8MB (base64 이미지 대응)
- **trust proxy 1**: Nginx 뒤에서 실제 클라이언트 IP 식별 (Rate Limiter 정확도)
- **TIMESTAMP 파서 오버라이드**: UTC 자동 변환 방지, 한국 시간(Asia/Seoul) 문자열 그대로 반환
- **JWT 검증 시 DB 조회**: 토큰의 role이 아닌 DB 최신 role 적용 → 관리자 권한 변경 즉시 반영

### API 설계

- RESTful 엔드포인트 7개 도메인, 30+ API
- JWT Bearer Token 인증, 역할별 접근 제어 (미들웨어 레벨)
- 일관된 응답 형식: `{ message, data }` / 에러: `{ message }`
- 필터 조합 쿼리 파라미터 (카테고리 / 상태 / 기간)

---

## 🌐 개발 vs 운영 환경

| 구분 | 개발 | 운영 |
| --- | --- | --- |
| 서버 | localhost:3000 | Self-hosted (PM2) |
| 프론트 | CRA dev server (proxy) | Nginx 정적 서빙 |
| DB | 로컬 PostgreSQL | 운영 PostgreSQL |
| HTTPS | ✕ | ✓ (TLS 1.2/1.3, HTTP2) |
| 배포 | 수동 | GitHub Actions 자동 |
| 로그 | morgan dev | morgan combined |
| 프로세스 | node 직접 실행 | PM2 (auto-restart, memory limit 300MB) |