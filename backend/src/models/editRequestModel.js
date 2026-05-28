const pool = require('../config/db');

const editRequestModel = {
  /**
   * complaint_edit_requests 테이블 자동 생성 (없으면)
   * complain_state ENUM에 'R' 값 추가 (수정 요청 알림용)
   */
  ensureTable: async () => {
    // ENUM에 'R' 값 추가 (이미 있으면 무시)
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'R'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'complain_state')
        ) THEN
          ALTER TYPE complain_state ADD VALUE 'R';
        END IF;
      END$$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaint_edit_requests (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER NOT NULL REFERENCES complain(complain_id),
        requester_id INTEGER NOT NULL REFERENCES member(member_id),
        reason_type VARCHAR(50) NOT NULL,
        detail TEXT DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  },

  /**
   * 수정 요청 생성
   */
  create: async ({ complaint_id, requester_id, reason_type, detail }) => {
    const result = await pool.query(
      `INSERT INTO complaint_edit_requests (complaint_id, requester_id, reason_type, detail)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [complaint_id, requester_id, reason_type, detail]
    );
    return result.rows[0];
  },

  /**
   * 민원의 PENDING 상태 수정 요청 조회
   */
  findPendingByComplaintId: async (complaint_id) => {
    const result = await pool.query(
      `SELECT er.*, m.name AS requester_name
       FROM complaint_edit_requests er
       JOIN member m ON er.requester_id = m.member_id
       WHERE er.complaint_id = $1 AND er.status = 'PENDING'
       ORDER BY er.created_at DESC
       LIMIT 1`,
      [complaint_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      complaintId: row.complaint_id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      reasonType: row.reason_type,
      detail: row.detail,
      status: row.status,
      createdAt: row.created_at,
    };
  },
};

module.exports = editRequestModel;
