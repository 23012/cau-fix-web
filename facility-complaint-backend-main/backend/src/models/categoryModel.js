const pool = require('../config/db');

const categoryModel = {
  // 카테고리 목록 조회 (민원 등록용 - 전체 제외)
  findAll: async () => {
    const result = await pool.query(
      `SELECT category_id, category_name, dept
       FROM complain_category
       ORDER BY category_id ASC`
    );
    return result.rows;
  },

  // 카테고리 목록 조회 (처리자 가입용 - 전체 포함)
  findAllWithTotal: async () => {
    const result = await pool.query(
      `SELECT category_id, category_name, dept
       FROM complain_category
       ORDER BY category_id ASC`
    );
    const categories = result.rows;
    // 전체 옵션 추가
    return [{ category_id: 0, category_name: '전체', dept: null }, ...categories];
  },

  // 카테고리 등록 (관리자)
  create: async ({ category_name, dept }) => {
    const result = await pool.query(
      `INSERT INTO complain_category (category_name, dept)
       VALUES ($1, $2)
       RETURNING *`,
      [category_name, dept]
    );
    return result.rows[0];
  },

  // 카테고리 수정 (관리자)
  update: async (category_id, { category_name, dept }) => {
    const result = await pool.query(
      `UPDATE complain_category
       SET category_name = $1, dept = $2
       WHERE category_id = $3
       RETURNING *`,
      [category_name, dept, category_id]
    );
    return result.rows[0];
  },

  // 카테고리 삭제 (관리자)
  delete: async (category_id) => {
    const result = await pool.query(
      `DELETE FROM complain_category
       WHERE category_id = $1
       RETURNING category_id`,
      [category_id]
    );
    return result.rows[0];
  },

  // 카테고리 단건 조회
  findById: async (category_id) => {
    const result = await pool.query(
      `SELECT * FROM complain_category WHERE category_id = $1`,
      [category_id]
    );
    return result.rows[0];
  },
};

module.exports = categoryModel;