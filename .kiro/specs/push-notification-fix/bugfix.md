# Bugfix Requirements Document

## Introduction

시설관리 민원 앱(PWA)에서 모든 푸시 알림이 수신되지 않는 버그. 구독 정보(push_subscription)는 정상 저장되어 있으나, 실제 발송이 모든 경우에서 실패하고 있음. 세 가지 원인이 확인됨:

1. **에러 무시(Silent Failure)**: `webPushService.sendToMember` 호출부에서 `.catch(() => {})`로 에러를 삼키고 있어, 발송 실패 시 원인 파악이 불가능함. 가능한 실패 원인으로는 VAPID 키 불일치/만료, 구독 endpoint 만료, web-push 라이브러리 설정 오류 등이 있음.
2. **createProcess 발송 누락**: `createProcess` 함수에서 민원 처리 완료(상태 'D') 시 DB 알림 레코드는 생성하지만 `webPushService.sendToMember`를 호출하지 않아 푸시 알림이 발송되지 않음.
3. **init.sql 테이블 정의 누락**: `push_subscription` 테이블이 DB 스키마(init.sql)에 정의되어 있지 않아, 신규 배포 시 구독 정보 저장이 불가능함 (현재 운영에는 영향 없음).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN webPushService.sendToMember 또는 sendToMembers가 내부적으로 실패할 때 THEN `.catch(() => {})`로 에러가 조용히 무시되어 로그에 아무런 실패 정보가 남지 않으며, 모든 푸시 알림이 발송되지 않는다

1.2 WHEN webPushService.sendToMember 내부에서 VAPID 키 불일치, 구독 endpoint 만료, 또는 web-push 라이브러리 오류가 발생할 때 THEN 에러 로깅이 없어 근본 원인을 진단할 수 없다

1.3 WHEN 처리자가 createProcess를 통해 민원을 처리 완료(상태 'D')로 변경할 때 THEN push_notification 레코드는 생성되지만 webPushService.sendToMember가 호출되지 않아 민원인에게 실제 푸시 알림이 발송되지 않는다

1.4 WHEN 데이터베이스가 init.sql로 초기화될 때 THEN push_subscription 테이블이 생성되지 않아 신규 배포 환경에서 푸시 구독 저장/조회 시 SQL 에러가 발생한다

### Expected Behavior (Correct)

2.1 WHEN webPushService.sendToMember 또는 sendToMembers가 내부적으로 실패할 때 THEN 에러 내용(상태 코드, 메시지, 대상 member_id)을 console.error로 로깅하여 디버깅이 가능해야 한다

2.2 WHEN webPushService 초기화 시 VAPID 키가 설정되지 않았거나 유효하지 않을 때 THEN 경고 로그를 출력하여 설정 문제를 조기에 감지할 수 있어야 한다

2.3 WHEN 처리자가 createProcess를 통해 민원을 처리 완료(상태 'D')로 변경할 때 THEN push_notification 레코드 생성과 함께 webPushService.sendToMember를 호출하여 민원인에게 실제 푸시 알림을 발송해야 한다

2.4 WHEN 데이터베이스가 init.sql로 초기화될 때 THEN push_subscription 테이블(member_id, endpoint, p256dh, auth 컬럼 포함, member_id+endpoint UNIQUE 제약)이 정상적으로 생성되어야 한다

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 처리자가 updateState를 통해 민원 상태를 변경할 때 THEN 기존과 동일하게 민원인에게 웹 푸시 알림 발송이 시도되어야 한다

3.2 WHEN 사용자가 새 민원을 등록(create)할 때 THEN 기존과 동일하게 담당 처리자들에게 웹 푸시 알림 발송이 시도되어야 한다

3.3 WHEN 사용자가 푸시 구독을 등록/해제할 때 THEN 기존과 동일하게 push_subscription 테이블에 구독 정보가 저장/삭제되어야 한다

3.4 WHEN 기존 push_notification 테이블의 알림 조회, 읽음 처리 기능을 사용할 때 THEN 기존과 동일하게 정상 동작해야 한다

3.5 WHEN webPushService.sendToMember 내부에서 구독 만료(410/404)가 감지될 때 THEN 기존과 동일하게 해당 구독을 push_subscription 테이블에서 삭제해야 한다
