# 시설팀 민원 앱 API DOCUMENTATION

---

## 📌 기본 설정

### Base URL
```
개발: http://localhost
운영: https://[운영서버 도메인]
```

### 인증 방법
로그인 후 발급받은 JWT 토큰을 모든 요청 헤더에 포함해주세요.
```
Authorization: Bearer {token}
```

### 토큰 저장
```javascript
// 로그인 성공 시 localStorage에 저장
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.member));

// 요청 시 토큰 가져오기
const token = localStorage.getItem('token');
```

#### 백엔드(JWT 토큰) 로그인 유지 토큰 만료 기간
> - 체크 시 : 14일 
> - 미체크 시 : 8시간

#### 프론트엔드 (login.js) 페이지 로그인 유지
> - 활성화 : 앱 재진입 시 토큰 검증 후 자동으로 대시보드 이동
> - 비활성화 : 앱 재진입 시 토큰/유저 정보 삭제 -> 로그인 페이지 표시

---

## 📌 공통 응답 형식

### 성공
```json
{
  "message": "성공 메시지",
  "data": { ... }
}
```

### 실패
```json
{
  "message": "오류 메시지"
}
```

### HTTP 상태 코드
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

---

## 📌 연동 순서 가이드

```
1단계: 로그인 / 회원가입
2단계: 카테고리 목록 조회
3단계: 민원 목록 / 등록 / 상세
4단계: 수정 요청 (처리자 → 관리자 승인)
5단계: 공지사항
6단계: 알림 / 웹 푸시
7단계: 내 정보 수정
8단계: 관리자 기능 (회원 관리, 카테고리 관리)
```

---

## 1️⃣ 인증 API

### 아이디 중복 확인
```
GET /api/auth/check-id/:login_id
인증: 불필요
```

**응답**
```json
{
  "available": true,
  "message": "사용 가능한 아이디입니다."
}
```
```json
{
  "available": false,
  "message": "이미 사용 중인 아이디입니다."
}
```

---

### 회원가입
```
POST /api/auth/register
인증: 불필요
```

**요청 바디**
```json
{
  "login_id": "hong001",
  "password": "test1234!",
  "name": "홍길동",
  "role": "C",
  "dept": "총무팀",
  "phone": "010-1234-5678"
}
```

> role: `C` (사용자), `E` (처리자)
> 처리자(E) 가입 시 dept는 카테고리 목록 API(`GET /api/categories/with-total`)에서 가져온 값 사용
> **비밀번호 정책**: 영어 소문자 + 숫자 포함, 10자 이상 필수

**응답**
```json
{
  "message": "회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.",
  "member": {
    "member_id": 1,
    "login_id": "hong001",
    "name": "홍길동",
    "role": "C",
    "dept": "총무팀",
    "phone": "010-1234-5678",
    "is_approved": false
  }
}
```

---

### 로그인
```
POST /api/auth/login
인증: 불필요
```

**요청 바디**
```json
{
  "login_id": "hong001",
  "password": "test1234!",
  "auto_login": true
}
```

> `auto_login`: 선택 항목. `true`이면 토큰 만료 14일, `false`이거나 미전송 시 8시간

**응답**
```json
{
  "message": "로그인 성공",
  "token": "eyJhbGci...",
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

> 로그인 성공 시 `token`과 `member`를 localStorage에 저장해주세요.
> `password_reset`이 `true`이면 관리자가 비밀번호를 초기화한 상태이므로, 비밀번호 변경을 유도해주세요.


**오류 케이스**
```json
{ "message": "관리자 승인 대기 중입니다." }  // 미승인 계정 (403)
{ "message": "아이디 또는 비밀번호가 올바르지 않습니다." }  // 401
```

---

### 로그아웃
```
POST /api/auth/logout
인증: 필요
```

> 서버에 요청 후 localStorage에서 `token`, `user` 삭제해주세요.
```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---

### 내 정보 조회
```
GET /api/auth/me
인증: 필요
```

**응답**
```json
{
  "member": {
    "member_id": 1,
    "login_id": "hong001",
    "name": "홍길동",
    "role": "C",
    "dept": "총무팀",
    "phone": "010-1234-5678",
    "is_approved": true
  }
}
```

---

## 2️⃣ 카테고리 API

### 카테고리 목록 조회 (민원 등록용 - 전체 제외)
```
GET /api/categories
인증: 불필요
```

**응답**
```json
{
  "categories": [
    { "category_id": 1, "category_name": "영선", "dept": "시설팀" },
    { "category_id": 2, "category_name": "기계", "dept": "시설팀" },
    { "category_id": 3, "category_name": "소방", "dept": "시설팀" },
    { "category_id": 4, "category_name": "전기/통신", "dept": "시설팀" },
    { "category_id": 5, "category_name": "의료장비", "dept": "물류관리팀" },
    { "category_id": 6, "category_name": "미화", "dept": "총무팀" }
  ]
}
```

---

### 카테고리 목록 조회 (처리자 가입용 - 전체 포함)
```
GET /api/categories/with-total
인증: 불필요
```

**응답**
```json
{
  "categories": [
    { "category_id": 0, "category_name": "전체", "dept": null },
    { "category_id": 1, "category_name": "영선", "dept": "시설팀" },
    { "category_id": 2, "category_name": "기계", "dept": "시설팀" },
    { "category_id": 3, "category_name": "소방", "dept": "시설팀" },
    { "category_id": 4, "category_name": "전기/통신", "dept": "시설팀" },
    { "category_id": 5, "category_name": "의료장비", "dept": "물류관리팀" },
    { "category_id": 6, "category_name": "미화", "dept": "총무팀" }
  ]
}
```

---

## 3️⃣ 민원 API

### 민원 목록 조회
```
GET /api/complaints
인증: 필요
```

> 역할에 따라 자동으로 필터링됩니다.
> - 사용자(C): 본인 민원만
> - 처리자(E): 담당 카테고리 민원만 (dept가 '전체'이면 전체 민원)
> - 관리자(A): 전체 민원

**쿼리 파라미터 (선택)**
```
?category=미화
?status=접수전
?startDate=2026-04-01
?endDate=2026-04-30
?category=미화&status=완료&startDate=2026-04-01&endDate=2026-04-30
```

**응답**
```json
{
  "complaints": [
    {
      "id": 1,
      "title": "1층 화장실 청소 요청",
      "content": "1층 화장실이 지저분합니다.",
      "category": "미화",
      "location": "본관 1층 화장실",
      "status": "접수전",
      "date": "2026-04-20 15:40:06.491771",
      "memberName": "홍길동",
      "memberDept": "총무팀",
      "resultPersonId": 5,
      "resultPerson": "김처리"
    }
  ]
}
```

> `resultPersonId`: 처리 담당자 member_id (미할당 시 null)
> `resultPerson`: 처리 담당자 이름 (미할당 시 null)

---

### 민원 상세 조회
```
GET /api/complaints/:id
인증: 필요
```

**접근 권한:**
- 사용자(C): 본인 민원만 조회 가능
- 처리자(E): 담당 카테고리 민원 + 본인이 처리 담당자/수정 요청자/알림 수신자인 민원
- 관리자(A): 전체

> 사용자(C)에게는 '수정중(R)' 상태가 노출되지 않고, 이전 상태(접수/진행중)로 표시됩니다.

**응답**
```json
{
  "complain": {
    "id": 1,
    "complain_by": 2,
    "category_id": 6,
    "title": "1층 화장실 청소 요청",
    "content": "1층 화장실이 지저분합니다.",
    "category": "미화",
    "location": "본관 1층 화장실",
    "status": "접수전",
    "date": "2026-04-20 15:40:06.491771",
    "memberName": "홍길동",
    "memberDept": "총무팀",
    "resultPersonId": 5,
    "resultPerson": "김처리"
  },
  "process": {
    "process_id": 1,
    "process_by": 5,
    "result": "청소 완료하였습니다.",
    "resultPerson": "김처리",
    "resultDept": "미화",
    "resultPhone": "010-1111-2222",
    "resultDate": "2026-04-21 10:00:00"
  },
  "images": [
    { "id": 1, "url": "/uploads/complain/complain_xxx.jpg", "order": 1, "size": 12345 }
  ],
  "processImages": [
    { "id": 1, "url": "/uploads/process/process_xxx.jpg", "order": 1, "size": 12345 }
  ],
  "canAccept": true
}
```

> `process`가 `null`이면 아직 처리되지 않은 민원입니다.
> 이미지 URL 접근: `http://localhost/uploads/complain/파일명`
> `canAccept`: 현재 로그인한 사용자가 이 민원을 접수(상태 변경)할 수 있는지 여부 (처리자는 담당 카테고리 일치 시 true, 관리자는 항상 true, 사용자는 항상 false)
> process 필드 설명:
> - `process_by`: 처리자 member_id
> - `resultDept`: 처리자 담당 카테고리
> - `resultPhone`: 처리자 연락처

---

### 민원 등록
```
POST /api/complaints
인증: 필요
```

**요청 바디**
```json
{
  "category_id": 6,
  "title": "1층 화장실 청소 요청",
  "content": "1층 화장실이 지저분합니다.",
  "location": "본관 1층 화장실"
}
```

**응답**
```json
{
  "message": "민원이 등록되었습니다.",
  "complain": {
    "id": 1,
    "title": "1층 화장실 청소 요청",
    "status": "접수전",
    "date": "2026-04-20 15:40:06"
  }
}
```

> 민원 등록 후 이미지가 있으면 `POST /api/uploads/complain`으로 업로드해주세요.
> 등록 시 해당 카테고리 담당 처리자들에게 알림 + 웹 푸시가 자동 발송됩니다.

---

### 민원 수정
```
PUT /api/complaints/:id
인증: 필요
```

**권한:**
- 사용자(C): 접수전 상태의 본인 민원만 수정 가능
- 관리자(A): 상태 무관하게 수정 가능

**요청 바디**
```json
{
  "category_id": 6,
  "title": "수정된 제목",
  "content": "수정된 내용",
  "location": "수정된 장소"
}
```

---

### 민원 삭제
```
DELETE /api/complaints/:id
인증: 필요
```

**권한:**
- 사용자(C): 접수전 상태의 본인 민원만 삭제 가능
- 관리자(A): 상태 무관하게 삭제 가능

> 실제 데이터는 삭제되지 않고 논리적 삭제(soft delete) 처리됩니다.

**응답**
```json
{
  "message": "민원이 삭제되었습니다."
}
```

---

### 민원 상태 변경 (처리자/관리자)
```
PUT /api/complaints/:id/state
인증: 필요 (처리자/관리자만)
```

**요청 바디**
```json
{
  "state": "A"
}
```

> state 값: `B`(접수전), `A`(접수), `P`(진행중), `D`(완료), `R`(수정중)
> - 접수(A) 시: 해당 처리자가 자동으로 담당자로 할당됩니다.
> - 진행(P) 시: 처리 시간이 기록됩니다.
> - 상태 변경 시 민원인에게 알림 + 웹 푸시가 자동 발송됩니다.
> - 상태 변경 이력이 `complain_state_history` 테이블에 기록됩니다.

---

### 민원 처리 등록 (처리자/관리자)
```
POST /api/complaints/:id/process
인증: 필요 (처리자/관리자만)
```

**요청 바디**
```json
{
  "process_content": "청소 완료하였습니다."
}
```

> 처리 등록 시 민원 상태가 자동으로 `완료(D)`로 변경됩니다.
> 민원인에게 완료 알림이 자동 발송됩니다.
> 이미 접수 시 할당된 process가 있으면 내용만 업데이트됩니다.

---

### 민원 엑셀 다운로드 (관리자)
```
GET /api/complaints/export
인증: 필요 (관리자만)
```

**쿼리 파라미터 (선택)**
```
?category=미화
?status=접수전
?startDate=2026-04-01
?endDate=2026-04-30
?category=미화&status=완료&startDate=2026-04-01&endDate=2026-04-30
```

> 모든 필터 조합 가능합니다.
> 엑셀 파일에 이미지 URL 컬럼이 포함됩니다.

**프론트 구현 예시**
```javascript
const handleExcelDownload = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(
    '/api/complaints/export?startDate=2026-04-01&endDate=2026-04-30',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = response.headers.get('Content-Disposition');
  const filename = decodeURIComponent(disposition.split("filename*=UTF-8''")[1]);
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

---

## 4️⃣ 수정 요청 API

> 처리자가 접수/진행중 상태의 민원에 대해 수정을 요청하고, 관리자가 승인/거절하는 워크플로우입니다.
> 수정 요청 시 민원 상태가 `R(수정중)`로 변경됩니다.

### 수정 요청 제출 (처리자)
```
POST /api/complaints/:id/edit-request
인증: 필요 (처리자/관리자만)
```

**요청 바디**
```json
{
  "reasonType": "분류 항목 변경",
  "detail": "전기/통신"
}
```

> reasonType 값: `분류 항목 변경`, `처리 담당자 변경`, `기타`
> detail: 분류 항목 변경 시 새 카테고리명, 기타 시 상세 내용
> 접수 또는 진행중 상태의 민원만 요청 가능
> 이미 대기 중인 수정 요청이 있으면 409 에러
> 요청 시 민원 상태가 R(수정중)로 변경되고, 관리자에게 알림 발송됨
> 수정중 상태는 민원인에게 알림 가지 않음

**응답**
```json
{
  "message": "수정 요청이 완료되었습니다.",
  "editRequest": {
    "id": 1,
    "complaint_id": 3,
    "requester_id": 5,
    "reason_type": "분류 항목 변경",
    "detail": "전기/통신",
    "status": "P",
    "prev_state": "A",
    "created_at": "2026-05-01 10:00:00"
  }
}
```

---

### 수정 요청 조회 (처리자, 관리자)
```
GET /api/complaints/:id/edit-request
인증: 필요
```

> 해당 민원의 활성(PENDING 또는 APPROVED) 수정 요청을 조회합니다.

**응답**
```json
{
  "editRequest": {
    "id": 1,
    "complaintId": 3,
    "requesterId": 5,
    "requesterName": "김처리",
    "reasonType": "분류 항목 변경",
    "detail": "전기/통신",
    "status": "P",
    "prevState": "A",
    "createdAt": "2026-05-01 10:00:00"
  }
}
```

> 활성 수정 요청이 없으면: `{ "editRequest": null }`

---

### 수정 요청 승인 (관리자)
```
POST /api/complaints/:id/edit-request/approve
인증: 필요 (관리자만)
```

> 관리자가 수정 요청을 승인하고 사유에 따라 처리를 완료합니다.

**사유별 처리 방식:**

#### 1. 분류 항목 변경
승인 시 즉시 처리가 완료됩니다. (별도 complete API 호출 불필요)
- 카테고리 변경 + 접수전(B) 상태 + 기존 처리자 해제

#### 2. 처리 담당자 변경
승인 후 `PUT /api/complaints/:id/edit-request/complete` 호출이 필요합니다.

**complete 요청 바디:**
```json
{
  "new_processor_id": 7
}
```
> 새 처리자로 교체 + 접수(A) 상태로 변경됨

#### 3. 기타 (내용 수정)
승인 후 `PUT /api/complaints/:id/edit-request/complete` 호출이 필요합니다.

**complete 요청 바디:**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "location": "수정된 장소",
  "category_id": 3
}
```
> 민원 내용 수정 + 이전 상태로 복원됨
> 모든 필드 선택적 (변경할 필드만 전달)

**승인 응답**
```json
{
  "message": "수정 요청이 승인되었습니다.",
  "editRequest": {
    "id": 1,
    "complaintId": 3,
    "requesterId": 5,
    "requesterName": "김처리",
    "reasonType": "분류 항목 변경",
    "detail": "전기/통신",
    "status": "A"
  }
}
```

**complete 응답**
```json
{
  "message": "민원 수정이 완료되었습니다.",
  "complaint": {
    "id": 3,
    "title": "수정된 제목",
    "status": "접수",
    "..."
  }
}
```

> 수정 이력(before/after 스냅샷)이 `complaint_edit_history` 테이블에 자동 기록됩니다.
> **알림 발송:**
> - 분류 항목 변경: 처리자("승인됨"), 민원인("분류 항목 변경됨"), 새 카테고리 담당자들("새 민원 접수")
> - 담당자 변경: 기존 처리자, 민원인, 새 처리자에게 알림
> - 기타: 민원인, 처리자에게 알림

---

### 수정 요청 반려 (관리자)
```
POST /api/complaints/:id/edit-request/reject
인증: 필요 (관리자만)
```

**요청 바디**
```json
{
  "reason": "해당 사유가 적합하지 않습니다."
}
```

> reason: 1~50자 필수
> 거절 시 민원 상태가 이전 상태로 복원됩니다.
> 처리자 + 다른 관리자에게 반려 알림이 발송됩니다.

**응답**
```json
{
  "message": "수정 요청이 반려되었습니다."
}
```

---

### 반려 사유 조회
```
GET /api/complaints/:id/edit-request/rejection
인증: 필요
```

**응답**
```json
{
  "rejection": {
    "reason": "해당 사유가 적합하지 않습니다.",
    "reviewerName": "관리자",
    "reviewedAt": "2026-05-01 11:00:00"
  }
}
```

> 반려 이력이 없으면: `{ "rejection": null }`

---

## 5️⃣ 이미지 업로드 API

### 민원 이미지 업로드
```
POST /api/uploads/complain
인증: 필요
Content-Type: multipart/form-data
```

**요청 (form-data)**
```
complain_id: 1
images: [파일1, 파일2, ...]  // 최대 10장
```

> 기존 이미지 + 새로 업로드하는 이미지 합쳐서 최대 10장까지 가능합니다.

**프론트 구현 예시**
```javascript
const formData = new FormData();
formData.append('complain_id', complainId);
images.forEach(img => formData.append('images', img.file));

const response = await fetch('/api/uploads/complain', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

**응답**
```json
{
  "message": "이미지가 업로드되었습니다.",
  "images": [
    {
      "complain_img_id": 1,
      "complain_img_url": "/uploads/complain/complain_xxx.jpg",
      "complain_img_order": 1,
      "complain_img_size": 12345
    }
  ]
}
```

---

### 민원 이미지 삭제
```
DELETE /api/uploads/complain/:id
인증: 필요
```

> 본인 민원의 이미지 또는 관리자만 삭제 가능합니다.

**응답**
```json
{
  "message": "이미지가 삭제되었습니다."
}
```

---

### 처리 이미지 업로드
```
POST /api/uploads/process
인증: 필요 (처리자/관리자만)
Content-Type: multipart/form-data
```

**요청 (form-data)**
```
process_id: 1
images: [파일1, 파일2, ...]  // 최대 10장
```

**응답**
```json
{
  "message": "이미지가 업로드되었습니다.",
  "images": [
    {
      "process_img_id": 1,
      "process_img_url": "/uploads/process/process_xxx.jpg",
      "process_img_order": 1,
      "process_img_size": 12345
    }
  ]
}
```

---

### 처리 이미지 삭제
```
DELETE /api/uploads/process/:id
인증: 필요 (처리자/관리자만)
```

**응답**
```json
{
  "message": "이미지가 삭제되었습니다."
}
```

---

## 6️⃣ 공지사항 API

### 공지사항 목록 조회
```
GET /api/notices
인증: 필요
```

**응답**
```json
{
  "notices": [
    {
      "id": 1,
      "title": "시스템 점검 안내",
      "category": "점검",
      "content": "점검 내용...",
      "author": "홍길동",
      "date": "2026-04-20 13:26:31"
    }
  ]
}
```

> category 값: `공지`(G), `업데이트`(U), `점검`(F)

---

### 공지사항 상세 조회
```
GET /api/notices/:id
인증: 필요
```

---

### 공지사항 등록 (관리자)
```
POST /api/notices
인증: 필요 (관리자만)
```

**요청 바디**
```json
{
  "notice_title": "시스템 점검 안내",
  "notice_category": "F",
  "notice_content": "점검 내용..."
}
```

> notice_category: `G`(공지), `U`(업데이트), `F`(점검)

---

### 공지사항 수정 (관리자)
```
PUT /api/notices/:id
인증: 필요 (관리자만)
```

---

### 공지사항 삭제 (관리자)
```
DELETE /api/notices/:id
인증: 필요 (관리자만)
```

---

## 7️⃣ 알림 API

### 알림 목록 조회
```
GET /api/notifications
인증: 필요
```

**응답**
```json
{
  "notifications": [
    {
      "id": 1,
      "complainId": 3,
      "title": "1층 화장실 청소 요청",
      "content": "\"1층 화장실 청소 요청\"이(가) 완료 처리되었습니다.",
      "state": "완료",
      "read": false,
      "readAt": null,
      "time": "2026-04-20 16:22:26"
    }
  ],
  "unreadCount": 1
}
```

> 최근 7일치 알림만 반환됩니다.
> `unreadCount`를 상단 벨 아이콘 뱃지에 표시해주세요.
> state 값: `접수전`, `접수`, `진행중`, `완료`, `수정중`

---

### 읽지 않은 알림 수 조회 (벨 아이콘 뱃지용)
```
GET /api/notifications/unread-count
인증: 필요
```

**응답**
```json
{
  "unreadCount": 3
}
```

---

### 알림 읽음 처리 (알림 클릭 시)
```
PUT /api/notifications/:id/read
인증: 필요
```

> 본인 알림만 읽음 처리 가능합니다.

**응답**
```json
{
  "message": "읽음 처리되었습니다."
}
```

---

### 전체 읽음 처리
```
PUT /api/notifications/read-all
인증: 필요
```

**응답**
```json
{
  "message": "전체 읽음 처리되었습니다."
}
```

---

### 푸시 구독 등록
```
POST /api/notifications/subscribe
인증: 필요
```

**요청 바디**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "BNc...",
      "auth": "tB..."
    }
  }
}
```

**응답**
```json
{
  "message": "푸시 알림이 등록되었습니다."
}
```

**프론트 구현 예시**
```javascript
// Service Worker 등록 후 푸시 구독
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});

await fetch('/api/notifications/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ subscription })
});
```

---

### 푸시 구독 해제
```
POST /api/notifications/unsubscribe
인증: 필요
```

**요청 바디**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

**응답**
```json
{
  "message": "푸시 알림이 해제되었습니다."
}
```

---

## 8️⃣ 회원 API

### 내 정보 수정 (비밀번호, 전화번호, 부서)
```
PUT /api/members/me
인증: 필요
```

**요청 바디**
```json
{
  "phone": "010-9999-8888"
}
```
```json
{
  "password": "newpass1234!",
  "phone": "010-9999-8888",
  "dept": "미화"
}
```

> 비밀번호, 전화번호, 부서 중 하나 이상 입력 필수.
> 각각 선택적으로 수정 가능합니다.

**응답**
```json
{
  "message": "내 정보가 수정되었습니다.",
  "member": {
    "member_id": 1,
    "login_id": "hong001",
    "name": "홍길동",
    "role": "C",
    "dept": "미화",
    "phone": "010-9999-8888",
    "is_approved": true,
    "created_at": "2026-04-01 09:00:00"
  }
}
```

---

### 처리자 프로필 조회 (민원 상세에서 처리자 이름 클릭 시)
```
GET /api/members/:id/profile
인증: 필요
```

**응답**
```json
{
  "profile": {
    "name": "김처리",
    "dept": "미화",
    "phone": "010-1111-2222"
  }
}
```

---

### 회원 목록 조회 (관리자만)
```
GET /api/members
인증: 필요 (관리자만)
```

**응답**
```json
{
  "members": [
    {
      "member_id": 1,
      "login_id": "hong001",
      "name": "홍길동",
      "role": "C",
      "dept": "총무팀",
      "phone": "010-1234-5678",
      "is_approved": true,
      "created_at": "2026-04-01 09:00:00",
      "last_login_at": "2026-04-20 10:00:00"
    }
  ]
}
```

---

### 회원 승인 (관리자)
```
PUT /api/members/:id/approve
인증: 필요 (관리자만)
```

**응답**
```json
{
  "message": "승인이 완료되었습니다.",
  "member": {
    "member_id": 5,
    "login_id": "kim001",
    "name": "김처리",
    "role": "E",
    "is_approved": true
  }
}
```

---

### 권한 변경 (관리자)
```
PUT /api/members/:id/role
인증: 필요 (관리자만)
```

**요청 바디**
```json
{
  "role": "E"
}
```

> role: `C`(사용자), `E`(처리자), `A`(관리자)

**응답**
```json
{
  "message": "권한이 변경되었습니다.",
  "member": {
    "member_id": 5,
    "login_id": "kim001",
    "name": "김처리",
    "role": "E",
    "dept": "미화"
  }
}
```

---

### 담당 카테고리 변경 (관리자)
```
PUT /api/members/:id/dept
인증: 필요 (관리자만)
```

**요청 바디**
```json
{
  "dept": "전체"
}
```

> dept 값: `전체`, `영선`, `기계`, `소방`, `전기/통신`, `의료장비`, `미화` (DB에서 동적으로 유효성 검사)
> 처리자(E)만 담당 카테고리 변경 가능

**응답**
```json
{
  "message": "담당 카테고리가 변경되었습니다.",
  "member": {
    "member_id": 5,
    "login_id": "kim001",
    "name": "김처리",
    "role": "E",
    "dept": "전체",
    "phone": "010-1111-2222",
    "is_approved": true
  }
}
```

---

### 비밀번호 초기화 (관리자)
```
PUT /api/members/:id/reset-password
인증: 필요 (관리자만)
```

> 비밀번호가 해당 회원의 `login_id` 값으로 초기화됩니다.

**응답**
```json
{
  "message": "비밀번호가 초기화되었습니다."
}
```

---

### 회원 로그 조회 (관리자)
```
GET /api/members/:id/logs
인증: 필요 (관리자만)
```

**응답**
```json
{
  "logs": [
    {
      "id": 1,
      "member_id": 5,
      "action": "A",
      "done_by": "admin001",
      "detail": null,
      "created_at": "2026-04-20 10:00:00"
    }
  ]
}
```

> action 값:
> - `A`: 승인
> - `R`: 권한 변경 (detail에 "C → E" 형태로 기록)
> - `P`: 비밀번호 초기화/변경
> - `D`: 탈퇴

---

### 회원 탈퇴 처리 (관리자)
```
DELETE /api/members/:id
인증: 필요 (관리자만)
```

**요청 바디**
```json
{
  "password": "admin_password"
}
```

> 관리자 본인 비밀번호 확인 후 탈퇴 처리됩니다.
> 논리적 삭제(soft delete)로 처리되며 데이터는 보존됩니다.

**응답**
```json
{
  "message": "탈퇴 처리가 완료되었습니다."
}
```

---

## 📌 필드명 매핑표

### 민원 필드명
| 백엔드 DB | API 응답 (프론트용) |
|----------|------------------|
| complain_id | id |
| complain_by | complain_by |
| category_id | category_id |
| complain_title | title |
| complain_content | content |
| category_name | category |
| state (B/A/P/D/R) | status (접수전/접수/진행중/완료/수정중) |
| complain_at | date |
| process_content | result |
| process_by (member_id) | process_by |
| process_by_name | resultPerson |
| process_dept | resultDept |
| process_phone | resultPhone |
| process_at | resultDate |
| is_deleted | is_deleted |

### 공지사항 필드명
| 백엔드 DB | API 응답 (프론트용) |
|----------|------------------|
| notice_id | id |
| notice_title | title |
| notice_category (G/U/F) | category (공지/업데이트/점검) |
| notice_content | content |
| author_name | author |
| noticed_at | date |

### 알림 필드명
| 백엔드 DB | API 응답 (프론트용) |
|----------|------------------|
| push_id | id |
| complain_id | complainId |
| complain_title | title |
| push_content | content |
| state (B/A/P/D/R) | state (접수전/접수/진행중/완료/수정중) |
| is_read | read |
| read_at | readAt |
| push_at | time |

### 수정 요청 필드명
| 백엔드 DB | API 응답 (프론트용) |
|----------|------------------|
| id | id |
| complaint_id | complaintId |
| requester_id | requesterId |
| requester_name (JOIN) | requesterName |
| reason_type | reasonType |
| detail | detail |
| status (P/A/R/C) | status |
| prev_state | prevState |
| created_at | createdAt |

> 수정 요청 status 값: `P`(대기중), `A`(승인), `R`(거절), `C`(완료)

---

## 📌 권한별 접근 가능 API

| API | 사용자(C) | 처리자(E) | 관리자(A) |
|-----|----------|----------|----------|
| 로그인/회원가입 | ✅ | ✅ | ✅ |
| 민원 등록 | ✅ | ✅ | ✅ |
| 민원 목록 조회 | 본인만 | 담당 카테고리 | 전체 |
| 민원 수정/삭제 | 접수전 본인만 | ❌ | 상태 무관 ✅ |
| 민원 상태 변경 | ❌ | ✅ | ✅ |
| 민원 처리 등록 | ❌ | ✅ | ✅ |
| 엑셀 다운로드 | ❌ | ❌ | ✅ |
| 수정 요청 제출 | ❌ | ✅ | ✅ |
| 수정 요청 조회 | ❌ | ✅ | ✅ |
| 수정 요청 승인/거절/완료 | ❌ | ❌ | ✅ |
| 거절 사유 조회 | ❌ | ✅ | ✅ |
| 공지사항 조회 | ✅ | ✅ | ✅ |
| 공지사항 등록 | ❌ | ❌ | ✅ |
| 공지사항 수정/삭제 | ❌ | ❌ | ✅ |
| 알림 조회 | ✅ | ✅ | ✅ |
| 푸시 구독/해제 | ✅ | ✅ | ✅ |
| 내 정보 수정 | ✅ | ✅ | ✅ |
| 비밀번호 초기화 | ❌ | ❌ | ✅ |
| 회원 로그 조회 | ❌ | ❌ | ✅ |
| 회원 승인/권한변경/탈퇴 | ❌ | ❌ | ✅ |
| 처리 이미지 삭제 | ❌ | 본인만 | ✅ |
| 민원 이미지 삭제 | 본인만 | ❌ | ✅ |

---

## 📌 알림 발송 규칙

| 이벤트 | 알림 대상 | 알림 내용 |
|--------|----------|----------|
| 민원 등록 | 담당 카테고리 처리자들 | "새 민원이 접수되었습니다" |
| 민원 상태 변경 | 민원인 | "{민원 제목}이(가) {상태} 처리되었습니다." |
| 민원 처리 완료 | 민원인 | "{민원 제목}이(가) 완료 처리되었습니다." |
| 수정 요청 제출 | 관리자 전체 | "{처리자명}님이 수정을 요청했습니다." |
| 수정 요청 승인 (분류 변경) | 처리자, 민원인, 새 담당자들 | 대상별 다른 메시지 |
| 수정 요청 거절 | 처리자 + 다른 관리자 | "민원 수정 요청이 반려 되었습니다." |
| 수정 완료 (담당자 변경) | 기존 처리자, 민원인, 새 처리자 | 대상별 다른 메시지 |
| 수정 완료 (기타) | 민원인, 처리자 | 대상별 다른 메시지 |

> 모든 알림은 DB 저장 + 웹 푸시(Web Push) 동시 발송됩니다.

---

## 📌 기타 API

### VAPID 공개키 조회 (푸시 구독 시 사용)
```
GET /api/push/vapid-public-key
인증: 불필요
```

**응답**
```json
{
  "publicKey": "BNc..."
}
```

> 프론트에서 `pushManager.subscribe()`의 `applicationServerKey`에 이 값을 사용합니다.

---

### 헬스체크
```
GET /health
인증: 불필요
```

**응답**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```
