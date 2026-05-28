# Requirements Document

## Introduction

처리자가 민원 처리 플랫폼에서 접수중/진행중 상태의 민원에 대해 수정 요청을 제출하고, 관리자가 해당 요청을 승인 또는 거절할 수 있는 프론트엔드 기능을 추가한다. 기존에는 처리자가 관리자에게 개인 연락처로 문의해야 했던 프로세스를 플랫폼 내에서 처리할 수 있도록 개선한다.

## Glossary

- **Edit_Request_Modal**: 처리자가 수정 요청 사유를 입력하는 모달 컴포넌트
- **Rejection_Modal**: 관리자가 거절 사유를 입력하는 모달 컴포넌트
- **Detail_Menu**: 민원 상세 페이지의 더보기(⋮) 버튼 클릭 시 표시되는 드롭다운 메뉴 컴포넌트
- **Complaint_Detail_Page**: 민원 상세 정보를 표시하는 페이지 컴포넌트
- **Edit_Request_Section**: 관리자 민원 상세 페이지에 표시되는 수정 요청 사유 확인 영역
- **Notification_Component**: 알림 메시지를 동적으로 표시하는 컴포넌트
- **Handler**: 민원을 처리하는 역할의 사용자 (처리자)
- **Admin**: 시설관리팀 소속으로 민원을 관리하는 역할의 사용자 (관리자)
- **Edit_Request_API**: 수정 요청 관련 백엔드 API 엔드포인트 집합

## Requirements

### Requirement 1: 처리자 수정 요청 메뉴 표시

**User Story:** As a Handler, I want to see an "수정 요청" menu item in the detail menu, so that I can initiate a complaint edit request from the platform.

#### Acceptance Criteria

1. WHILE the complaint status is "접수중" or "진행중", AND the logged-in user is a Handler who has the complaint in their processing list, THE Detail_Menu SHALL display the "수정 요청" menu item
2. WHILE the complaint status is not "접수중" and not "진행중", THE Detail_Menu SHALL hide the "수정 요청" menu item even if the logged-in user is a Handler who has the complaint in their processing list
3. WHEN the Handler clicks the more(⋮) button on the Complaint_Detail_Page, THE Detail_Menu SHALL render the dropdown menu within 200ms containing the "수정 요청" option if the complaint status is "접수중" or "진행중" and the complaint is in the Handler's processing list
4. IF the Handler does not have the complaint in their processing list, THEN THE Detail_Menu SHALL display the "내 처리현황에 추가" menu item instead of the "수정 요청" menu item
5. WHEN the Handler clicks outside the Detail_Menu or selects a menu item, THE Detail_Menu SHALL close the dropdown menu

### Requirement 2: 수정 요청 사유 입력 모달

**User Story:** As a Handler, I want to enter a reason for my edit request through a modal form, so that the admin can understand why the complaint needs modification.

#### Acceptance Criteria

1. WHEN the Handler clicks the "수정 요청" menu item, THE Edit_Request_Modal SHALL render with a radio button group containing three options: "담당자 변경", "카테고리 변경 요청", "기타"
2. WHEN the Handler selects "카테고리 변경 요청" radio option, THE Edit_Request_Modal SHALL display a category selection dropdown below the radio group, populated with the system category list retrieved from GET /api/categories excluding the complaint's current category
3. WHEN the Handler selects "기타" radio option, THE Edit_Request_Modal SHALL display a textarea input field below the radio group with a maximum input length of 500 characters
4. WHEN the Handler selects "담당자 변경" radio option, THE Edit_Request_Modal SHALL not display additional input fields
5. IF no radio option is selected, THEN THE Edit_Request_Modal SHALL disable the submit button
6. IF "카테고리 변경 요청" is selected and no category is chosen from the dropdown, THEN THE Edit_Request_Modal SHALL disable the submit button
7. IF "기타" is selected and the textarea is empty or contains only whitespace characters, THEN THE Edit_Request_Modal SHALL disable the submit button
8. WHILE the category list API call is in progress after selecting "카테고리 변경 요청", THE Edit_Request_Modal SHALL display a loading state in the dropdown until categories are loaded

### Requirement 3: 수정 요청 제출

**User Story:** As a Handler, I want to submit my edit request, so that the admin receives and reviews it.

#### Acceptance Criteria

1. WHEN the Handler clicks the submit button with valid input, THE Edit_Request_Modal SHALL call POST /api/complaints/:id/edit-request with the selected reason type and detail content
2. WHEN the API call succeeds, THE Complaint_Detail_Page SHALL display a confirmation alert with the message "수정 요청이 완료되었습니다. 관리자가 요청을 완료할 때까지 대기 바랍니다." for 3 seconds before automatically dismissing
3. WHEN the API call succeeds, THE Edit_Request_Modal SHALL close
4. IF the API call fails, THEN THE Edit_Request_Modal SHALL display an error message indicating the submission failure to the Handler without closing the modal and without clearing the previously entered form data
5. IF the Handler clicks the submit button while a previous submission is still in progress, THEN THE Edit_Request_Modal SHALL not send a duplicate API request

### Requirement 4: 관리자 수정 요청 사유 확인 섹션

**User Story:** As an Admin, I want to view the edit request details on the complaint detail page, so that I can make an informed decision on whether to approve or reject the request.

#### Acceptance Criteria

1. WHEN a complaint has a pending edit request, THE Complaint_Detail_Page SHALL display the Edit_Request_Section with the request reason type ("담당자 변경", "카테고리 변경 요청", or "기타"), the detail content (selected category or free-text reason), and the request submission timestamp
2. IF the user role is Admin, THEN THE Edit_Request_Section SHALL display an "승인" button and a "거절" button
3. WHILE the user role is not Admin, THE Edit_Request_Section SHALL hide the "승인" and "거절" buttons but still display the request reason, detail content, and timestamp as read-only
4. WHEN the Admin navigates to the complaint detail page, THE Complaint_Detail_Page SHALL call GET /api/complaints/:id/edit-request to fetch the edit request data
5. IF the complaint has no pending edit request, THEN THE Complaint_Detail_Page SHALL not display the Edit_Request_Section
6. IF the GET /api/complaints/:id/edit-request API call fails, THEN THE Complaint_Detail_Page SHALL display an error message indicating that the edit request data could not be loaded

### Requirement 5: 관리자 수정 요청 승인 처리

**User Story:** As an Admin, I want to approve an edit request, so that the complaint can be modified according to the handler's request.

#### Acceptance Criteria

1. WHEN the Admin clicks the "승인" button, THE Complaint_Detail_Page SHALL call POST /api/complaints/:id/edit-request/approve
2. WHILE the approval API call is in progress, THE Complaint_Detail_Page SHALL disable the "승인" button and the "거절" button to prevent duplicate submissions
3. WHEN the approval API call succeeds, THE Complaint_Detail_Page SHALL navigate to the complaint edit page (/complaint/:id/edit) regardless of the edit request reason type ("담당자 변경", "카테고리 변경 요청", or "기타")
4. IF the approval API call fails, THEN THE Complaint_Detail_Page SHALL display an error message indicating that the approval could not be processed, and SHALL re-enable the "승인" and "거절" buttons
5. IF the approval API call returns a conflict status indicating the edit request has already been processed, THEN THE Complaint_Detail_Page SHALL display an error message indicating the request was already handled and SHALL refresh the edit request section

### Requirement 6: 관리자 수정 요청 거절 처리

**User Story:** As an Admin, I want to reject an edit request with a reason, so that the handler understands why the request was denied.

#### Acceptance Criteria

1. WHEN the Admin clicks the "거절" button, THE Rejection_Modal SHALL render with a textarea for entering the rejection reason
2. WHILE the Rejection_Modal is open, THE Rejection_Modal SHALL display a "취소" button and a "완료" button
3. IF the rejection reason textarea is empty or contains only whitespace characters, THEN THE Rejection_Modal SHALL disable the "완료" button
4. WHEN the Admin clicks the "완료" button with a rejection reason containing at least 1 non-whitespace character and at most 500 characters, THE Rejection_Modal SHALL call POST /api/complaints/:id/edit-request/reject with the rejection reason
5. WHEN the rejection API call succeeds, THE Complaint_Detail_Page SHALL navigate to the complaint list page
6. WHEN the Admin clicks the "취소" button, THE Rejection_Modal SHALL close without making an API call
7. IF the rejection API call fails, THEN THE Rejection_Modal SHALL display an error message indicating the rejection could not be processed, retain the entered rejection reason, and remain open
8. WHILE the rejection API call is in progress, THE Rejection_Modal SHALL disable the "완료" button to prevent duplicate submissions

### Requirement 7: 알림 메시지 동적 표시

**User Story:** As a user of the platform, I want to receive contextual notifications about edit request status changes, so that I stay informed about complaint modifications.

#### Acceptance Criteria

1. WHEN an edit request is approved by the Admin, THE Notification_Component SHALL persist a notification with the message "{민원제목}이(가) 처리자 요청에 의해 {사유} 처리 되었습니다." to the complaint reporter within 5 seconds of the approval action
2. WHEN an edit request is approved, THE Notification_Component SHALL persist a notification with the message "{민원제목} 수정 완료 되었습니다." to the Handler who submitted the edit request within 5 seconds of the approval action
3. WHEN an edit request is rejected, THE Notification_Component SHALL persist a notification with the message "{민원제목} 수정 요청이 거절되었습니다. 사유: {거절사유}" to the Handler who submitted the edit request within 5 seconds of the rejection action
4. WHEN a new edit request is submitted by a Handler, THE Notification_Component SHALL persist a notification with the message "{민원제목}이(가) 수정 요청 되었습니다." to the Admin within 5 seconds of the submission

### Requirement 8: 수정 요청 모달 UI 상호작용

**User Story:** As a Handler, I want the edit request modal to provide clear visual feedback, so that I can complete the form without confusion.

#### Acceptance Criteria

1. WHEN the Handler opens the Edit_Request_Modal, THE Edit_Request_Modal SHALL display with no radio option pre-selected and the submit button disabled
2. WHEN the Handler selects a different radio option, THE Edit_Request_Modal SHALL clear any previously entered detail content (reset category selection to unselected state and clear textarea text to empty string)
3. WHEN the Handler clicks the overlay area outside the Edit_Request_Modal or clicks the close button (X), THE Edit_Request_Modal SHALL close without submitting and discard any unsaved input
4. WHILE an API call for the edit request submission is in progress, THE Edit_Request_Modal SHALL disable the submit button and display a loading indicator until the API call completes or fails
5. IF the edit request API call fails, THEN THE Edit_Request_Modal SHALL re-enable the submit button, hide the loading indicator, and display an error message indicating the submission failure
