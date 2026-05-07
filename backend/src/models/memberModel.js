const pool = require('../config/db');

const memberModel = {
  // 사번 중복 확인
  findByLoginId: async (login_id) => {
    const result = await pool.query(
      'SELECT * FROM member WHERE login_id = $1 AND is_deleted = FALSE',
      [login_id]
    );
    return result.rows[0];
  },

  // 회원가입
  create: async ({ login_id, password, name, role, dept, phone }) => {
    const result = await pool.query(
      `INSERT INTO member (login_id, password, name, role, dept, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING member_id, login_id, name, role, dept, phone, is_approved, created_at`,
      [login_id, password, name, role, dept, phone]
    );
    return result.rows[0];
  },

  // 회원 목록 조회 (관리자)
  findAll: async () => {
    const result = await pool.query(
      `SELECT member_id, login_id, name, role, dept, phone, is_approved, created_at
       FROM member
       WHERE is_deleted = FALSE
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // 회원 단건 조회
  findById: async (member_id) => {
    const result = await pool.query(
      `SELECT member_id, login_id, name, role, dept, phone, is_approved, created_at
       FROM member
       WHERE member_id = $1 AND is_deleted = FALSE`,
      [member_id]
    );
    return result.rows[0];
  },

  // 담당 카테고리 처리자 조회 (민원 등록 시 알림 발송용)
  findManagersByCategory: async (category_name) => {
    const result = await pool.query(
      `SELECT member_id FROM member
       WHERE role = 'E'
         AND (dept = $1 OR dept = '전체')
         AND is_approved = TRUE
         AND is_deleted = FALSE`,
      [category_name]
    );
    return result.rows;
  },

  // 회원 승인
  approve: async (member_id) => {
    const result = await pool.query(
      `UPDATE member SET is_approved = TRUE
       WHERE member_id = $1
       RETURNING member_id, login_id, name, role, is_approved`,
      [member_id]
    );
    return result.rows[0];
  },

  // 권한 변경
  updateRole: async (member_id, role) => {
    const result = await pool.query(
      `UPDATE member SET role = $1
       WHERE member_id = $2
       RETURNING member_id, login_id, name, role, dept`,
      [role, member_id]
    );
    return result.rows[0];
  },

  // 담당 카테고리 변경 (관리자)
  updateDept: async (member_id, dept) => {
    const result = await pool.query(
      `UPDATE member SET dept = $1
       WHERE member_id = $2
       RETURNING member_id, login_id, name, role, dept, phone, is_approved`,
      [dept, member_id]
    );
    return result.rows[0];
  },

  // 내 정보 수정 (비밀번호, 전화번호)
  updateProfile: async (member_id, { password, phone }) => {
    if (password) {
      const result = await pool.query(
        `UPDATE member
         SET password = $1, phone = $2
         WHERE member_id = $3
         RETURNING member_id, login_id, name, role, dept, phone, is_approved, created_at`,
        [password, phone, member_id]
      );
      return result.rows[0];
    }
    const result = await pool.query(
      `UPDATE member
       SET phone = $1
       WHERE member_id = $2
       RETURNING member_id, login_id, name, role, dept, phone, is_approved, created_at`,
      [phone, member_id]
    );
    return result.rows[0];
  },

  // 마지막 로그인 시각 갱신
  updateLastLogin: async (member_id) => {
    await pool.query(
      'UPDATE member SET last_login_at = NOW() WHERE member_id = $1',
      [member_id]
    );
  },

  // 논리적 탈퇴
  softDelete: async (member_id) => {
    const result = await pool.query(
      `UPDATE member
       SET is_deleted = TRUE, deleted_at = NOW()
       WHERE member_id = $1
       RETURNING member_id`,
      [member_id]
    );
    return result.rows[0];
  },
};

module.exports = memberModel;