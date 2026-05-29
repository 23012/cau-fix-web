# Design Document

## Overview

처리자 수정 요청 기능은 민원 처리자가 이미 접수/진행 중인 민원의 내용 수정을 관리자에게 요청하고, 관리자가 이를 승인 또는 거절할 수 있는 워크플로우를 제공한다. 승인 후 처리자가 실제 민원을 수정하면 변경 전후 스냅샷이 이력으로 기록된다.

## Architecture

처리자 수정 요청 기능은 기존 민원 관리 시스템의 아키텍처(React 19 + Node.js/Express + PostgreSQL)를 그대로 따르며, 기존 editRequestModel/Controller에 관리자 승인/거절 및 수정 이력 기록 기능을 확장한다.

### 시스템 흐름

```
[처리자] → 수정 요청 제출 → [Backend API] → complaint_edit_requests 저장 + 상태 'R' 변경
                                            → 관리자 알림 (In-App + Web Push)

[관리자] → 승인/거절 → [Backend API] → complaint_edit_request_reviews 저장
                                      → Edit_Request 상태 업데이트
                                      → 승인: 상태 유지 'R' (수정 대기)
                                      → 거절: 상태 복원 (이전 상태)
                                      → 처리자/민원인 알림

[처리자] → 민원 수정 (승인 후) → [Backend API] → complaint_edit_history 저장 (before/after)
                                              → Edit_Request 상태 'COMPLETED'
                                              → 민원 상태 복원 (이전 상태)
```

## Components and Interfaces

### Backend Components

#### 1. editRequestModel.js (확장)

기존 모델에 다음 기능 추가:
- `findById(id)` — 수정 요청 단건 조회
- `updateStatus(id, status)` — 수정 요청 상태 변경
- `findAllPending()` — 전체 PENDING 수정 요청 목록 (관리자용)

#### 2. editReviewModel.js (신규)

`complaint_edit_request_reviews` 테이블 CRUD:
- `create({ edit_request_id, reviewer_id, decision, reject_reason })` — 리뷰 레코드 생성
- `findByEditRequestId(edit_request_id)` — 특정 수정 요청의 리뷰 조회

#### 3. editHistoryModel.js (신규)

`complaint_edit_history` 테이블 CRUD:
- `create({ edit_request_id, complaint_id, changed_by, before_data, after_data })` — 이력 레코드 생성
- `findByComplaintId(complaint_id)` — 특정 민원의 수정 이력 조회

#### 4. editRequestController.js (확장)

기존 컨트롤러에 다음 엔드포인트 추가:
- `approve` — 관리자 승인 처리
- `reject` — 관리자 거절 처리
- `completeEdit` — 처리자 수정 완료 처리
- `getPendingList` — 관리자용 전체 PENDING 목록 조회

### Frontend Components

#### 1. EditRequestSection.jsx (기존)

관리자 상세 페이지에서 수정 요청 정보 표시 + 승인/거절 버튼 (이미 구현됨)

#### 2. RejectionModal.jsx (기존)

거절 사유 입력 모달 (이미 구현됨)

#### 3. EditComplaintForm.jsx (신규)

승인 후 처리자가 민원을 수정하는 폼 컴포넌트:
- 제목, 내용, 위치, 카테고리 수정 가능
- 저장 시 completeEdit API 호출

## Interfaces

### REST API Endpoints

#### POST /api/complaints/:id/edit-request/approve

관리자가 수정 요청을 승인한다.

```javascript
// Request
// Headers: Authorization: Bearer <token>
// Body: (없음)

// Response 200
{
  "message": "수정 요청이 승인되었습니다.",
  "editRequest": { "id": 1, "status": "APPROVED", ... }
}

// Response 403 (비관리자)
{ "message": "관리자만 승인할 수 있습니다." }

// Response 404 (PENDING 요청 없음)
{ "message": "처리 대기 중인 수정 요청이 없습니다." }
```

#### POST /api/complaints/:id/edit-request/reject

관리자가 수정 요청을 거절한다.

```javascript
// Request
// Headers: Authorization: Bearer <token>
// Body:
{ "reason": "거절 사유 텍스트 (1~500자)" }

// Response 200
{
  "message": "수정 요청이 거절되었습니다.",
  "editRequest": { "id": 1, "status": "REJECTED", ... }
}

// Response 400 (사유 누락/길이 초과)
{ "message": "거절 사유를 입력해주세요." }

// Response 403 (비관리자)
{ "message": "관리자만 거절할 수 있습니다." }
```

#### PUT /api/complaints/:id/edit-request/complete

처리자가 승인된 수정 요청에 대해 민원을 수정 완료한다.

```javascript
// Request
// Headers: Authorization: Bearer <token>
// Body:
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "location": "수정된 위치",
  "category_id": 3
}

// Response 200
{
  "message": "민원 수정이 완료되었습니다.",
  "complaint": { "id": 1, "title": "수정된 제목", ... }
}

// Response 400 (APPROVED 상태 아님)
{ "message": "승인된 수정 요청이 없습니다." }

// Response 403 (권한 없음)
{ "message": "수정 권한이 없습니다." }
```

#### GET /api/complaints/edit-requests/pending

관리자용 전체 PENDING 수정 요청 목록 조회.

```javascript
// Response 200
{
  "editRequests": [
    {
      "id": 1,
      "complaintId": 10,
      "complaintTitle": "민원 제목",
      "requesterName": "처리자명",
      "reasonType": "분류 항목 변경",
      "detail": "시설관리",
      "createdAt": "2024-01-15 10:30:00"
    }
  ]
}
```

## Data Models

### complaint_edit_requests (기존 테이블 확장)

```sql
CREATE TABLE IF NOT EXISTS complaint_edit_requests (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES complain(complain_id),
  requester_id INTEGER NOT NULL REFERENCES member(member_id),
  reason_type VARCHAR(50) NOT NULL,
  detail TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED | COMPLETED
  prev_state CHAR(1) DEFAULT NULL,                -- 수정 요청 전 민원 상태 (A 또는 P)
  created_at TIMESTAMP DEFAULT NOW()
);
```

`prev_state` 컬럼 추가: 수정 요청 제출 시점의 민원 상태를 저장하여, 거절/완료 시 복원에 사용.

### complaint_edit_request_reviews (신규)

```sql
CREATE TABLE IF NOT EXISTS complaint_edit_request_reviews (
  id SERIAL PRIMARY KEY,
  edit_request_id INTEGER NOT NULL REFERENCES complaint_edit_requests(id),
  reviewer_id INTEGER NOT NULL REFERENCES member(member_id),
  decision VARCHAR(20) NOT NULL,  -- 'APPROVED' | 'REJECTED'
  reject_reason TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);
```

### complaint_edit_history (신규)

```sql
CREATE TABLE IF NOT EXISTS complaint_edit_history (
  id SERIAL PRIMARY KEY,
  edit_request_id INTEGER NOT NULL REFERENCES complaint_edit_requests(id),
  complaint_id INTEGER NOT NULL REFERENCES complain(complain_id),
  changed_by INTEGER NOT NULL REFERENCES member(member_id),
  before_data JSONB NOT NULL,
  after_data JSONB NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

### JSONB 스냅샷 구조

```javascript
// before_data / after_data 예시
{
  "title": "민원 제목",
  "content": "민원 내용",
  "location": "위치 정보",
  "category_id": 2
}
```

## Error Handling

### Backend Error Strategy

| 상황 | HTTP Status | 메시지 |
|------|-------------|--------|
| 비관리자가 승인/거절 시도 | 403 | "관리자만 {action}할 수 있습니다." |
| PENDING 수정 요청 없음 | 404 | "처리 대기 중인 수정 요청이 없습니다." |
| 거절 사유 미입력 | 400 | "거절 사유를 입력해주세요." |
| 승인된 요청 없이 수정 시도 | 400 | "승인된 수정 요청이 없습니다." |
| 중복 수정 요청 | 409 | "이미 처리 대기 중인 수정 요청이 있습니다." |
| 잘못된 민원 상태에서 요청 | 400 | "접수 또는 진행중 상태의 민원만 수정 요청할 수 있습니다." |
| 알림 발송 실패 | (무시) | 알림 실패는 메인 트랜잭션에 영향 없음 |
| DB 오류 | 500 | "서버 오류가 발생했습니다." |

### Frontend Error Strategy

- API 실패 시 폼 데이터 보존 (기존 `preserveFormOnError` 유틸 활용)
- 네트워크 오류 시 사용자에게 재시도 안내
- 낙관적 UI 업데이트 없음 — 서버 응답 확인 후 상태 갱신

## Testing Strategy

### Property-Based Tests (순수 함수 로직)

다음 순수 함수들은 property-based testing으로 검증한다:
- `isEditRequestFormValid` — 폼 유효성 검증 로직
- `filterCategories` — 카테고리 필터링 로직
- `resetDetailOnReasonChange` — 상태 초기화 로직
- `isRejectionReasonValid` — 거절 사유 유효성 검증
- `getEditRequestSectionVisibility` — 섹션 표시 규칙
- 상태 전이 검증 로직 (submission validation)
- 스냅샷 무결성 검증 로직 (before/after data)

### Integration Tests (API + DB)

다음 시나리오는 integration test로 검증한다:
- 수정 요청 제출 → 상태 변경 + 알림 발송
- 관리자 승인 → 리뷰 레코드 생성 + 상태 업데이트 + 알림
- 관리자 거절 → 리뷰 레코드 생성 + 상태 복원 + 알림
- 수정 완료 → 이력 기록 + 상태 복원

### Unit Tests (예시 기반)

- stateMap['R'] === '수정요청' 매핑 확인
- DB 스키마 존재 여부 (smoke test)
- 권한 검증 (비관리자 403 응답)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 수정 요청 제출 상태 전이 규칙

*For any* complaint in state 'A' (접수) or 'P' (진행중), submitting an edit request SHALL change the complaint state to 'R', and for any complaint in state 'B' (접수전) or 'D' (완료) or 'R' (수정요청), the submission SHALL be rejected.

**Validates: Requirements 1.1, 2.3, 2.4**

### Property 2: PENDING 수정 요청 유일성

*For any* complaint that already has an Edit_Request with status 'PENDING', attempting to submit a new edit request SHALL be rejected with a conflict error, regardless of the reason_type or detail provided.

**Validates: Requirements 1.2, 2.5**

### Property 3: 수정 요청 폼 유효성 검증

*For any* combination of reasonType, selectedCategory, and otherReason: the form is valid if and only if (1) reasonType is "처리 담당자 변경", or (2) reasonType is "분류 항목 변경" and selectedCategory is non-null, or (3) reasonType is "기타" and otherReason trimmed length is between 1 and 500.

**Validates: Requirements 2.1, 2.2**

### Property 4: 관리자 전용 리뷰 권한

*For any* user with role other than 'A' (Admin), attempting to approve or reject an edit request SHALL be rejected with a 403 error.

**Validates: Requirements 3.6**

### Property 5: 리뷰 결정 레코드 무결성

*For any* admin review action (approve or reject) on a PENDING edit request, the system SHALL create a review record where: decision matches the action taken, reviewer_id matches the acting admin, reviewed_at is non-null, and reject_reason is non-null only for rejections.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: 거절 시 민원 상태 복원

*For any* complaint that was in state X (where X ∈ {'A', 'P'}) before an edit request was submitted, rejecting that edit request SHALL revert the complaint state from 'R' back to X.

**Validates: Requirements 3.5**

### Property 7: 승인 후 수정 완료 시 상태 복원

*For any* complaint with an APPROVED edit request, completing the modification SHALL change the complaint state from 'R' back to the previous state (stored in prev_state), and update the edit request status to 'COMPLETED'.

**Validates: Requirements 4.3, 4.4**

### Property 8: 수정 이력 스냅샷 무결성

*For any* complaint modification after approval, the created edit history record SHALL contain: before_data matching the complaint's field values before modification, after_data matching the new field values, and both JSONB objects SHALL include title, content, location, and category_id fields.

**Validates: Requirements 4.2, 4.5, 8.3**

### Property 9: 카테고리 필터링 규칙

*For any* list of categories and a current category name, the filtered result SHALL exclude exactly the category matching the current category name, and all other categories SHALL be preserved in their original order.

**Validates: Requirements 2.1**

### Property 10: 거절 사유 유효성 검증

*For any* string input as rejection reason, it is valid if and only if the trimmed length is between 1 and 500 characters inclusive.

**Validates: Requirements 3.2**

### Property 11: 라디오 옵션 변경 시 상세 내용 초기화

*For any* reason type change from type A to type B (where A ≠ B), the detail state (selectedCategory, otherReason) SHALL be reset to initial values (null, empty string).

**Validates: Requirements 2.1**
