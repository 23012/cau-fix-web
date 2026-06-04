# 변경 사항 정리


---

## 1. DB 스키마 변경 사항

### 1-1. ENUM 타입 추가/변경

| ENUM 타입 | 이전 | 현재 |
|-----------|----------|---------|
| `complain_state` | B, A, P, D | B, A, P, D, **R(수정중)** |
| `member_log_action` | 없음 (문서 미언급) | **신규**: A(승인), R(역할변경), D(부서변경), P(비밀번호변경) |
| `edit_request_status` | 없음 | **신규**: P(대기), A(승인), R(거절), C(완료) |

---

### 1-2. 테이블 변경

#### member 테이블
| 컬럼 | 이전 | 현재 |
|------|----------|---------|
| `is_deleted` | 없음 | **추가** - 논리적 탈퇴 (BOOLEAN, DEFAULT FALSE) |
| `deleted_at` | 없음 | **추가** - 탈퇴 일시 (TIMESTAMP) |
| `last_login_at` | 없음 | **추가** - 마지막 로그인 시각 (TIMESTAMP) |

#### complain 테이블
| 컬럼 | 이전 | 현재 |
|------|----------|---------|
| `is_deleted` | 없음 | **추가** - 논리적 삭제 (BOOLEAN, DEFAULT FALSE) |
| `deleted_at` | 없음 | **추가** - 삭제 일시 (TIMESTAMP) |
| `state` 값 | B/A/P/D | B/A/P/D/**R** |

---

### 1-3. 신규 테이블

| 테이블 | 용도 |
|--------|------|
| `member_log` | 회원 관리 로그 (승인, 역할변경, 비밀번호변경, 탈퇴 기록) |
| `complain_state_history` | 민원 상태 변경 이력 (prev_state → next_state) |
| `complaint_process` | 민원 처리 테이블 (처리자 할당 + 처리 내용) |
| `process_img` | 처리 첨부 이미지 |
| `push_subscription` | 웹 푸시 구독 정보 (endpoint, p256dh, auth) |
| `complaint_edit_requests` | 처리자 수정 요청 |
| `complaint_edit_request_reviews` | 관리자 수정 요청 승인/거절 기록 |
| `complaint_edit_history` | 민원 수정 이력 스냅샷 (before/after JSONB) |

---

### 1-4. 신규 테이블 상세 스키마

#### member_log
```sql
CREATE TABLE member_log (
    log_id      SERIAL PRIMARY KEY,
    member_id   INTEGER NOT NULL REFERENCES member(member_id),
    action      member_log_action NOT NULL,  -- A/R/D/P
    done_by     VARCHAR(255) NOT NULL,       -- 실행한 관리자 login_id
    detail      TEXT,                        -- "C → E" 등 변경 상세
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### complain_state_history
```sql
CREATE TABLE complain_state_history (
    state_history_id SERIAL PRIMARY KEY,
    complain_id      INTEGER NOT NULL REFERENCES complain(complain_id),
    changed_by       INTEGER NOT NULL REFERENCES member(member_id),
    prev_state       complain_state NOT NULL,
    next_state       complain_state NOT NULL,
    changed_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### complaint_process
```sql
CREATE TABLE complaint_process (
    process_id      SERIAL PRIMARY KEY,
    complain_id     INTEGER NOT NULL UNIQUE REFERENCES complain(complain_id),  -- 1:1
    process_by      INTEGER NOT NULL REFERENCES member(member_id),
    process_content TEXT NOT NULL,
    process_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### push_subscription
```sql
CREATE TABLE push_subscription (
    subscription_id  SERIAL PRIMARY KEY,
    member_id        INTEGER NOT NULL REFERENCES member(member_id),
    endpoint         TEXT NOT NULL,
    p256dh           TEXT NOT NULL,
    auth             TEXT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(member_id, endpoint)
);
```

#### complaint_edit_requests
```sql
CREATE TABLE complaint_edit_requests (
    id              SERIAL PRIMARY KEY,
    complaint_id    INTEGER NOT NULL REFERENCES complain(complain_id),
    requester_id    INTEGER NOT NULL REFERENCES member(member_id),
    reason_type     VARCHAR(50) NOT NULL,     -- '분류 항목 변경' | '처리 담당자 변경' | '기타'
    detail          TEXT DEFAULT '',
    status          edit_request_status NOT NULL DEFAULT 'P',
    prev_state      CHAR(1) DEFAULT NULL,     -- 요청 전 민원 상태 (복원용)
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### complaint_edit_request_reviews
```sql
CREATE TABLE complaint_edit_request_reviews (
    id                SERIAL PRIMARY KEY,
    edit_request_id   INTEGER NOT NULL REFERENCES complaint_edit_requests(id),
    reviewer_id       INTEGER NOT NULL REFERENCES member(member_id),
    decision          VARCHAR(20) NOT NULL,   -- 'APPROVED' | 'REJECTED'
    reject_reason     TEXT,                   -- 거절 시 사유
    reviewed_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### complaint_edit_history
```sql
CREATE TABLE complaint_edit_history (
    id                SERIAL PRIMARY KEY,
    edit_request_id   INTEGER NOT NULL REFERENCES complaint_edit_requests(id),
    complaint_id      INTEGER NOT NULL REFERENCES complain(complain_id),
    changed_by        INTEGER NOT NULL REFERENCES member(member_id),
    before_data       JSONB NOT NULL,         -- {title, content, location, category_id}
    after_data        JSONB NOT NULL,
    changed_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

### 1-5. 인덱스 추가

```sql
-- 활성 회원 아이디 유니크 (탈퇴 회원 제외)
CREATE UNIQUE INDEX idx_member_login_id_active ON member(login_id) WHERE is_deleted = FALSE;

-- 민원 조회 최적화
CREATE INDEX idx_complain_complain_by ON complain(complain_by);
CREATE INDEX idx_complain_state ON complain(state);
CREATE INDEX idx_complain_is_deleted ON complain(is_deleted);

-- 상태 이력
CREATE INDEX idx_state_history_complain_id ON complain_state_history(complain_id);

-- 알림
CREATE INDEX idx_push_member_id ON push_notification(member_id);
CREATE INDEX idx_push_is_read ON push_notification(is_read);

-- 푸시 구독
CREATE INDEX idx_push_subscription_member ON push_subscription(member_id);

-- 수정 요청
CREATE INDEX idx_edit_requests_complaint_id ON complaint_edit_requests(complaint_id);
CREATE INDEX idx_edit_requests_status ON complaint_edit_requests(status);

-- 수정 이력
CREATE INDEX idx_edit_history_complaint_id ON complaint_edit_history(complaint_id);

-- 멤버 로그
CREATE INDEX idx_member_log_member_id ON member_log(member_id);
```

---

### 1-6. 트리거

```sql
-- 공지사항 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_notice_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notice_updated_at
BEFORE UPDATE ON notice FOR EACH ROW EXECUTE FUNCTION update_notice_updated_at();
```

---

### 1-7. 카테고리 시드 데이터 변경

| 원본 문서 | 현재 DB |
|-----------|---------|
| 건축/영선 (시설팀) | **영선** (시설팀) |
| 의료장비 (물류관리팀) | 의료장비 (물류관리팀) - 순서 5번으로 변경 |
| 기계/소방 (시설팀) | **기계** (시설팀) + **소방** (시설팀) |
| 전기/통신 (시설팀) | 전기/통신 (시설팀) |
| 보안 (총무팀) | **삭제됨** |
| 미화 (총무팀) | 미화 (총무팀) |

> 6개 → 6개 (보안 삭제, 기계/소방 분리)

---

### 1-8. 관리자 시드 계정

```sql
INSERT INTO member (login_id, password, name, role, dept, phone, is_approved)
VALUES ('superadmin', '$2b$10$k1.UtJ/OdgXrijhI/...', '슈퍼관리자', 'A', '시설관리팀', '010-0000-0000', TRUE);
```

> 원본 문서에 없던 기본 관리자 계정. 비밀번호: `admin1234!` (bcrypt 해시)

---

## 2. API 엔드포인트 변경 사항

### 2-1. 기존 API 동작 변경

| API | 변경 내용 |
|-----|----------|
| `PUT /api/complaints/:id` | 관리자(A)는 상태 무관하게 수정 가능 (기존: 접수전만) |
| `DELETE /api/complaints/:id` | 관리자(A)는 상태 무관하게 삭제 가능 + 논리적 삭제(soft delete) |
| `PUT /api/complaints/:id/state` | 상태 변경 시 `complain_state_history` 이력 기록 + 접수(A) 시 처리자 자동 할당 + 진행(P) 시 처리 시간 기록 + 웹 푸시 발송 |
| `POST /api/complaints/:id/process` | 기존 process 있으면 내용만 업데이트 (기존: 항상 신규 생성) |
| `GET /api/complaints/export` | `?category`, `?status` 필터 추가 + 이미지 URL 컬럼 포함 |
| `PUT /api/members/me` | `dept` 필드 추가 (비밀번호, 전화번호, 부서 중 택) |
| `DELETE /api/members/:id` | 관리자 본인 비밀번호 확인 필수 (`{ "password": "..." }`) + 논리적 삭제 |
| `PUT /api/members/:id/dept` | dept 유효값을 DB에서 동적 조회 + 처리자(E)만 변경 가능 검증 |
| `DELETE /api/uploads/complain/:id` | 본인 민원 이미지 또는 관리자만 삭제 가능 (권한 체크 추가) |

---

### 2-2. 기존 API 응답 필드 변경

#### 민원 목록 응답 (`GET /api/complaints`)
```diff
 {
   "id": 1,
   "title": "...",
   "content": "...",
   "category": "미화",
   "location": "...",
   "status": "접수",
   "date": "...",
   "memberName": "홍길동",
   "memberDept": "총무팀",
+  "resultPersonId": 5,       // 처리 담당자 member_id (null 가능)
+  "resultPerson": "김처리"   // 처리 담당자 이름 (null 가능)
 }
```

#### 민원 상세 - process 응답 (`GET /api/complaints/:id`)
```diff
 "process": {
+  "process_id": 1,
+  "process_by": 5,           // 처리자 member_id
   "result": "청소 완료",
   "resultPerson": "김처리",
+  "resultDept": "미화",      // 처리자 담당 카테고리
+  "resultPhone": "010-1111-2222",  // 처리자 연락처
   "resultDate": "2026-04-21 10:00:00"
 }
```

#### 민원 상세 - complain 응답
```diff
 "complain": {
   "id": 1,
+  "complain_by": 2,          // 민원인 member_id
+  "category_id": 6,          // 카테고리 ID
   "title": "...",
   "content": "...",
   "category": "미화",
+  "dept": "총무팀",          // 카테고리 소속 부서
   "location": "...",
-  "status": "접수전/접수/진행중/완료",
+  "status": "접수전/접수/진행중/완료/수정중",
   "date": "...",
   "memberName": "홍길동",
   "memberDept": "총무팀",
+  "resultPersonId": 5,
+  "resultPerson": "김처리"
 }
```

#### 민원 상태 값 추가
```diff
- state: B(접수전), A(접수), P(진행중), D(완료)
+ state: B(접수전), A(접수), P(진행중), D(완료), R(수정중)
```

> 사용자(C)에게는 R(수정중) 상태가 노출되지 않고 이전 상태로 표시됨

---

### 2-3. 신규 API 엔드포인트

#### 수정 요청 관련 (6개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| POST | `/api/complaints/:id/edit-request` | 처리자/관리자 | 수정 요청 제출 |
| GET | `/api/complaints/:id/edit-request` | 전체 | 수정 요청 조회 |
| POST | `/api/complaints/:id/edit-request/approve` | 관리자만 | 수정 요청 승인 |
| POST | `/api/complaints/:id/edit-request/reject` | 관리자만 | 수정 요청 거절 |
| PUT | `/api/complaints/:id/edit-request/complete` | 처리자/관리자 | 수정 완료 |
| GET | `/api/complaints/:id/edit-request/rejection` | 전체 | 거절 사유 조회 |

#### 카테고리 관리 (3개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| POST | `/api/categories` | 관리자만 | 카테고리 등록 |
| PUT | `/api/categories/:id` | 관리자만 | 카테고리 수정 |
| DELETE | `/api/categories/:id` | 관리자만 | 카테고리 삭제 |

#### 푸시 알림 (2개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| POST | `/api/notifications/subscribe` | 전체 | 웹 푸시 구독 등록 |
| POST | `/api/notifications/unsubscribe` | 전체 | 웹 푸시 구독 해제 |

#### 회원 관리 (2개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| PUT | `/api/members/:id/reset-password` | 관리자만 | 비밀번호 초기화 (login_id로) |
| GET | `/api/members/:id/logs` | 관리자만 | 회원 관리 로그 조회 |

#### 이미지 (1개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| DELETE | `/api/uploads/process/:id` | 처리자/관리자 | 처리 이미지 삭제 |

#### 푸시 키 / 헬스체크 (2개)

| 메서드 | 엔드포인트 | 권한 | 설명 |
|--------|-----------|------|------|
| GET | `/api/push/vapid-public-key` | 불필요 | VAPID 공개키 조회 (프론트에서 푸시 구독 시 사용) |
| GET | `/health` | 불필요 | 서버 헬스체크 |

**GET /api/push/vapid-public-key 응답:**
```json
{
  "publicKey": "BNc..."
}
```

**GET /health 응답:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 3. 비즈니스 로직 변경/추가 사항

### 3-1. 민원 상태 변경 시 부가 동작

| 상태 변경 | 추가된 동작 |
|-----------|------------|
| → 접수(A) | `complaint_process` 테이블에 담당자 자동 할당 (process_by = 변경한 처리자) |
| → 진행(P) | `complaint_process.process_at` 시간 업데이트 |
| → 완료(D) | 민원인에게 알림 + 웹 푸시 발송 |
| → 수정중(R) | 수정 요청 제출 시 자동 전환 (API 직접 호출 불가) |
| 모든 변경 | `complain_state_history` 이력 기록 + 민원인에게 알림 + 웹 푸시 발송 |

---

### 3-2. 수정 요청 워크플로우 (신규)

```
처리자 요청 → 민원 상태 R로 변경 → 관리자 알림
                                    ↓
                        ┌─── 승인 ───┐─── 거절 ──┐
                        ↓            ↓           ↓
              분류 항목 변경    담당자변경/기타   이전 상태 복원
              (즉시 완료)     (처리자 완료 필요)  (수정 요청 종료)
                  ↓                ↓
          카테고리 변경        completeEdit API
          접수전(B) 상태       ↓
          처리자 해제       담당자 변경: 새 처리자 + 접수(A)
                           기타: 내용 수정 + 이전 상태 복원
```

---

### 3-3. 알림 발송 로직 (신규)

| 이벤트 | DB 알림 대상 | 웹 푸시 대상 |
|--------|-------------|-------------|
| 민원 등록 | 담당 카테고리 처리자들 | 동일 |
| 상태 변경 (B/A/P/D) | 민원인 | 민원인 |
| 처리 완료 (D) | 민원인 | - |
| 수정 요청 제출 | 관리자 전체 | 관리자 전체 |
| 수정 요청 승인 (분류 변경) | ①처리자 ②민원인 ③새 담당 처리자들 | 전체 대상 |
| 수정 요청 거절 | ①처리자 ②다른 관리자 | 동일 |
| 수정 완료 (담당자 변경) | ①기존 처리자 ②민원인 ③새 처리자 | 동일 |
| 수정 완료 (기타) | ①민원인 ②처리자 | 동일 |

---

### 3-4. 웹 푸시 인프라 (신규)

- **프로토콜**: Web Push (VAPID)
- **패키지**: `web-push`
- **환경변수**: `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- **구독 만료 처리**: 410/404 응답 시 자동 삭제
- **저장소**: `push_subscription` 테이블 (member_id + endpoint 유니크)

---

### 3-5. 민원 상세 접근 권한 변경

원본: 역할별 단순 필터링
현재:
- 사용자(C): 본인 민원만
- 처리자(E): 담당 카테고리 + **아래 조건 중 하나라도 해당하면 접근 허용**
  - `complaint_process`에 본인이 담당자로 등록됨
  - `complaint_edit_requests`에 본인이 요청자로 등록됨
  - `push_notification`에 본인에게 알림이 발송됨
- 관리자(A): 전체

---

### 3-6. 회원 탈퇴 프로세스 변경

원본: 단순 DELETE
현재:
1. 관리자 본인 비밀번호 확인 (req.body.password)
2. bcrypt로 비교
3. 논리적 삭제 (`is_deleted = TRUE, deleted_at = NOW()`)
4. `member_log`에 탈퇴 이력 기록

---

### 3-7. 비밀번호 초기화 (신규)

- 비밀번호를 해당 회원의 `login_id` 값으로 초기화
- bcrypt 해시 후 저장
- `member_log`에 이력 기록 (action: 'P', done_by: 관리자 login_id)

---

### 3-8. 비밀번호 정책 (신규)

#### 회원가입 시 비밀번호 검증
```javascript
// 영어 소문자 포함 필수
const hasLowercase = /[a-z]/.test(password);
// 숫자 포함 필수
const hasNumber = /[0-9]/.test(password);
// 10자 이상
if (!hasLowercase || !hasNumber || password.length < 10) → 400 에러
```

| 정책 | 조건 |
|------|------|
| 최소 길이 | 10자 이상 |
| 영어 소문자 | 1개 이상 필수 |
| 숫자 | 1개 이상 필수 |
| 특수문자 | 제한 없음 (선택) |
| 대문자 | 제한 없음 (선택) |

> 원본 문서 예시 비밀번호 `test1234!` → 8자이므로 현재 정책 위반 (10자 미만)

#### 비밀번호 해싱
- 알고리즘: `bcrypt`
- Salt rounds: 10

#### 비밀번호 초기화 정책
- 관리자가 `PUT /api/members/:id/reset-password` 호출 시 해당 회원의 `login_id` 값으로 초기화
- 초기화 이력이 `member_log`에 기록됨 (action: 'P', done_by: 관리자 login_id)
- 로그인 시 초기화 여부를 자동 감지하여 `password_reset: true` 반환

#### 비밀번호 초기화 감지 로직
```
로그인 시:
1. member_log에서 해당 회원의 마지막 'P'(비밀번호) 로그 조회
2. done_by가 본인 login_id가 아니면 → 관리자가 초기화한 것 → password_reset = true
3. done_by가 본인이면 → 본인이 변경한 것 → password_reset = false
4. 로그 없으면 → password_reset = false
```

---

### 3-9. 로그인 응답 변경

원본 문서 응답:
```json
{
  "message": "로그인 성공",
  "token": "...",
  "member": {
    "member_id": 1,
    "login_id": "hong001",
    "name": "홍길동",
    "role": "C",
    "dept": "총무팀",
    "phone": "010-1234-5678"
  }
}
```

현재 실제 응답:
```json
{
  "message": "로그인 성공",
  "token": "...",
  "member": {
    "member_id": 1,
    "login_id": "hong001",
    "name": "홍길동",
    "role": "C",
    "dept": "총무팀",
    "phone": "010-1234-5678",
    "password_reset": false
  }
}
```

| 필드 | 설명 |
|------|------|
| `password_reset` | **신규 필드** - `true`이면 관리자가 비밀번호를 초기화한 상태 → 프론트에서 비밀번호 변경 유도 필요 |

#### 로그인 오류 응답 변경
| 원본 | 현재 | HTTP 코드 |
|------|------|-----------|
| `"관리자 승인 대기 중입니다."` | `"관리자 승인 대기 중입니다."` | 401 → **403** |

> 미승인 계정 로그인 시도 시 HTTP 코드가 401에서 **403**으로 변경됨

---

### 3-10. JWT 토큰 정책

| 항목 | 값 |
|------|------|
| 만료 시간 | 8시간 (`expiresIn: '8h'`) |
| 페이로드 | `member_id`, `login_id`, `role`, `dept` |
| 시크릿 키 | `.env`의 `JWT_SECRET` |

---

### 3-11. 담당 카테고리 유효성 검증 변경

원본: 하드코딩된 값 (`전체, 건축/영선, 의료장비, 기계/소방, 전기/통신, 보안, 미화`)
현재: **DB에서 동적으로 조회** (`categoryModel.findAll()` → `['전체', ...카테고리명]`)
- 카테고리 추가/삭제 시 유효값이 자동 갱신됨
- 처리자(E) 역할만 변경 가능 (role 체크 추가)

---

## 4. 삭제/변경된 항목 요약

| 항목 | 원본 | 현재 |
|------|------|------|
| 카테고리 "건축/영선" | 있음 | → **"영선"** 으로 변경 |
| 카테고리 "기계/소방" | 하나 | → **"기계"** + **"소방"** 분리 |
| 카테고리 "보안" | 있음 | **삭제됨** |
| 공지사항 카테고리 G 표시 | "안내" | → **"공지"** 로 변경 |
| 민원 삭제 방식 | 물리적 삭제 | **논리적 삭제** (soft delete) |
| 공지사항 삭제 방식 | 물리적 삭제 | **논리적 삭제** (soft delete) |
| 회원 탈퇴 방식 | 단순 삭제 | **비밀번호 확인 + 논리적 삭제** |
| dept 유효값 | 하드코딩 | **DB 동적 조회** |
| 민원 수정/삭제 권한 | 접수전 본인만 | 접수전 본인 + **관리자 상태 무관** |

---

## 5. HTTP 상태 코드 변동 사항

### 5-1. 원본 문서 기준 HTTP 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 찾을 수 없음 |
| 409 | 중복 (이미 존재) |
| 500 | 서버 오류 |

### 5-2. 각 API별 실제 사용되는 HTTP 코드 상세

#### 인증 API
| API | 코드 | 조건 |
|-----|------|------|
| `GET /api/auth/check-id/:login_id` | 200 | 중복 여부 무관 (available 필드로 구분) |
| `POST /api/auth/register` | 201 | 회원가입 성공 |
| | 409 | 아이디 중복 |
| `POST /api/auth/login` | 200 | 로그인 성공 |
| | 401 | 미승인 계정 / 비밀번호 불일치 |
| `POST /api/auth/logout` | 200 | 로그아웃 성공 |
| `GET /api/auth/me` | 200 | 정보 조회 성공 |
| | 401 | 토큰 만료/무효 |

#### 민원 API
| API | 코드 | 조건 |
|-----|------|------|
| `POST /api/complaints` | 201 | 등록 성공 |
| | 400 | 필수 항목 누락 |
| `GET /api/complaints` | 200 | 조회 성공 |
| `GET /api/complaints/:id` | 200 | 조회 성공 |
| | 403 | 접근 권한 없음 (본인 아닌 민원/담당 아닌 카테고리) |
| | 404 | 민원 없음 |
| `PUT /api/complaints/:id` | 200 | 수정 성공 |
| | 400 | 접수전이 아닌 상태에서 사용자가 수정 시도 |
| | 403 | 본인 민원 아님 |
| | 404 | 민원 없음 |
| `DELETE /api/complaints/:id` | 200 | 삭제 성공 |
| | 400 | 접수전이 아닌 상태에서 사용자가 삭제 시도 |
| | 403 | 본인 민원 아님 |
| | 404 | 민원 없음 |
| `PUT /api/complaints/:id/state` | 200 | 상태 변경 성공 |
| | 400 | 유효하지 않은 상태값 |
| | 403 | 사용자(C) 또는 담당 카테고리 아닌 처리자 |
| | 404 | 민원 없음 |
| `POST /api/complaints/:id/process` | 201 | 처리 등록 성공 |
| | 400 | 처리 내용 누락 |
| | 403 | 사용자(C) 또는 담당 카테고리 아닌 처리자 |
| | 404 | 민원 없음 |
| `GET /api/complaints/export` | 200 | 엑셀 파일 응답 (binary) |
| | 403 | 사용자(C) 접근 시 |

#### 수정 요청 API
| API | 코드 | 조건 |
|-----|------|------|
| `POST /api/complaints/:id/edit-request` | 201 | 수정 요청 성공 |
| | 400 | reasonType 누락 / 접수·진행중이 아닌 상태 |
| | 403 | 사용자(C)가 요청 |
| | 404 | 민원 없음 |
| | 409 | 이미 대기 중인 수정 요청 존재 |
| `GET /api/complaints/:id/edit-request` | 200 | 조회 성공 (없으면 `editRequest: null`) |
| `POST /api/complaints/:id/edit-request/approve` | 200 | 승인 성공 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 대기 중인 수정 요청 없음 |
| `POST /api/complaints/:id/edit-request/reject` | 200 | 거절 성공 |
| | 400 | reason 누락 또는 500자 초과 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 대기 중인 수정 요청 없음 |
| `PUT /api/complaints/:id/edit-request/complete` | 200 | 수정 완료 |
| | 400 | 승인된 수정 요청 없음 / 새 처리자 미선택 |
| | 403 | 사용자(C) |
| | 404 | 민원 없음 |
| `GET /api/complaints/:id/edit-request/rejection` | 200 | 조회 성공 (없으면 `rejection: null`) |

#### 카테고리 API
| API | 코드 | 조건 |
|-----|------|------|
| `GET /api/categories` | 200 | 조회 성공 |
| `GET /api/categories/with-total` | 200 | 조회 성공 |
| `POST /api/categories` | 201 | 등록 성공 |
| | 400 | category_name 또는 dept 누락 |
| | 403 | 관리자 아닌 사용자 |
| `PUT /api/categories/:id` | 200 | 수정 성공 |
| | 400 | category_name 또는 dept 누락 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 카테고리 없음 |
| `DELETE /api/categories/:id` | 200 | 삭제 성공 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 카테고리 없음 |

#### 공지사항 API
| API | 코드 | 조건 |
|-----|------|------|
| `GET /api/notices` | 200 | 조회 성공 |
| `GET /api/notices/:id` | 200 | 조회 성공 |
| | 404 | 공지사항 없음 |
| `POST /api/notices` | 201 | 등록 성공 |
| | 400 | 필수 항목 누락 / 유효하지 않은 카테고리 |
| | 403 | 사용자(C) 접근 |
| `PUT /api/notices/:id` | 200 | 수정 성공 |
| | 400 | 필수 항목 누락 / 유효하지 않은 카테고리 |
| | 403 | 작성자 아니며 관리자도 아닌 경우 |
| | 404 | 공지사항 없음 |
| `DELETE /api/notices/:id` | 200 | 삭제 성공 |
| | 403 | 작성자 아니며 관리자도 아닌 경우 |
| | 404 | 공지사항 없음 |

#### 알림 API
| API | 코드 | 조건 |
|-----|------|------|
| `GET /api/notifications` | 200 | 조회 성공 |
| `GET /api/notifications/unread-count` | 200 | 조회 성공 |
| `PUT /api/notifications/:id/read` | 200 | 읽음 처리 성공 |
| | 403 | 본인 알림 아닌 경우 |
| | 404 | 알림 없음 |
| `PUT /api/notifications/read-all` | 200 | 전체 읽음 성공 |
| `POST /api/notifications/subscribe` | 201 | 구독 등록 성공 |
| | 400 | 구독 정보 올바르지 않음 |
| `POST /api/notifications/unsubscribe` | 200 | 구독 해제 성공 |
| | 400 | endpoint 누락 |

#### 이미지 업로드 API
| API | 코드 | 조건 |
|-----|------|------|
| `POST /api/uploads/complain` | 201 | 업로드 성공 |
| | 400 | complain_id 누락 / 이미지 없음 / 10장 초과 |
| `POST /api/uploads/process` | 201 | 업로드 성공 |
| | 400 | process_id 누락 / 이미지 없음 / 10장 초과 |
| `DELETE /api/uploads/complain/:id` | 200 | 삭제 성공 |
| | 403 | 본인 민원 아니며 관리자도 아닌 경우 |
| | 404 | 이미지 없음 |
| `DELETE /api/uploads/process/:id` | 200 | 삭제 성공 |
| | 403 | 사용자(C) 접근 |
| | 404 | 이미지 없음 |

#### 회원 API
| API | 코드 | 조건 |
|-----|------|------|
| `GET /api/members` | 200 | 조회 성공 |
| | 403 | 관리자 아닌 사용자 |
| `PUT /api/members/me` | 200 | 수정 성공 |
| | 400 | 수정할 항목 없음 |
| | 404 | 회원 없음 |
| `GET /api/members/:id/profile` | 200 | 조회 성공 |
| | 404 | 회원 없음 |
| `GET /api/members/:id/logs` | 200 | 조회 성공 |
| | 403 | 관리자 아닌 사용자 |
| `PUT /api/members/:id/approve` | 200 | 승인 성공 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 회원 없음 |
| | 409 | 이미 승인된 회원 |
| `PUT /api/members/:id/role` | 200 | 변경 성공 |
| | 400 | 유효하지 않은 권한값 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 회원 없음 |
| `PUT /api/members/:id/dept` | 200 | 변경 성공 |
| | 400 | 유효하지 않은 카테고리 / 처리자가 아닌 회원 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 회원 없음 |
| `PUT /api/members/:id/reset-password` | 200 | 초기화 성공 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 회원 없음 |
| `DELETE /api/members/:id` | 200 | 탈퇴 성공 |
| | 400 | 비밀번호 미입력 |
| | 401 | 관리자 비밀번호 불일치 |
| | 403 | 관리자 아닌 사용자 |
| | 404 | 회원 없음 |

---

## 6. 환경 설정 추가 사항

### .env 환경변수 (신규)
```
VAPID_SUBJECT=mailto:admin@caufix.com
VAPID_PUBLIC_KEY=<VAPID 공개키>
VAPID_PRIVATE_KEY=<VAPID 비밀키>
```

### 추가 npm 패키지
| 패키지 | 용도 |
|--------|------|
| `web-push` | 웹 푸시 알림 발송 (VAPID) |
| `exceljs` | 민원 엑셀 다운로드 생성 |
| `bcrypt` | 비밀번호 해시/검증 |
| `multer` | 이미지 업로드 처리 |
