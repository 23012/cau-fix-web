-- 회원 관리 로그 액션 ENUM
-- A: 회원가입 승인, R: 역할 변경, D: 부서 변경, P: 비밀번호 초기화
CREATE TYPE member_log_action AS ENUM ('A', 'R', 'D', 'P');

-- 회원 관리 로그 테이블
CREATE TABLE IF NOT EXISTS member_log (
    log_id      SERIAL              PRIMARY KEY,
    member_id   INTEGER             NOT NULL REFERENCES member(member_id),
    action      member_log_action   NOT NULL,
    done_by     VARCHAR(255)        NOT NULL,
    detail      TEXT,
    created_at  TIMESTAMP           NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_log_member_id ON member_log(member_id);
