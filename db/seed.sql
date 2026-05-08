-- ============================================================
-- 시드 데이터 (개발용)
-- 실행: \i .../db/seed.sql
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1. member (사용자, 처리자, 관리자 각 1명)
-- 비밀번호 모두 test1234!
-- ------------------------------------------------------------
INSERT INTO member (login_id, password, name, role, dept, phone, is_approved) VALUES
  ('user01',  '$2b$10$3QxDjD1ylgPnRgQLhBrTaeqdsNaLxkk7gpdsFGUheGU2sXXoUrMq.', '김민준', 'C', '원무팀',  '010-1111-0001', TRUE),
  ('manager01','$2b$10$3QxDjD1ylgPnRgQLhBrTaeqdsNaLxkk7gpdsFGUheGU2sXXoUrMq.', '박지훈', 'E', '시설팀',  '010-5555-0002', TRUE),
  ('admin01',  '$2b$10$3QxDjD1ylgPnRgQLhBrTaeqdsNaLxkk7gpdsFGUheGU2sXXoUrMq.', '이관리', 'A', '관리팀',  '010-9999-0003', TRUE)
ON CONFLICT (login_id) DO NOTHING;

-- ------------------------------------------------------------
-- STEP 2. notice (공지사항 10개)
-- ------------------------------------------------------------
SELECT setval('notice_notice_id_seq', COALESCE((SELECT MAX(notice_id) FROM notice), 0));

INSERT INTO notice (notice_id, notice_by, notice_title, notice_category, notice_content, noticed_at, updated_at) VALUES

(1, (SELECT member_id FROM member WHERE login_id='manager01'),
 '시스템 점검 안내', 'F',
 '안녕하세요. 시설팀입니다. 2026년 5월 10일(일) 새벽 2시부터 4시까지 시스템 정기 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 불가하오니 양해 부탁드립니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

(2, (SELECT member_id FROM member WHERE login_id='manager01'),
 '모바일 앱 v2.0 업데이트 안내', 'U',
 '안녕하세요. 시설팀입니다. 모바일 앱이 v2.0으로 업데이트되었습니다. 주요 변경 사항: 푸시 알림 기능 추가, UI 전면 개편, 처리 현황 실시간 조회. 앱스토어에서 최신 버전으로 업데이트해 주세요. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

(3, (SELECT member_id FROM member WHERE login_id='manager01'),
 '고장 신고 처리 절차 안내', 'G',
 '안녕하세요. 시설팀입니다. 고장 신고 처리 절차를 안내드립니다. 1. 앱에서 고장 신고 접수 2. 담당자 배정 및 접수 확인 3. 현장 점검 및 처리 진행 4. 처리 완료 후 앱 알림 발송. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

(4, (SELECT member_id FROM member WHERE login_id='manager01'),
 '5월 정기 소방 점검 안내', 'F',
 '안녕하세요. 시설팀입니다. 5월 정기 소방 설비 점검이 실시됩니다. 일시: 2026년 5월 15일(금) 오전 10시 ~ 12시. 점검 구역: 전 층 복도 및 계단. 점검 시간 동안 소방벨이 울릴 수 있으니 당황하지 마시기 바랍니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

(5, (SELECT member_id FROM member WHERE login_id='manager01'),
 '엘리베이터 정기 점검 안내', 'F',
 '안녕하세요. 시설팀입니다. 엘리베이터 정기 점검이 실시됩니다. 일시: 2026년 5월 12일(화) 오전 9시 ~ 11시. 점검 대상: 본관 1호기 ~ 4호기 전체. 점검 시간 동안 운행이 중단되오니 이용에 참고 바랍니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

(6, (SELECT member_id FROM member WHERE login_id='manager01'),
 '냉방 시스템 가동 안내', 'G',
 '안녕하세요. 시설팀입니다. 5월부터 냉방 시스템이 가동됩니다. 가동 시간: 평일 오전 8시 ~ 오후 7시. 냉방 온도: 26도 기준 유지. 냉방 관련 불편 사항은 고장 신고 앱을 통해 접수해 주시기 바랍니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

(7, (SELECT member_id FROM member WHERE login_id='manager01'),
 '주차장 도색 공사 안내', 'G',
 '안녕하세요. 시설팀입니다. 주차장 바닥 도색 공사가 진행됩니다. 공사 기간: 2026년 5월 8일(금) ~ 5월 9일(토). 공사 구역: 지하 1층 ~ 지하 2층 전 구역. 공사 기간 중 주차장 이용이 제한되오니 양해 부탁드립니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

(8, (SELECT member_id FROM member WHERE login_id='manager01'),
 '긴급 누수 복구 완료 안내', 'G',
 '안녕하세요. 시설팀입니다. 본관 3층 누수 긴급 복구가 완료되었습니다. 복구 완료 일시: 2026년 5월 5일 오후 3시. 영향 구역: 본관 3층 301호 ~ 305호. 불편을 드려 대단히 죄송합니다. 재발 방지를 위해 최선을 다하겠습니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

(9, (SELECT member_id FROM member WHERE login_id='manager01'),
 '고장 신고 앱 푸시 알림 기능 추가', 'U',
 '안녕하세요. 시설팀입니다. 고장 신고 앱에 푸시 알림 기능이 추가되었습니다. 민원 접수, 진행, 완료 시 실시간으로 알림을 받아보실 수 있습니다. 앱 설치 후 알림 허용을 눌러주셔야 정상적으로 수신됩니다. 문의: 시설팀 (내선 9000)',
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

(10, (SELECT member_id FROM member WHERE login_id='manager01'),
 '5월 시설 점검 일정 공지', 'G',
 '안녕하세요. 시설팀입니다. 2026년 5월 시설 정기 점검 일정을 공지드립니다. 1. 소방 설비 점검: 5월 15일. 2. 전기 설비 점검: 5월 20일. 3. 가스 설비 점검: 5월 27일. 점검 당일 해당 구역 출입이 제한될 수 있으니 협조 부탁드립니다. 문의: 시설팀 (내선 9000)',
 NOW(), NOW())

ON CONFLICT (notice_id) DO UPDATE SET
  notice_by       = EXCLUDED.notice_by,
  notice_title    = EXCLUDED.notice_title,
  notice_category = EXCLUDED.notice_category,
  notice_content  = EXCLUDED.notice_content,
  noticed_at      = EXCLUDED.noticed_at,
  updated_at      = EXCLUDED.updated_at;