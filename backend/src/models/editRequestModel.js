const pool = require('../config/db');

// edit_request_status ENUM 매핑
const EDIT_REQUEST_STATUS = {
  PENDING: 'P',
  APPROVED: 'A',
  REJECTED: 'R',
  COMPLETED: 'C',
};

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
        status edit_request_status NOT NULL DEFAULT 'P',
        prev_state CHAR(1) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  },

  /**
   * 수정 요청 생성
   */
  create: async ({ complaint_id, requester_id, reason_type, detail, prev_state }) => {
    const result = await pool.query(
      `INSERT INTO complaint_edit_requests (complaint_id, requester_id, reason_type, detail, prev_state)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [complaint_id, requester_id, reason_type, detail, prev_state || null]
    );
    return result.rows[0];
  },

  /**
   * 수정 요청 단건 조회
   */
  findById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM complaint_edit_requests WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * 민원의 PENDING 상태 수정 요청 조회
   */
  findPendingByComplaintId: async (complaint_id) => {
    const result = await pool.query(
      `SELECT er.*, m.name AS requester_name
       FROM complaint_edit_requests er
       JOIN member m ON er.requester_id = m.member_id
       WHERE er.complaint_id = $1 AND er.status = $2
       ORDER BY er.created_at DESC
       LIMIT 1`,
      [complaint_id, EDIT_REQUEST_STATUS.PENDING]
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
      prevState: row.prev_state,
      createdAt: row.created_at,
    };
  },

  /**
   * 수정 요청 상태 변경
   */
  updateStatus: async (id, status) => {
    const result = await pool.query(
      `UPDATE complaint_edit_requests SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  /**
   * 전체 PENDING 수정 요청 목록 (관리자용)
   */
  findAllPending: async () => {
    const result = await pool.query(
      `SELECT er.*, c.complain_title, m.name AS requester_name
       FROM complaint_edit_requests er
       JOIN complain c ON er.complaint_id = c.complain_id
       JOIN member m ON er.requester_id = m.member_id
       WHERE er.status = $1
       ORDER BY er.created_at DESC`,
      [EDIT_REQUEST_STATUS.PENDING]
    );
    return result.rows.map(row => ({
      id: row.id,
      complaintId: row.complaint_id,
      complaintTitle: row.complain_title,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      reasonType: row.reason_type,
      detail: row.detail,
      status: row.status,
      prevState: row.prev_state,
      createdAt: row.created_at,
    }));
  },
};

module.exports = editRequestModel;
module.exports.EDIT_REQUEST_STATUS = EDIT_REQUEST_STATUS;
