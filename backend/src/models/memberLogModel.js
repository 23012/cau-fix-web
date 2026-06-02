const pool = require('../config/db');

const memberLogModel = {
  // 로그 추가
  create: async ({ member_id, action, done_by, detail }) => {
    const result = await pool.query(
      `INSERT INTO member_log (member_id, action, done_by, detail)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [member_id, action, done_by, detail || null]
    );
    return result.rows[0];
  },

  // 특정 회원의 로그 조회
  findByMemberId: async (member_id) => {
    const result = await pool.query(
      `SELECT * FROM member_log
       WHERE member_id = $1
       ORDER BY created_at DESC`,
      [member_id]
    );
    return result.rows;
  },

  // 마지막 비밀번호 변경 로그 조회 (P = 비밀번호 변경)
  findLastPasswordLog: async (member_id) => {
    const result = await pool.query(
      `SELECT * FROM member_log
       WHERE member_id = $1 AND action = 'P'
       ORDER BY created_at DESC
       LIMIT 1`,
      [member_id]
    );
    return result.rows[0] || null;
  },
};

module.exports = memberLogModel;
