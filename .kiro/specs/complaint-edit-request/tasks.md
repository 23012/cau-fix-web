# Implementation Plan: 민원 수정 요청 (complaint-edit-request)

## Overview

처리자가 민원 상세 페이지에서 수정 요청을 제출하고, 관리자가 해당 요청을 승인/거절할 수 있는 프론트엔드 기능을 구현한다. 기존 `Detail` 컴포넌트 계층에 새로운 모달, 섹션, 커스텀 훅, 서비스 파일을 추가하며, 기존 프로젝트 패턴(`apiClient`, `complainService`, `fast-check` 속성 테스트)을 따른다.

## Tasks

- [x] 1. API 서비스 및 유틸리티 함수 구현
  - [x] 1.1 editRequestService.js 생성
    - `frontend/src/services/editRequestService.js` 파일 생성
    - 기존 `complainService.js`의 `apiClient` 패턴을 따라 4개 함수 구현: `submitEditRequest`, `getEditRequest`, `approveEditRequest`, `rejectEditRequest`
    - 각 함수에 JSDoc 주석 추가
    - _Requirements: 3.1, 4.4, 5.1, 6.4_

  - [x] 1.2 유효성 검증 및 비즈니스 로직 유틸리티 함수 생성
    - `frontend/src/utils/editRequestUtils.js` 파일 생성
    - 순수 함수로 분리: `isEditRequestMenuVisible`, `isEditRequestFormValid`, `filterCategories`, `resetDetailOnReasonChange`, `preserveFormOnError`, `getEditRequestSectionVisibility`, `isRejectionReasonValid`
    - 각 함수는 설계 문서의 Correctness Properties에 대응
    - _Requirements: 1.1, 1.2, 1.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.5, 6.3, 8.2_

  - [ ]* 1.3 Property 1 속성 테스트 작성: 메뉴 항목 표시 규칙
    - **Property 1: 메뉴 항목 표시 규칙**
    - **Validates: Requirements 1.1, 1.2, 1.4**
    - `frontend/src/utils/__tests__/editRequestUtils.property.test.js` 파일에 `isEditRequestMenuVisible` 함수에 대한 fast-check 속성 테스트 작성
    - 모든 (complaintStatus, userRole, isInProcessingList) 조합에 대해 올바른 결과 검증

  - [ ]* 1.4 Property 2 속성 테스트 작성: 수정 요청 폼 유효성 검증
    - **Property 2: 수정 요청 폼 유효성 검증**
    - **Validates: Requirements 2.5, 2.6, 2.7**
    - `isEditRequestFormValid` 함수에 대한 fast-check 속성 테스트 작성
    - 모든 (reasonType, selectedCategory, otherReason) 조합에 대해 올바른 결과 검증

  - [ ]* 1.5 Property 3 속성 테스트 작성: 카테고리 필터링
    - **Property 3: 카테고리 필터링**
    - **Validates: Requirements 2.2**
    - `filterCategories` 함수에 대한 fast-check 속성 테스트 작성
    - 임의의 카테고리 목록과 현재 카테고리에 대해 현재 카테고리가 제외되고 나머지는 모두 포함되는지 검증

  - [ ]* 1.6 Property 4 속성 테스트 작성: 라디오 옵션 변경 시 상세 내용 초기화
    - **Property 4: 라디오 옵션 변경 시 상세 내용 초기화**
    - **Validates: Requirements 8.2**
    - `resetDetailOnReasonChange` 함수에 대한 fast-check 속성 테스트 작성
    - 이전 선택과 다른 새로운 선택 시 상세 내용이 초기화되는지 검증

  - [ ]* 1.7 Property 7 속성 테스트 작성: 거절 사유 유효성 검증
    - **Property 7: 거절 사유 유효성 검증**
    - **Validates: Requirements 6.3**
    - `isRejectionReasonValid` 함수에 대한 fast-check 속성 테스트 작성
    - 임의의 문자열에 대해 trim 후 1~500자 조건 검증

- [x] 2. Checkpoint - 서비스 및 유틸리티 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. useEditRequest 커스텀 훅 구현
  - [x] 3.1 useEditRequest 훅 생성
    - `frontend/src/hooks/useEditRequest.js` 파일 생성
    - `editRequestService`의 `getEditRequest`, `approveEditRequest` 호출을 관리
    - 반환값: `{ editRequest, loading, error, approving, approve, refetch }`
    - 컴포넌트 마운트 시 자동 조회, 409 충돌 에러 시 자동 refetch 처리
    - _Requirements: 4.4, 4.6, 5.1, 5.2, 5.4, 5.5_

- [x] 4. DetailMenu 컴포넌트 수정
  - [x] 4.1 DetailMenu에 민원 상태 조건 추가
    - `frontend/src/components/detail/DetailMenu.jsx` 수정
    - 기존 `fromStorage` 조건에 추가로 `data.status`가 "접수중" 또는 "진행중"인 경우에만 "수정 요청" 메뉴 표시
    - 상태 조건 미충족 시 "수정 요청" 메뉴 숨김 처리
    - `isEditRequestMenuVisible` 유틸리티 함수 활용
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. EditRequestModal 컴포넌트 구현
  - [x] 5.1 EditRequestModal 컴포넌트 생성
    - `frontend/src/components/detail/EditRequestModal.jsx` 파일 생성
    - Props: `isOpen`, `onClose`, `complaintId`, `currentCategory`, `onSuccess`
    - 라디오 버튼 그룹 (담당자 변경, 카테고리 변경 요청, 기타) 구현
    - 카테고리 변경 선택 시 드롭다운 표시 (현재 카테고리 제외)
    - 기타 선택 시 textarea 표시 (최대 50자)
    - `isEditRequestFormValid` 유틸리티로 제출 버튼 활성화/비활성화 제어
    - 라디오 옵션 변경 시 `resetDetailOnReasonChange`로 상세 내용 초기화
    - API 호출 중 `submitting` 상태로 중복 제출 방지
    - API 실패 시 폼 데이터 보존 및 인라인 에러 메시지 표시
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 5.2 Property 5 속성 테스트 작성: API 실패 시 폼 데이터 보존
    - **Property 5: API 실패 시 폼 데이터 보존**
    - **Validates: Requirements 3.4, 6.7**
    - `preserveFormOnError` 함수에 대한 fast-check 속성 테스트 작성
    - 임의의 유효한 폼 상태에서 API 실패 시 데이터가 동일하게 유지되는지 검증

- [x] 6. EditRequestSection 컴포넌트 구현
  - [x] 6.1 EditRequestSection 컴포넌트 생성
    - `frontend/src/components/detail/EditRequestSection.jsx` 파일 생성
    - Props: `editRequest`, `isAdmin`, `approving`, `onApprove`, `onReject`
    - 수정 요청 데이터가 있을 때만 렌더링
    - 요청 사유 타입, 상세 내용, 제출 시간 표시
    - 관리자인 경우 "승인"/"거절" 버튼 표시, 비관리자는 읽기 전용
    - 승인 처리 중 버튼 비활성화
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ]* 6.2 Property 6 속성 테스트 작성: 수정 요청 섹션 표시 규칙
    - **Property 6: 수정 요청 섹션 표시 규칙**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**
    - `getEditRequestSectionVisibility` 함수에 대한 fast-check 속성 테스트 작성
    - 임의의 (editRequest, userRole) 조합에 대해 올바른 표시 규칙 검증

- [x] 7. RejectionModal 컴포넌트 구현
  - [x] 7.1 RejectionModal 컴포넌트 생성
    - `frontend/src/components/detail/RejectionModal.jsx` 파일 생성
    - Props: `isOpen`, `onClose`, `complaintId`, `onSuccess`
    - 거절 사유 textarea (최대 500자) 구현
    - `isRejectionReasonValid` 유틸리티로 "완료" 버튼 활성화/비활성화 제어
    - "취소" 클릭 시 API 호출 없이 모달 닫기
    - API 호출 중 `submitting` 상태로 중복 제출 방지
    - API 실패 시 입력 데이터 보존 및 인라인 에러 메시지 표시
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 8. Checkpoint - 개별 컴포넌트 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Detail 페이지 통합
  - [x] 9.1 detail.jsx에 수정 요청 기능 통합
    - `frontend/src/components/detail/detail.jsx` 수정
    - `useEditRequest` 훅 연결
    - `EditRequestModal` 열기/닫기 상태 관리 추가
    - `RejectionModal` 열기/닫기 상태 관리 추가
    - `EditRequestSection` 렌더링 (수정 요청 데이터 존재 시)
    - 승인 성공 시 수정 페이지(`/complaint/:id/edit`)로 이동
    - 거절 성공 시 목록 페이지로 이동
    - 수정 요청 제출 성공 시 확인 알림 표시 (3초 후 자동 닫힘)
    - _Requirements: 3.2, 5.3, 6.5, 7.1, 7.2, 7.3, 7.4_

  - [x] 9.2 CSS 스타일 추가
    - `frontend/src/components/detail/detail.css`에 수정 요청 관련 스타일 추가
    - EditRequestModal, EditRequestSection, RejectionModal 스타일링
    - 기존 모달 스타일(`ConfirmPopup`, `StatusChangePopup`) 패턴과 일관성 유지
    - _Requirements: 8.1_

- [x] 10. Final checkpoint - 전체 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- 유틸리티 함수를 순수 함수로 분리하여 속성 기반 테스트를 용이하게 함
- 기존 프로젝트의 `apiClient` 패턴과 `fast-check` 테스트 패턴을 그대로 따름

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["5.2", "6.2"] },
    { "id": 4, "tasks": ["9.1", "9.2"] }
  ]
}
```
