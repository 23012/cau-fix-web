# 요구사항 문서

## 소개

프론트엔드 회원가입 페이지를 백엔드 REST API에 연동하는 기능이다. 중앙 집중식 API 서비스 레이어(apiClient, authService)를 도입하여 아이디 중복 확인과 회원가입 로직을 실제 API 호출로 교체한다.

## 용어 정의

- **API_Client**: HTTP 요청을 처리하는 fetch 래퍼 모듈 (apiClient.js)
- **Auth_Service**: 인증 관련 API 호출을 캡슐화하는 서비스 모듈 (authService.js)
- **Signup_Page**: 회원가입 페이지 컴포넌트 (signup.js)
- **ApiError**: HTTP 에러 응답을 표현하는 커스텀 에러 클래스
- **login_id**: 백엔드에서 사용하는 사용자 아이디 필드명
- **formData**: 프론트엔드 폼 상태 객체 (id, password, name, role, dept, phone)

## 요구사항

### 요구사항 1: HTTP 클라이언트 래퍼

**User Story:** 개발자로서, 모든 API 호출에 공통 설정을 자동 적용하는 fetch 래퍼를 사용하고 싶다. 이를 통해 중복 코드를 줄이고 일관된 에러 처리를 할 수 있다.

#### 인수 조건

1. THE API_Client SHALL 모든 요청 URL에 Base URL(`/api`)을 자동으로 접두사 처리한다
2. THE API_Client SHALL 모든 요청에 `Content-Type: application/json` 헤더를 자동 설정한다
3. WHEN localStorage에 token이 존재하면, THE API_Client SHALL `Authorization: Bearer {token}` 헤더를 자동 첨부한다
4. WHEN localStorage에 token이 존재하지 않으면, THE API_Client SHALL Authorization 헤더 없이 요청을 전송한다
5. WHEN HTTP 응답 상태가 2xx이면, THE API_Client SHALL 응답 바디를 JSON으로 파싱하여 반환한다
6. WHEN HTTP 응답 상태가 4xx 또는 5xx이면, THE API_Client SHALL 응답 바디에서 message를 추출하여 ApiError를 throw한다
7. WHEN HTTP 에러 응답의 바디를 JSON으로 파싱할 수 없으면, THE API_Client SHALL 기본 에러 메시지("요청 처리 중 오류가 발생했습니다.")로 ApiError를 throw한다

### 요구사항 2: 아이디 중복 확인 API 연동

**User Story:** 사용자로서, 회원가입 시 아이디 중복 여부를 실시간으로 확인하고 싶다. 이를 통해 이미 사용 중인 아이디로 가입을 시도하는 실수를 방지할 수 있다.

#### 인수 조건

1. WHEN 사용자가 "중복 확인" 버튼을 클릭하면, THE Auth_Service SHALL `GET /api/auth/check-id/{login_id}` 엔드포인트를 호출한다
2. WHEN login_id에 특수문자가 포함되어 있으면, THE Auth_Service SHALL encodeURIComponent로 URL 인코딩 처리한다
3. WHEN 서버가 `{ available: true }`를 응답하면, THE Signup_Page SHALL "사용 가능한 아이디입니다." 알림을 표시하고 idChecked를 true, idAvailable을 true로 설정한다
4. WHEN 서버가 `{ available: false }`를 응답하면, THE Signup_Page SHALL "사용 불가능한 아이디입니다." 알림을 표시하고 idChecked를 true, idAvailable을 false로 설정한다
5. WHEN 아이디 입력값이 비어있으면(trim 후), THE Signup_Page SHALL "아이디를 입력해주세요" 에러 메시지를 표시하고 API 호출을 하지 않는다
6. IF 중복 확인 API 호출 중 에러가 발생하면, THEN THE Signup_Page SHALL "중복 확인 중 오류가 발생했습니다" 에러 메시지를 표시한다

### 요구사항 3: 회원가입 API 연동

**User Story:** 사용자로서, 폼을 작성하고 제출하면 실제 백엔드에 회원가입 요청이 전송되길 원한다. 이를 통해 관리자 승인 후 시스템을 사용할 수 있다.

#### 인수 조건

1. WHEN 사용자가 회원가입 폼을 제출하면, THE Auth_Service SHALL `POST /api/auth/register` 엔드포인트를 호출한다
2. THE Auth_Service SHALL formData의 `id` 필드를 백엔드 페이로드의 `login_id` 필드로 매핑한다
3. THE Auth_Service SHALL password, name, role, dept, phone 필드를 동일한 이름으로 백엔드 페이로드에 포함한다
4. WHEN 서버가 201 상태로 응답하면, THE Signup_Page SHALL 성공 메시지를 alert으로 표시하고 로그인 페이지(`/login`)로 이동한다
5. WHEN 서버가 409 상태로 응답하면, THE Signup_Page SHALL "이미 사용 중인 아이디입니다" 에러 메시지를 표시하고 idChecked를 false, idAvailable을 null로 초기화한다
6. WHEN 서버가 400 상태로 응답하면, THE Signup_Page SHALL 서버 응답의 에러 메시지를 그대로 표시한다
7. IF 네트워크 오류 또는 예상치 못한 에러가 발생하면, THEN THE Signup_Page SHALL "회원가입 중 오류가 발생했습니다" 에러 메시지를 표시한다

### 요구사항 4: 클라이언트 유효성 검증

**User Story:** 사용자로서, 잘못된 입력으로 불필요한 API 호출이 발생하지 않길 원한다. 이를 통해 빠른 피드백을 받고 서버 부하를 줄일 수 있다.

#### 인수 조건

1. WHEN 아이디 중복 확인을 하지 않은 상태에서 폼을 제출하면, THE Signup_Page SHALL "아이디 중복 확인을 해주세요" 에러 메시지를 표시하고 API 호출을 하지 않는다
2. WHEN 아이디가 사용 불가능한 상태(idAvailable === false)에서 폼을 제출하면, THE Signup_Page SHALL "사용 불가능한 아이디입니다" 에러 메시지를 표시하고 API 호출을 하지 않는다
3. WHEN 필수 필드(id, password, passwordConfirm, name, dept, phone) 중 하나라도 비어있으면(trim 후), THE Signup_Page SHALL "모든 항목을 입력해주세요" 에러 메시지를 표시하고 API 호출을 하지 않는다
4. WHEN 비밀번호와 비밀번호 확인이 일치하지 않으면, THE Signup_Page SHALL "비밀번호가 일치하지 않습니다" 에러 메시지를 표시하고 API 호출을 하지 않는다

### 요구사항 5: 로딩 상태 관리

**User Story:** 사용자로서, API 호출 중임을 시각적으로 확인하고 싶다. 이를 통해 중복 제출을 방지하고 시스템이 동작 중임을 알 수 있다.

#### 인수 조건

1. WHEN 회원가입 API 호출이 시작되면, THE Signup_Page SHALL loading 상태를 true로 설정한다
2. WHEN 회원가입 API 호출이 완료되면(성공 또는 실패), THE Signup_Page SHALL loading 상태를 false로 설정한다
3. WHILE loading 상태가 true인 동안, THE Signup_Page SHALL 폼 입력 필드와 버튼을 비활성화한다
