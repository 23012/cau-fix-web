# Requirements Document

## Introduction

GitHub Actions 기반 CI/CD 파이프라인을 구축하여, 풀스택 웹 애플리케이션(React 프론트엔드 + Express 백엔드 + PostgreSQL + nginx 리버스 프록시)을 self-hosted runner(Windows 서버)에서 직접 실행하는 방식으로 자동 배포하는 시스템을 구현한다. 배포 대상 서버에는 Node.js, PostgreSQL, nginx가 이미 설치되어 있으며, PM2를 사용하여 백엔드 프로세스를 관리한다.

## Glossary

- **Pipeline**: GitHub Actions 워크플로우로 구성된 CI/CD 자동화 프로세스
- **CI_Job**: 코드 품질 검증을 수행하는 GitHub Actions 작업 (빌드, 의존성 검증)
- **CD_Job**: self-hosted runner에서 배포를 수행하는 GitHub Actions 작업
- **Self_Hosted_Runner**: 배포 대상 Windows 서버에 설치된 GitHub Actions runner
- **Deploy_Path**: self-hosted runner의 프로젝트 배포 경로 (C:\Users\Administrator\Documents\cau-fix\cau-fix-web)
- **Frontend_App**: React 앱을 빌드하여 생성된 정적 파일 (build 디렉토리)
- **Backend_App**: Express 서버 애플리케이션 (PM2로 관리되는 Node.js 프로세스)
- **Nginx_Service**: 리버스 프록시 역할을 하는 nginx 서비스 (프론트엔드 정적 파일 서빙 + 백엔드 API 프록시)
- **PM2_Process**: PM2 프로세스 매니저로 관리되는 백엔드 Node.js 프로세스
- **GitHub_Secrets**: GitHub 저장소에 암호화되어 저장된 환경변수 (DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET)

## Requirements

### Requirement 1: CI 파이프라인 (코드 검증)

**User Story:** As a 개발자, I want main 브랜치에 PR을 올릴 때 자동으로 코드 품질을 검증하고 싶다, so that 결함이 있는 코드가 배포되는 것을 방지할 수 있다.

#### Acceptance Criteria

1. WHEN main 브랜치로의 pull request가 생성되거나 업데이트될 때, THE CI_Job SHALL 프론트엔드 디렉토리에서 의존성 설치 후 프로덕션 빌드를 실행하고, 빌드 프로세스가 exit code 0으로 완료되면 해당 검증 단계를 성공으로 판정한다
2. WHEN main 브랜치로의 pull request가 생성되거나 업데이트될 때, THE CI_Job SHALL 백엔드 디렉토리에서 의존성 설치를 실행하고, 설치 프로세스가 exit code 0으로 완료되면 해당 검증 단계를 성공으로 판정한다
3. IF 프론트엔드 빌드가 exit code 0이 아닌 값으로 종료하면, THEN THE CI_Job SHALL GitHub PR 체크 상태를 실패로 보고하고 PR 머지를 차단한다
4. IF 백엔드 의존성 설치가 exit code 0이 아닌 값으로 종료하면, THEN THE CI_Job SHALL GitHub PR 체크 상태를 실패로 보고하고 PR 머지를 차단한다
5. WHEN CI_Job이 실행될 때, THE CI_Job SHALL 각 검증 단계를 10분 이내에 완료하며, 10분을 초과할 경우 해당 단계를 실패로 판정한다

### Requirement 2: CD 파이프라인 (자동 배포)

**User Story:** As a 개발자, I want main 브랜치에 코드가 머지되면 자동으로 서버에 배포하고 싶다, so that 수동 배포 없이 최신 코드가 운영 환경에 반영된다.

#### Acceptance Criteria

1. WHEN main 브랜치에 push가 발생할 때, THE CD_Job SHALL Self_Hosted_Runner에서 배포를 시작한다
2. WHEN 배포가 시작될 때, THE CD_Job SHALL Deploy_Path에서 최신 코드를 git pull로 가져온다
3. WHEN 최신 코드를 가져온 후, THE CD_Job SHALL GitHub_Secrets로부터 Deploy_Path에 .env 파일을 생성한다
4. WHEN .env 파일이 생성된 후, THE CD_Job SHALL 백엔드 디렉토리에서 npm install을 실행하여 의존성을 설치한다
5. WHEN 백엔드 의존성 설치가 완료된 후, THE CD_Job SHALL 프론트엔드 디렉토리에서 npm install과 npm run build를 실행하여 정적 파일을 생성한다
6. WHEN 프론트엔드 빌드가 완료된 후, THE CD_Job SHALL PM2_Process를 재시작하여 백엔드 서버에 최신 코드를 반영한다
7. WHEN PM2_Process 재시작이 완료된 후, THE CD_Job SHALL nginx 설정 파일을 배포하고 Nginx_Service를 reload하여 프론트엔드 변경사항을 반영한다
8. IF 배포 중 npm install, npm run build, 또는 서비스 재시작 단계가 실패하면, THEN THE CD_Job SHALL 해당 단계에서 워크플로우를 중단하고 실패 상태를 GitHub Actions에 보고한다

### Requirement 3: 수동 배포 지원

**User Story:** As a 개발자, I want 필요할 때 수동으로도 배포를 트리거하고 싶다, so that 긴급 상황에서 즉시 배포할 수 있다.

#### Acceptance Criteria

1. WHEN workflow_dispatch 이벤트가 발생할 때, THE CD_Job SHALL Requirement 2의 배포 프로세스와 동일한 순서(git pull, .env 생성, 의존성 설치, 빌드, 서비스 재시작)로 배포를 실행한다
2. WHEN 수동 배포가 완료되면, THE CD_Job SHALL GitHub Actions 워크플로우 실행 결과에 성공 또는 실패 상태를 표시한다
3. IF 수동 배포 프로세스 중 단계가 실패하면, THEN THE CD_Job SHALL 해당 단계에서 워크플로우를 중단하고 실패 상태와 실패한 단계 정보를 표시한다

### Requirement 4: 환경변수 및 시크릿 관리

**User Story:** As a 개발자, I want 민감한 정보를 안전하게 관리하고 싶다, so that 비밀번호와 키가 코드에 노출되지 않는다.

#### Acceptance Criteria

1. WHEN CD_Job이 실행될 때, THE CD_Job SHALL GitHub_Secrets에서 DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET 값을 읽어 Deploy_Path에 .env 파일로 생성한다
2. IF GitHub_Secrets에 DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET 중 하나라도 빈 값이거나 미설정 상태이면, THEN THE CD_Job SHALL 배포를 중단하고 누락된 시크릿 키 이름을 포함한 오류 메시지를 출력한다
3. THE Backend_App SHALL .env 파일에서 DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET 환경변수를 로드하여 데이터베이스 연결과 JWT 인증에 사용한다
4. THE Pipeline SHALL 워크플로우 실행 로그에서 시크릿 값을 마스킹 처리하여 평문으로 노출하지 않는다
5. THE Repository SHALL .gitignore에 .env 파일을 포함하여 시크릿이 포함된 .env 파일이 버전 관리 시스템에 커밋되지 않도록 한다

### Requirement 5: 서비스 관리

**User Story:** As a 개발자, I want 배포 후 각 서비스가 안정적으로 실행되길 원한다, so that 서비스 중단 없이 운영할 수 있다.

#### Acceptance Criteria

1. THE PM2_Process SHALL Backend_App을 "cau-fix-backend"라는 이름으로 관리하며, 프로세스 비정상 종료 시 자동으로 재시작한다
2. WHEN CD_Job이 백엔드를 배포할 때, THE CD_Job SHALL PM2 reload 명령을 사용하여 무중단으로 Backend_App을 재시작한다
3. THE Nginx_Service SHALL nginx.prod.conf 설정을 사용하여 포트 80에서 프론트엔드 정적 파일(/)을 서빙하고 백엔드 API(/api/, /uploads/)로 트래픽을 프록시한다
4. WHEN CD_Job이 nginx 설정을 배포할 때, THE CD_Job SHALL nginx -t 명령으로 설정 파일 문법을 검증한 후 reload를 실행한다
5. IF nginx 설정 파일 문법 검증이 실패하면, THEN THE CD_Job SHALL nginx reload를 실행하지 않고 기존 설정을 유지하며 실패 상태를 보고한다
6. THE PM2_Process SHALL 시스템 재부팅 시에도 Backend_App이 자동으로 시작되도록 PM2 startup 설정을 유지한다

### Requirement 6: 데이터 영속성

**User Story:** As a 개발자, I want 배포 시에도 기존 데이터가 유지되길 원한다, so that 재배포로 인한 데이터 손실이 발생하지 않는다.

#### Acceptance Criteria

1. THE CD_Job SHALL 배포 과정에서 PostgreSQL 데이터베이스의 기존 데이터를 삭제하거나 초기화하지 않는다
2. THE CD_Job SHALL 배포 과정에서 backend/uploads 디렉토리(complain, process 하위 디렉토리 포함)의 기존 파일을 삭제하지 않는다
3. WHEN git pull이 실행될 때, THE CD_Job SHALL backend/uploads 디렉토리가 .gitignore에 포함되어 있어 기존 업로드 파일이 git 작업에 영향받지 않도록 한다
4. IF 배포 중 npm install이 실패하더라도, THEN THE CD_Job SHALL 기존에 실행 중인 PM2_Process를 중단하지 않아 서비스 가용성을 유지한다
