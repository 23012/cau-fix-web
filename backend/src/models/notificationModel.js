const pool = require('../config/db');
const { stateMap } = require('./complainModel');

const notificationModel = {
  // 알림 목록 조회 (최근 7일, 본인)
  findByMember: async (member_id) => {
    const result = await pool.query(
      `SELECT p.*, c.complain_title
       FROM push_notification p
       JOIN complain c ON p.complain_id = c.complain_id
       WHERE p.member_id = $1
         AND p.push_at >= NOW() - INTERVAL '7 days'
       ORDER BY p.push_at DESC`,
      [member_id]
    );
    return result.rows.map((row) => ({
      id: row.push_id,
      complainId: row.complain_id,
      title: row.complain_title,
      content: row.push_content,
      state: stateMap[row.state] || row.state,
      read: row.is_read,
      readAt: row.read_at,
      time: row.push_at,
    }));
  },

  // 읽지 않은 알림 수
  countUnread: async (member_id) => {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM push_notification
       WHERE member_id = $1
         AND is_read = FALSE
         AND push_at >= NOW() - INTERVAL '7 days'`,
      [member_id]
    );
    return parseInt(result.rows[0].count);
  },

  // 알림 단건 조회
  findById: async (push_id) => {
    const result = await pool.query(
      `SELECT * FROM push_notification WHERE push_id = $1`,
      [push_id]
    );
    return result.rows[0];
  },

  // 알림 읽음 처리
  markAsRead: async (push_id, member_id) => {
    const result = await pool.query(
      `UPDATE push_notification
       SET is_read = TRUE, read_at = NOW()
       WHERE push_id = $1 AND member_id = $2
       RETURNING *`,
      [push_id, member_id]
    );
    return result.rows[0];
  },

  // 전체 읽음 처리
  markAllAsRead: async (member_id) => {
    await pool.query(
      `UPDATE push_notification
       SET is_read = TRUE, read_at = NOW()
       WHERE member_id = $1 AND is_read = FALSE`,
      [member_id]
    );
  },

  // 민원인 알림 생성 (상태 변경 시)
  create: async ({ complain_id, member_id, state, complain_title }) => {
    const stateText = stateMap[state] || state;
    const push_content = `"${complain_title}"이(가) ${stateText} 처리되었습니다.`;
    const result = await pool.query(
      `INSERT INTO push_notification (complain_id, member_id, state, push_content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [complain_id, member_id, state, push_content]
    );
    return result.rows[0];
  },

  // 처리자 알림 생성 (민원 등록 시)
  createForManagers: async ({ complain_id, manager_ids, state, complain_title }) => {
    const push_content = `새 민원이 접수되었습니다 "${complain_title}"`;
    const promises = manager_ids.map((manager_id) =>
      pool.query(
        `INSERT INTO push_notification (complain_id, member_id, state, push_content)
         VALUES ($1, $2, $3, $4)`,
        [complain_id, manager_id, state, push_content]
      )
    );
    await Promise.all(promises);
  },
};

module.exports = notificationModel;