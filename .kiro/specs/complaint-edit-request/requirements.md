# Requirements Document

## Introduction

처리자 수정 요청 기능은 민원 처리자가 이미 접수/진행 중인 민원의 내용 수정을 관리자에게 요청하고, 관리자가 이를 승인 또는 거절할 수 있는 워크플로우를 제공한다. 승인 후 처리자가 실제 민원을 수정하면 변경 전후 스냅샷이 이력으로 기록된다. 승인/거절 결과는 처리자와 민원인 모두에게 Web Push 및 인앱 알림으로 전달된다.

## Glossary

- **System**: 민원 관리 웹 애플리케이션 (React 19 프론트엔드 + Node.js/Express 백엔드 + PostgreSQL)
- **Processor**: 민원 처리자 (role = 'E')
- **Admin**: 관리자 (role = 'A')
- **Complainant**: 민원인 (role = 'C')
- **Edit_Request**: complaint_edit_requests 테이블에 저장되는 수정 요청 레코드
- **Review**: complaint_edit_request_reviews 테이블에 저장되는 관리자 승인/거절 결정 레코드
- **Edit_History**: complaint_edit_history 테이블에 저장되는 수정 전후 스냅샷 레코드
- **Complaint**: complain 테이블에 저장되는 민원 레코드
- **Web_Push**: VAPID 기반 Web Push 알림
- **In_App_Notification**: push_notification 테이블에 저장되는 인앱 알림

## Requirements

### Requirement 1: 수정 요청 상태 관리

**User Story:** As a Processor, I want the complaint status to change to "수정요청(R)" when I submit an edit request, so that all stakeholders can see the complaint is pending modification.

#### Acceptance Criteria

1. WHEN Processor submits an edit request for a Complaint, THE System SHALL change the Complaint state to 'R' (수정요청).
2. WHILE a Complaint is in state 'R', THE System SHALL prevent Processor from submitting another edit request for the same Complaint.
3. WHILE a Complaint is in state 'R', THE System SHALL display "수정요청" as the status label in the complaint list and detail views.

### Requirement 2: 수정 요청 제출

**User Story:** As a Processor, I want to submit an edit request with a reason, so that the admin can understand why the complaint needs modification.

#### Acceptance Criteria

1. WHEN Processor submits an edit request, THE System SHALL store the request in the complaint_edit_requests table with complaint_id, requester_id, reason_type, detail, and status 'PENDING'.
2. THE System SHALL require reason_type to be provided when creating an Edit_Request.
3. WHILE a Complaint is in state 'B' (접수전), THE System SHALL reject edit request submissions for that Complaint.
4. WHILE a Complaint is in state 'D' (완료), THE System SHALL reject edit request submissions for that Complaint.
5. IF an Edit_Request with status 'PENDING' already exists for the same Complaint, THEN THE System SHALL reject the new submission with a conflict error.

### Requirement 3: 관리자 승인/거절 처리

**User Story:** As an Admin, I want to approve or reject edit requests, so that I can control which complaints are allowed to be modified.

#### Acceptance Criteria

1. WHEN Admin approves an Edit_Request, THE System SHALL create a Review record in complaint_edit_request_reviews with decision 'APPROVED', reviewer_id, and reviewed_at timestamp.
2. WHEN Admin rejects an Edit_Request, THE System SHALL create a Review record in complaint_edit_request_reviews with decision 'REJECTED', reviewer_id, reject_reason, and reviewed_at timestamp.
3. WHEN Admin approves an Edit_Request, THE System SHALL update the Edit_Request status from 'PENDING' to 'APPROVED'.
4. WHEN Admin rejects an Edit_Request, THE System SHALL update the Edit_Request status from 'PENDING' to 'REJECTED'.
5. WHEN Admin rejects an Edit_Request, THE System SHALL revert the Complaint state from 'R' to the previous state before the edit request was submitted.
6. THE System SHALL restrict edit request review actions to users with Admin role only.

### Requirement 4: 승인 후 민원 수정 및 이력 기록

**User Story:** As a Processor, I want to edit the complaint after approval and have the changes recorded, so that there is an audit trail of all modifications.

#### Acceptance Criteria

1. WHILE an Edit_Request status is 'APPROVED', THE System SHALL allow Processor to modify the associated Complaint fields (title, content, location, category).
2. WHEN Processor saves modifications to an approved Complaint, THE System SHALL create an Edit_History record in complaint_edit_history containing the before-snapshot and after-snapshot of modified fields.
3. WHEN Processor completes the modification, THE System SHALL change the Complaint state from 'R' back to the previous state (접수 or 진행중).
4. WHEN Processor completes the modification, THE System SHALL update the Edit_Request status from 'APPROVED' to 'COMPLETED'.
5. THE System SHALL store the Edit_History record with edit_request_id, complaint_id, changed_by, before_data (JSON), after_data (JSON), and changed_at timestamp.

### Requirement 5: 수정 요청 제출 시 관리자 알림

**User Story:** As an Admin, I want to receive notifications when a processor submits an edit request, so that I can review it promptly.

#### Acceptance Criteria

1. WHEN Processor submits an Edit_Request, THE System SHALL create an In_App_Notification for all Admin users with the complaint title and "수정 요청" context.
2. WHEN Processor submits an Edit_Request, THE System SHALL send a Web_Push notification to all Admin users containing the complaint title and edit request information.

### Requirement 6: 승인/거절 시 처리자 및 민원인 알림

**User Story:** As a Processor and Complainant, I want to be notified when an edit request is approved or rejected, so that I know the outcome and can take appropriate action.

#### Acceptance Criteria

1. WHEN Admin approves an Edit_Request, THE System SHALL create an In_App_Notification for the Processor who submitted the request with approval message.
2. WHEN Admin approves an Edit_Request, THE System SHALL create an In_App_Notification for the Complainant who owns the Complaint with approval message.
3. WHEN Admin approves an Edit_Request, THE System SHALL send a Web_Push notification to the Processor and the Complainant.
4. WHEN Admin rejects an Edit_Request, THE System SHALL create an In_App_Notification for the Processor who submitted the request with rejection reason.
5. WHEN Admin rejects an Edit_Request, THE System SHALL create an In_App_Notification for the Complainant who owns the Complaint with rejection message.
6. WHEN Admin rejects an Edit_Request, THE System SHALL send a Web_Push notification to the Processor and the Complainant.

### Requirement 7: DB 스키마 - complaint_edit_request_reviews

**User Story:** As a system administrator, I want a dedicated table for review decisions, so that approval/rejection history is properly tracked.

#### Acceptance Criteria

1. THE System SHALL maintain a complaint_edit_request_reviews table with columns: id (PK), edit_request_id (FK to complaint_edit_requests), reviewer_id (FK to member), decision (APPROVED or REJECTED), reject_reason (nullable text), and reviewed_at (timestamp).
2. THE System SHALL enforce a foreign key constraint from edit_request_id to complaint_edit_requests.id.
3. THE System SHALL enforce a foreign key constraint from reviewer_id to member.member_id.

### Requirement 8: DB 스키마 - complaint_edit_history

**User Story:** As a system administrator, I want a dedicated table for edit history snapshots, so that all complaint modifications are auditable.

#### Acceptance Criteria

1. THE System SHALL maintain a complaint_edit_history table with columns: id (PK), edit_request_id (FK to complaint_edit_requests), complaint_id (FK to complain), changed_by (FK to member), before_data (JSONB), after_data (JSONB), and changed_at (timestamp, default NOW()).
2. THE System SHALL enforce foreign key constraints from edit_request_id, complaint_id, and changed_by to their respective parent tables.
3. THE System SHALL store before_data and after_data as JSONB containing the modified complaint fields (title, content, location, category_id).
