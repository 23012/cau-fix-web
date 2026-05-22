const pool = require('../config/db');

const categoryMap = { G: '공지', U: '업데이트', F: '점검' };

const noticeModel = {
  // 공지사항 등록
  create: async ({ notice_by, notice_title, notice_category, notice_content }) => {
    const result = await pool.query(
      `INSERT INTO notice (notice_by, notice_title, notice_category, notice_content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [notice_by, notice_title, notice_category, notice_content]
    );
    return result.rows[0];
  },

  // 공지사항 목록 조회
  findAll: async () => {
    const result = await pool.query(
      `SELECT n.*, m.name AS author
       FROM notice n
       JOIN member m ON n.notice_by = m.member_id
       WHERE n.is_deleted = FALSE
       ORDER BY n.noticed_at DESC`
    );
    return result.rows.map((row) => ({
      id: row.notice_id,
      notice_by: row.notice_by,
      title: row.notice_title,
      category: categoryMap[row.notice_category] || row.notice_category,
      content: row.notice_content,
      author: row.author,
      date: row.noticed_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted,
    }));
  },

  // 공지사항 단건 조회
  findById: async (notice_id) => {
    const result = await pool.query(
      `SELECT n.*, m.name AS author
       FROM notice n
       JOIN member m ON n.notice_by = m.member_id
       WHERE n.notice_id = $1 AND n.is_deleted = FALSE`,
      [notice_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.notice_id,
      notice_by: row.notice_by,
      title: row.notice_title,
      category: categoryMap[row.notice_category] || row.notice_category,
      content: row.notice_content,
      author: row.author,
      date: row.noticed_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted,
    };
  },

  // 공지사항 수정
  update: async (notice_id, { notice_title, notice_category, notice_content }) => {
    const result = await pool.query(
      `UPDATE notice
       SET notice_title = $1, notice_category = $2, notice_content = $3, noticed_at = NOW()
       WHERE notice_id = $4
       RETURNING *`,
      [notice_title, notice_category, notice_content, notice_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.notice_id,
      title: row.notice_title,
      category: categoryMap[row.notice_category] || row.notice_category,
      content: row.notice_content,
      date: row.noticed_at,
      updated_at: row.updated_at,
    };
  },

  // 공지사항 삭제 (논리적)
  softDelete: async (notice_id) => {
    const result = await pool.query(
      `UPDATE notice
       SET is_deleted = TRUE
       WHERE notice_id = $1
       RETURNING notice_id`,
      [notice_id]
    );
    return result.rows[0];
  },
};

module.exports = noticeModel;