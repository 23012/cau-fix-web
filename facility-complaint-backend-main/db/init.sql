-- ============================================================
-- 시설관리팀 고장 신고 앱 DB 스키마
-- PostgreSQL 18
-- ============================================================

-- ------------------------------------------------------------
-- ENUM 타입 정의
-- ------------------------------------------------------------
CREATE TYPE member_role AS ENUM ('C', 'E', 'A');
-- C: 사용자(user), E: 처리자(manager), A: 관리자(admin, 별도 지정)

CREATE TYPE complain_state AS ENUM ('B', 'A', 'P', 'D');
-- B: 접수전, A: 접수, P: 진행중, D: 완료

CREATE TYPE notice_category AS ENUM ('G', 'U', 'F');
-- G: 공지, U: 업데이트, F: 점검


-- ------------------------------------------------------------
-- 1. member (회원)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member (
    member_id       SERIAL          PRIMARY KEY,
    login_id        VARCHAR(20)     NOT NULL UNIQUE,  -- 사번 (영어+숫자)
    password        VARCHAR(255)    NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    role            member_role     NOT NULL DEFAULT 'C',
    dept            VARCHAR(255),
    phone           VARCHAR(20),
    is_approved     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMP
);

COMMENT ON TABLE  member               IS '회원';
COMMENT ON COLUMN member.login_id      IS '사번 - 영어+숫자, 로그인 아이디';
COMMENT ON COLUMN member.role          IS 'C: 사용자, E: 처리자, A: 관리자(별도 지정)';
COMMENT ON COLUMN member.is_approved   IS '관리자 승인 여부 (FALSE: 미승인 - 로그인 불가)';
COMMENT ON COLUMN member.is_deleted    IS '논리적 탈퇴 여부';
COMMENT ON COLUMN member.deleted_at    IS '탈퇴 일시';


-- ------------------------------------------------------------
-- 2. complain_category (민원 카테고리)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complain_category (
    category_id     SERIAL          PRIMARY KEY,
    category_name   VARCHAR(100)    NOT NULL,
    dept            VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  complain_category       IS '민원 카테고리';
COMMENT ON COLUMN complain_category.dept  IS '담당 부서 - 처리자의 dept와 매핑';


-- ------------------------------------------------------------
-- 3. complain (민원)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complain (
    complain_id      SERIAL          PRIMARY KEY,
    complain_by      INTEGER         NOT NULL REFERENCES member(member_id),
    category_id      INTEGER         NOT NULL REFERENCES complain_category(category_id),
    complain_title   VARCHAR(255)    NOT NULL,
    complain_content TEXT            NOT NULL,
    location         VARCHAR(255)    NOT NULL,
    state            complain_state  NOT NULL DEFAULT 'B',
    is_deleted       BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at       TIMESTAMP,
    complain_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  complain               IS '민원';
COMMENT ON COLUMN complain.state         IS 'B: 접수전, A: 접수, P: 진행중, D: 완료';
COMMENT ON COLUMN complain.is_deleted    IS '접수전(B) 상태에서만 민원인이 삭제 가능 - 백엔드에서 state 체크';
COMMENT ON COLUMN complain.complain_at   IS '작성 일시 (READ ONLY)';


-- ------------------------------------------------------------
-- 4. complain_img (민원 첨부 이미지)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complain_img (
    complain_img_id    SERIAL          PRIMARY KEY,
    complain_id        INTEGER         NOT NULL REFERENCES complain(complain_id),
    complain_img_order SMALLINT        NOT NULL,
    complain_img_url   VARCHAR(255)    NOT NULL,
    complain_img_size  INTEGER         NOT NULL,
    created_at         TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  complain_img                    IS '민원 첨부 이미지';
COMMENT ON COLUMN complain_img.complain_img_order IS '이미지 순서';
COMMENT ON COLUMN complain_img.complain_img_size  IS '파일 크기 (Byte)';
COMMENT ON COLUMN complain_img.complain_img_url   IS '서버 로컬 저장 경로 (/uploads/complain/파일명)';
COMMENT ON COLUMN complain_img.complain_id        IS '민원 삭제(is_deleted) 시 백엔드에서 이미지도 함께 삭제 처리';


-- ------------------------------------------------------------
-- 5. complain_state_history (민원 상태 변경 이력)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complain_state_history (
    state_history_id SERIAL          PRIMARY KEY,
    complain_id      INTEGER         NOT NULL REFERENCES complain(complain_id) ON DELETE RESTRICT,
    changed_by       INTEGER         NOT NULL REFERENCES member(member_id) ON DELETE RESTRICT,
    prev_state       complain_state  NOT NULL,
    next_state       complain_state  NOT NULL,
    changed_at       TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  complain_state_history             IS '민원 상태 변경 이력';
COMMENT ON COLUMN complain_state_history.changed_by  IS '상태를 변경한 처리자/관리자';
COMMENT ON COLUMN complain_state_history.prev_state  IS '변경 전 상태';
COMMENT ON COLUMN complain_state_history.next_state  IS '변경 후 상태';


-- ------------------------------------------------------------
-- 6. complaint_process (민원 처리 - 민원 1개당 1회)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_process (
    process_id      SERIAL      PRIMARY KEY,
    complain_id     INTEGER     NOT NULL UNIQUE REFERENCES complain(complain_id),
    process_by      INTEGER     NOT NULL REFERENCES member(member_id),
    process_content TEXT        NOT NULL,
    process_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  complaint_process             IS '민원 처리 (complain:process = 1:1)';
COMMENT ON COLUMN complaint_process.complain_id IS 'UNIQUE - 민원 1개당 처리 1회';
COMMENT ON COLUMN complaint_process.process_by  IS '처리한 담당자 (처리자 E 또는 관리자 A)';
COMMENT ON COLUMN complaint_process.process_id  IS '민원 삭제(is_deleted) 시 백엔드에서 process 및 process_img도 함께 처리';


-- ------------------------------------------------------------
-- 7. process_img (처리 첨부 이미지)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS process_img (
    process_img_id    SERIAL          PRIMARY KEY,
    process_id        INTEGER         NOT NULL REFERENCES complaint_process(process_id),
    process_img_order SMALLINT        NOT NULL,
    process_img_url   VARCHAR(255)    NOT NULL,
    process_img_size  INTEGER         NOT NULL,
    created_at        TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  process_img                   IS '처리 첨부 이미지';
COMMENT ON COLUMN process_img.process_img_order IS '이미지 순서';
COMMENT ON COLUMN process_img.process_img_size  IS '파일 크기 (Byte)';
COMMENT ON COLUMN process_img.process_img_url   IS '서버 로컬 저장 경로 (/uploads/process/파일명)';


-- ------------------------------------------------------------
-- 8. notice (공지사항)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notice (
    notice_id       SERIAL           PRIMARY KEY,
    notice_by       INTEGER          NOT NULL REFERENCES member(member_id),
    notice_title    VARCHAR(255)     NOT NULL,
    notice_category notice_category  NOT NULL DEFAULT 'G',
    notice_content  TEXT             NOT NULL,
    is_deleted      BOOLEAN          NOT NULL DEFAULT FALSE,
    noticed_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  notice                 IS '공지사항';
COMMENT ON COLUMN notice.notice_by       IS '처리자(E)만 작성 가능 - 백엔드에서 role 체크';
COMMENT ON COLUMN notice.notice_category IS 'G: 공지, U: 업데이트, F: 점검';
COMMENT ON COLUMN notice.is_deleted      IS '논리적 삭제';
COMMENT ON COLUMN notice.updated_at      IS '수정 시 백엔드에서 NOW()로 갱신';

-- notice updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_notice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notice_updated_at
BEFORE UPDATE ON notice
FOR EACH ROW
EXECUTE FUNCTION update_notice_updated_at();


-- ------------------------------------------------------------
-- 9. push_notification (푸시 알림)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_notification (
    push_id      SERIAL          PRIMARY KEY,
    complain_id  INTEGER         NOT NULL REFERENCES complain(complain_id),
    member_id    INTEGER         NOT NULL REFERENCES member(member_id),
    state        complain_state  NOT NULL,
    push_content TEXT            NOT NULL,
    is_read      BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at      TIMESTAMP,
    push_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  push_notification              IS '푸시 알림';
COMMENT ON COLUMN push_notification.complain_id  IS '민원 삭제(is_deleted) 시 백엔드에서 push도 함께 처리';
COMMENT ON COLUMN push_notification.state        IS '알림 발생 시점의 민원 상태 (B: 접수전, A: 접수, P: 진행중, D: 완료)';
COMMENT ON COLUMN push_notification.push_content IS '형식: "[complain_title]이(가) [state]되었습니다."';
COMMENT ON COLUMN push_notification.is_read      IS '읽음 여부 (알림함 뱃지 표시용)';
COMMENT ON COLUMN push_notification.read_at      IS '읽은 일시';


-- ------------------------------------------------------------
-- 인덱스
-- ------------------------------------------------------------
-- 민원 조회 최적화
CREATE INDEX idx_complain_complain_by ON complain(complain_by);
CREATE INDEX idx_complain_state       ON complain(state);
CREATE INDEX idx_complain_is_deleted  ON complain(is_deleted);

-- 상태 이력 조회 최적화
CREATE INDEX idx_state_history_complain_id ON complain_state_history(complain_id);

-- 알림 조회 최적화
CREATE INDEX idx_push_member_id ON push_notification(member_id);
CREATE INDEX idx_push_is_read   ON push_notification(is_read);

-- ------------------------------------------------------------
-- 시드 데이터 (개발용)
-- ------------------------------------------------------------

-- 카테고리
INSERT INTO complain_category (category_name, dept) VALUES
  ('건축/영선', '시설팀'),
  ('의료장비', '물류관리팀'),
  ('기계/소방', '시설팀'),
  ('전기/통신', '시설팀'),
  ('보안', '총무팀'),
  ('미화', '총무팀');

-- 관리자 계정 (비밀번호: admin1234!)
INSERT INTO member (login_id, password, name, role, dept, phone, is_approved)
VALUES (
  'admin',
  '$2b$10$3QxDjD1ylgPnRgQLhBrTaeqdsNaLxkk7gpdsFGUheGU2sXXoUrMq.',
  '관리자',
  'A',
  '관리팀',
  '010-0000-0000',
  TRUE
);