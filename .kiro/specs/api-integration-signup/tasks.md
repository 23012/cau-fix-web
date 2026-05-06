# 구현 태스크

## Task 1: API 클라이언트 래퍼 생성

- [x] 1.1 `frontend/src/services/apiClient.js` 파일 생성
- [x] 1.2 ApiError 클래스 구현 (status, message 속성 포함)
- [x] 1.3 apiClient 함수 구현 (Base URL 접두사, Content-Type 헤더, 토큰 자동 첨부, JSON 파싱, 에러 처리)
- [x] 1.4 apiClient와 ApiError를 export

## Task 2: 인증 서비스 생성

- [x] 2.1 `frontend/src/services/authService.js` 파일 생성
- [x] 2.2 checkDuplicateId(loginId) 함수 구현 (encodeURIComponent 적용)
- [x] 2.3 register(formData) 함수 구현 (id → login_id 필드 매핑 포함)

## Task 3: 회원가입 페이지 API 연동

- [x] 3.1 `frontend/src/pages/signup/signup.js`에서 authService import 추가
- [x] 3.2 handleCheckDuplicate 함수를 실제 API 호출로 교체 (checkDuplicateId 사용)
- [x] 3.3 handleSubmit 함수를 실제 API 호출로 교체 (register 사용)
- [x] 3.4 409 에러 시 idChecked/idAvailable 상태 초기화 로직 추가
- [x] 3.5 에러 메시지 처리 로직 구현 (ApiError의 message 활용)

## Task 4: 속성 기반 테스트 작성

- [x] 4.1 테스트 환경 설정 (fast-check 설치, 테스트 설정 파일 확인)
- [x] 4.2 Property 1 테스트: register() 필드 매핑 정확성
- [x] 4.3 Property 2 테스트: checkDuplicateId() URL 인코딩 정확성
- [x] 4.4 Property 3 테스트: apiClient 토큰 자동 첨부
- [x] 4.5 Property 4 테스트: apiClient 에러 응답 추출
- [x] 4.6 Property 5 테스트: 빈 입력 중복 확인 차단
- [x] 4.7 Property 6 테스트: 필수 필드 누락 시 API 호출 차단
- [x] 4.8 Property 7 테스트: 비밀번호 불일치 시 API 호출 차단
- [x] 4.9 Property 8 테스트: 로딩 상태 항상 해제
