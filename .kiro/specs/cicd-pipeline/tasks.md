# Implementation Plan: CI/CD Pipeline

## Overview

GitHub Actions 기반 CI/CD 파이프라인을 구축하여 React + Express + PostgreSQL 풀스택 웹 앱을 self-hosted Windows 서버에 자동 배포하는 시스템을 구현한다. 단일 워크플로우 파일(`.github/workflows/deploy.yml`)에 CI Job과 CD Job을 정의하고, nginx 설정을 Docker 기반에서 로컬 서빙 방식으로 전환한다.

## Tasks

- [x] 1. 프로젝트 기반 설정
  - [x] 1.1 .gitignore에 .env 및 uploads 디렉토리 추가
    - 프로젝트 루트 `.gitignore`에 `.env`와 `backend/uploads/` 항목을 추가하여 민감 정보와 업로드 파일이 버전 관리에 포함되지 않도록 한다
    - _Requirements: 4.5, 6.2, 6.3_

  - [x] 1.2 nginx 프로덕션 설정 파일을 self-hosted 환경에 맞게 수정
    - `nginx/nginx.prod.conf`를 Docker 기반(proxy_pass http://frontend:80, http://backend:3000)에서 로컬 파일 시스템 기반으로 변경
    - 프론트엔드: `root C:/Users/Administrator/Documents/cau-fix/cau-fix-web/frontend/build;`와 `try_files $uri $uri/ /index.html;` 설정
    - 백엔드 API: `proxy_pass http://127.0.0.1:3000;`으로 변경
    - 업로드 파일: `proxy_pass http://127.0.0.1:3000;`으로 변경
    - _Requirements: 5.3_

- [x] 2. CI 파이프라인 구현
  - [x] 2.1 GitHub Actions 워크플로우 파일에 CI Job 작성
    - `.github/workflows/deploy.yml`을 재작성하여 CI/CD 통합 워크플로우로 구성
    - 트리거: `pull_request` → main 브랜치
    - `runs-on: ubuntu-latest`, `timeout-minutes: 10` 설정
    - Node.js 18 설정 (`actions/setup-node@v4`)
    - 프론트엔드 단계: `cd frontend && npm install && npm run build`
    - 백엔드 단계: `cd backend && npm install`
    - 각 단계 실패 시 PR 체크 상태가 자동으로 실패로 보고됨
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. CD 파이프라인 구현
  - [x] 3.1 CD Job 기본 구조 및 시크릿 검증 단계 작성
    - 동일 워크플로우 파일에 `deploy` Job 추가
    - 트리거 조건: `if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'`
    - `runs-on: self-hosted` 설정
    - 시크릿 검증 PowerShell 스크립트: DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET 존재 여부 확인
    - 누락 시 오류 메시지 출력 후 `exit 1`
    - _Requirements: 2.1, 4.1, 4.2, 4.4_

  - [x] 3.2 코드 업데이트 및 환경변수 파일 생성 단계 작성
    - `git pull origin main` 단계 추가 (Deploy_Path에서 실행)
    - GitHub Secrets에서 `.env` 파일 생성 (DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET)
    - 파일 경로: `C:\Users\Administrator\Documents\cau-fix\cau-fix-web\.env`
    - _Requirements: 2.2, 2.3, 4.1, 4.3_

  - [x] 3.3 의존성 설치 및 프론트엔드 빌드 단계 작성
    - 백엔드: `cd backend && npm install`
    - 프론트엔드: `cd frontend && npm install && npm run build`
    - 각 단계 실패 시 워크플로우 즉시 중단 (기본 동작)
    - _Requirements: 2.4, 2.5, 2.8, 6.4_

  - [x] 3.4 PM2 백엔드 재시작 단계 작성
    - `pm2 reload cau-fix-backend` 명령으로 무중단 재시작
    - PM2 프로세스가 존재하지 않을 경우를 대비한 fallback: `pm2 start backend/src/app.js --name cau-fix-backend`
    - _Requirements: 2.6, 5.1, 5.2_

  - [x] 3.5 nginx 설정 배포 및 reload 단계 작성
    - `nginx/nginx.prod.conf`를 Windows nginx 설정 경로로 복사
    - `nginx -t` 명령으로 설정 파일 문법 검증
    - 검증 성공 시에만 `nginx -s reload` 실행
    - 검증 실패 시 reload 스킵하고 기존 설정 유지, 실패 상태 보고
    - _Requirements: 2.7, 5.3, 5.4, 5.5_

- [x] 4. 수동 배포 트리거 설정
  - [x] 4.1 workflow_dispatch 이벤트 트리거 추가
    - 워크플로우 `on` 섹션에 `workflow_dispatch` 추가
    - CD Job의 `if` 조건에 `workflow_dispatch` 포함 확인
    - 수동 실행 시에도 동일한 배포 프로세스(시크릿 검증 → git pull → .env 생성 → 의존성 설치 → 빌드 → PM2 reload → nginx reload) 실행
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Checkpoint - 워크플로우 파일 검증
  - Ensure all workflow YAML syntax is valid, ask the user if questions arise.

- [x] 6. PM2 ecosystem 설정
  - [x] 6.1 PM2 ecosystem 설정 파일 생성
    - 프로젝트 루트에 `ecosystem.config.js` 생성
    - 프로세스 이름: `cau-fix-backend`
    - 스크립트 경로: `backend/src/app.js`
    - 자동 재시작 설정, watch 비활성화 (배포 시 PM2 reload 사용)
    - _Requirements: 5.1, 5.6_

- [x] 7. 최종 통합 및 검증
  - [x] 7.1 전체 워크플로우 파일 통합 및 최종 검토
    - CI Job과 CD Job이 올바른 트리거 조건으로 분리되어 있는지 확인
    - CD Job의 각 단계가 순차적으로 실행되며 실패 시 즉시 중단되는지 확인
    - 시크릿 마스킹이 GitHub Actions 기본 동작으로 보장되는지 확인
    - 데이터 보호: 배포 스크립트에 DB 조작 명령이 없고, uploads 디렉토리가 git 작업에 영향받지 않는지 확인
    - _Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.3, 4.1-4.5, 5.1-5.6, 6.1-6.4_

- [x] 8. Final Checkpoint - 전체 파이프라인 검증
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 이 프로젝트는 IaC(Infrastructure as Code) 특성으로 Property-Based Testing이 적합하지 않아 PBT 태스크를 제외함
- 검증은 YAML 문법 검증, 실제 PR/push를 통한 통합 테스트, 수동 배포 테스트로 수행
- 기존 `deploy.yml`은 완전히 재작성됨 (현재 파일은 불완전한 상태)
- nginx 설정은 Docker 기반에서 로컬 파일 시스템 기반으로 전환됨
- PM2 startup 설정(`pm2 startup`, `pm2 save`)은 서버에서 수동으로 한 번 실행해야 함 (워크플로우 태스크 범위 외)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "6.1"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3"] },
    { "id": 5, "tasks": ["3.4"] },
    { "id": 6, "tasks": ["3.5", "4.1"] },
    { "id": 7, "tasks": ["7.1"] }
  ]
}
```
