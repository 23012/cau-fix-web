# Implementation Plan: 민원 수정 요청 (complaint-edit-request)

## Overview

처리자가 민원 수정 요청을 제출하면 민원 상태가 'R'로 변경되고, 관리자가 승인/거절 처리를 수행한다. 승인 후 처리자가 실제 민원을 수정하면 변경 전후 스냅샷이 이력으로 기록된다. 기존 editRequestModel/Controller를 확장하고, 신규 모델(editReviewModel, editHistoryModel) 및 프론트엔드 수정 폼을 추가한다.

## Tasks

- [ ] 1. DB 스키마 확장 및 백엔드 모델 생성
  - [ ] 1.1 complaint_edit_requests 테이블에 prev_state 컬럼 추가 및 신규 테이블 생성
    - `backend/src/models/editRequestModel.js`의 `ensureTable` 메서드에 `prev_state CHAR(1) DEFAULT NULL` 컬럼 추가 (ALTER TABLE IF NOT EXISTS 패턴)
    - `complaint_edit_request_reviews` 테이블 생성 SQL 추가 (id, edit_request_id FK, reviewer_id FK, decision, reject_reason, reviewed_at)
    - `complaint_edit_history` 테이블 생성 SQL 추가 (id, edit_request_id FK, complaint_id FK, changed_by FK, before_data JSONB, after_data JSONB, changed_at)
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3_

  - [ ] 1.2 editRequestModel.js 확장
    - `findById(id)` — 수정 요청 단건 조회 (id 기반)
    - `updateStatus(id, status)` — 수정 요청 상태 변경 (PENDING → APPROVED/REJECTED/COMPLETED)
    - `findAllPending()` — 전체 PENDING 수정 요청 목록 조회 (관리자용, JOIN complain + member)
    - `create` 메서드에 `prev_state` 파라미터 추가
    - _Requirements: 1.1, 3.3, 3.4, 4.4_

  - [ ] 1.3 editReviewModel.js 신규 생성
    - `backend/src/models/editReviewModel.js` 파일 생성
    - `create({ edit_request_id, reviewer_id, decision, reject_reason })` — 리뷰 레코드 생성
    - `findByEditRequestId(edit_request_id)` — 특정 수정 요청의 리뷰 조회
    - 기존 모델 패턴(pool.query + RETURNING) 따름
    - _Requirements: 3.1, 3.2, 7.1, 7.2, 7.3_

  - [ ] 1.4 editHistoryModel.js 신규 생성
    - `backend/src/models/editHistoryModel.js` 파일 생성
    - `create({ edit_request_id, complaint_id, changed_by, before_data, after_data })` — 이력 레코드 생성
    - `findByComplaintId(complaint_id)` — 특정 민원의 수정 이력 조회
    - _Requirements: 4.2, 4.5, 8.1, 8.2, 8.3_

- [ ] 2. 백엔드 컨트롤러 및 라우트 확장
  - [ ] 2.1 editRequestController.js에 approve 엔드포인트 추가
    - `POST /api/complaints/:id/edit-request/approve` 핸들러 구현
    - 관리자 권한 검증 (role !== 'A' → 403)
    - PENDING 수정 요청 존재 확인 (없으면 404)
    - editReviewModel.create로 APPROVED 리뷰 레코드 생성
    - editRequestModel.updateStatus로 상태 APPROVED 변경
    - 처리자 + 민원인에게 In-App 알림 + Web Push 발송
    - _Requirements: 3.1, 3.3, 3.6, 6.1, 6.2, 6.3_

  - [ ] 2.2 editRequestController.js에 reject 엔드포인트 추가
    - `POST /api/complaints/:id/edit-request/reject` 핸들러 구현
    - 관리자 권한 검증 (role !== 'A' → 403)
    - 거절 사유 유효성 검증 (trim 1~500자, 없으면 400)
    - PENDING 수정 요청 존재 확인 (없으면 404)
    - editReviewModel.create로 REJECTED 리뷰 레코드 생성
    - editRequestModel.updateStatus로 상태 REJECTED 변경
    - complainModel.updateState로 민원 상태를 prev_state로 복원
    - 처리자 + 민원인에게 In-App 알림 + Web Push 발송
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 6.4, 6.5, 6.6_

  - [ ] 2.3 editRequestController.js에 completeEdit 엔드포인트 추가
    - `PUT /api/complaints/:id/edit-request/complete` 핸들러 구현
    - 처리자/관리자 권한 검증
    - APPROVED 상태 수정 요청 존재 확인 (없으면 400)
    - 민원 현재 데이터 스냅샷 (before_data) 생성
    - complainModel.update로 민원 수정 (title, content, location, category_id)
    - editHistoryModel.create로 이력 레코드 생성 (before_data, after_data)
    - editRequestModel.updateStatus로 상태 COMPLETED 변경
    - complainModel.updateState로 민원 상태를 prev_state로 복원
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 2.4 editRequestController.js에 getPendingList 엔드포인트 추가
    - `GET /api/complaints/edit-requests/pending` 핸들러 구현
    - 관리자 권한 검증
    - editRequestModel.findAllPending으로 전체 PENDING 목록 반환
    - _Requirements: 3.6_

  - [ ] 2.5 기존 submit 핸들러 수정 — 민원 상태 'R' 변경 + prev_state 저장
    - editRequestController.submit에서 수정 요청 생성 시 complainModel.updateState(id, 'R') 호출 추가
    - create 시 prev_state에 현재 민원 상태 코드 저장 (complain.status → stateReverseMap 변환)
    - 상태 'B', 'D', 'R'인 민원은 제출 거부 (기존 로직 보강)
    - _Requirements: 1.1, 1.2, 2.3, 2.4, 2.5_

  - [ ] 2.6 complaints 라우트에 신규 엔드포인트 등록
    - `backend/src/routes/complaints.js`에 approve, reject, complete, pending 라우트 추가
    - pending 라우트는 `/:id` 패턴보다 앞에 배치 (라우트 충돌 방지)
    - _Requirements: 3.1, 3.2, 4.1_

- [ ] 3. Checkpoint - 백엔드 API 검증
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. 프론트엔드 서비스 및 훅 확장
  - [ ] 4.1 editRequestService.js에 completeEdit API 함수 추가
    - `completeEditRequest(complaintId, { title, content, location, category_id })` 함수 추가
    - `getPendingEditRequests()` 함수 추가 (관리자용)
    - _Requirements: 4.1, 4.3_

  - [ ] 4.2 useEditRequest 훅에 reject 기능 추가
    - `reject(reason)` 함수 추가 — rejectEditRequest 서비스 호출
    - `rejecting` 상태 추가
    - 거절 성공 시 editRequest 상태 갱신
    - _Requirements: 6.4, 6.5_

- [ ] 5. 프론트엔드 수정 완료 폼 구현
  - [ ] 5.1 EditComplaintForm.jsx 컴포넌트 생성
    - `frontend/src/components/detail/EditComplaintForm.jsx` 파일 생성
    - Props: `complaintId`, `currentData` (title, content, location, category_id), `onComplete`
    - 제목, 내용, 위치, 카테고리 수정 입력 폼 구현
    - 카테고리 드롭다운 (useCategories 훅 활용)
    - 저장 시 completeEditRequest API 호출
    - 성공 시 onComplete 콜백 호출 (상태 복원 반영)
    - API 실패 시 폼 데이터 보존 + 에러 메시지 표시
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.2 Detail 페이지에 EditComplaintForm 통합
    - 민원 상태가 '수정요청'이고 editRequest.status === 'APPROVED'일 때 EditComplaintForm 표시
    - 수정 완료 시 민원 데이터 refetch + 상태 갱신
    - _Requirements: 4.1, 4.3_

- [ ] 6. Checkpoint - 프론트엔드 수정 폼 검증
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. 알림 로직 통합 및 상태 전이 보강
  - [ ] 7.1 승인/거절 시 알림 발송 로직 구현
    - approve 핸들러: 처리자(requester_id) + 민원인(complain.complain_by)에게 In-App + Web Push
    - reject 핸들러: 처리자(requester_id) + 민원인(complain.complain_by)에게 In-App + Web Push (거절 사유 포함)
    - notificationModel.create 및 webPushService.sendToMembers 활용
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 7.2 stateMap에 'R' 매핑 확인 및 프론트엔드 상태 표시 보강
    - complainModel.js의 stateMap에 `R: '수정요청'` 이미 존재하는지 확인
    - 프론트엔드 status constants에 '수정요청' 상태 추가 (필요 시)
    - 민원 목록 및 상세 페이지에서 '수정요청' 상태 라벨 정상 표시 확인
    - _Requirements: 1.3_

- [ ]* 7.3 Property 1 속성 테스트: 수정 요청 제출 상태 전이 규칙
    - **Property 1: 수정 요청 제출 상태 전이 규칙**
    - **Validates: Requirements 1.1, 2.3, 2.4**
    - 상태 'A' 또는 'P'에서만 제출 가능, 'B', 'D', 'R'에서는 거부되는지 검증

- [ ]* 7.4 Property 5 속성 테스트: 리뷰 결정 레코드 무결성
    - **Property 5: 리뷰 결정 레코드 무결성**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - approve/reject 시 review 레코드의 decision, reviewer_id, reviewed_at, reject_reason 필드 무결성 검증

- [ ]* 7.5 Property 6 속성 테스트: 거절 시 민원 상태 복원
    - **Property 6: 거절 시 민원 상태 복원**
    - **Validates: Requirements 3.5**
    - prev_state가 'A' 또는 'P'인 경우 거절 후 해당 상태로 복원되는지 검증

- [ ]* 7.6 Property 8 속성 테스트: 수정 이력 스냅샷 무결성
    - **Property 8: 수정 이력 스냅샷 무결성**
    - **Validates: Requirements 4.2, 4.5, 8.3**
    - before_data와 after_data에 title, content, location, category_id 필드가 모두 포함되는지 검증

- [ ]* 7.7 Property 10 속성 테스트: 거절 사유 유효성 검증
    - **Property 10: 거절 사유 유효성 검증**
    - **Validates: Requirements 3.2**
    - `isRejectionReasonValid` 함수에 대해 trim 후 1~500자 조건 검증

- [ ] 8. Final checkpoint - 전체 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- 기존 editRequestModel/Controller에 기능을 확장하는 방식으로 구현
- 프론트엔드 EditRequestSection, RejectionModal은 이미 구현되어 있으므로 백엔드 연동에 집중
- 알림 실패는 메인 트랜잭션에 영향을 주지 않도록 try-catch로 감싸서 처리

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.2", "2.5", "2.6"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "7.1", "7.2"] },
    { "id": 4, "tasks": ["5.1", "5.2", "7.3", "7.4", "7.5", "7.6", "7.7"] }
  ]
}
```
