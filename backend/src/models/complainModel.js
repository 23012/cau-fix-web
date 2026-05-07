const pool = require('../config/db');

const stateMap = { B: '접수전', A: '접수', P: '진행중', D: '완료' };
const stateReverseMap = { '접수전': 'B', '접수': 'A', '진행중': 'P', '완료': 'D' };

const formatComplain = (row) => ({
  id: row.complain_id,
  complain_by: row.complain_by,
  category_id: row.category_id,
  title: row.complain_title,
  content: row.complain_content,
  location: row.location,
  status: stateMap[row.state] || row.state,
  category: row.category_name,
  dept: row.dept,
  memberName: row.member_name,
  memberDept: row.member_dept,
  date: row.complain_at,
  is_deleted: row.is_deleted,
  deleted_at: row.deleted_at,
});

const complainModel = {
  // 민원 등록
  create: async ({ complain_by, category_id, complain_title, complain_content, location }) => {
    const result = await pool.query(
      `INSERT INTO complain (complain_by, category_id, complain_title, complain_content, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [complain_by, category_id, complain_title, complain_content, location]
    );
    const row = result.rows[0];
    return {
      id: row.complain_id,
      complain_by: row.complain_by,
      category_id: row.category_id,
      title: row.complain_title,
      content: row.complain_content,
      location: row.location,
      status: stateMap[row.state] || row.state,
      date: row.complain_at,
      is_deleted: row.is_deleted,
    };
  },

  // category_id로 category_name 조회
  findCategoryById: async (category_id) => {
    const result = await pool.query(
      'SELECT category_name FROM complain_category WHERE category_id = $1',
      [category_id]
    );
    return result.rows[0];
  },

  // 민원 목록 조회 - 필터링 포함
  findWithFilter: async ({ role, member_id, dept, category, status, startDate, endDate }) => {
    const conditions = ['c.is_deleted = FALSE'];
    const params = [];
    let paramIndex = 1;

    // 역할별 기본 조건
    if (role === 'C') {
      conditions.push(`c.complain_by = $${paramIndex++}`);
      params.push(member_id);
    } else if (role === 'E' && dept !== '전체') {
      conditions.push(`cc.category_name = $${paramIndex++}`);
      params.push(dept);
    }

    // 카테고리 필터
    if (category) {
      conditions.push(`cc.category_name = $${paramIndex++}`);
      params.push(category);
    }

    // 상태 필터
    if (status) {
      const stateCode = stateReverseMap[status];
      if (stateCode) {
        conditions.push(`c.state = $${paramIndex++}`);
        params.push(stateCode);
      }
    }

    // 시작 날짜 필터
    if (startDate) {
      conditions.push(`c.complain_at >= $${paramIndex++}`);
      params.push(startDate);
    }

    // 종료 날짜 필터
    if (endDate) {
      conditions.push(`c.complain_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT c.*, cc.category_name, cc.dept,
              m.name AS member_name, m.dept AS member_dept
       FROM complain c
       JOIN complain_category cc ON c.category_id = cc.category_id
       JOIN member m ON c.complain_by = m.member_id
       WHERE ${whereClause}
       ORDER BY c.complain_at DESC`,
      params
    );
    return result.rows.map(formatComplain);
  },

  // 민원 목록 조회 - 사용자(C): 본인만
  findByMember: async (member_id) => {
    const result = await pool.query(
      `SELECT c.*, cc.category_name, cc.dept,
              m.name AS member_name, m.dept AS member_dept
       FROM complain c
       JOIN complain_category cc ON c.category_id = cc.category_id
       JOIN member m ON c.complain_by = m.member_id
       WHERE c.complain_by = $1 AND c.is_deleted = FALSE
       ORDER BY c.complain_at DESC`,
      [member_id]
    );
    return result.rows.map(formatComplain);
  },

  // 민원 목록 조회 - 처리자(E): 담당 카테고리만
  findByDept: async (dept) => {
    if (dept === '전체') {
      const result = await pool.query(
        `SELECT c.*, cc.category_name, cc.dept,
                m.name AS member_name, m.dept AS member_dept
         FROM complain c
         JOIN complain_category cc ON c.category_id = cc.category_id
         JOIN member m ON c.complain_by = m.member_id
         WHERE c.is_deleted = FALSE
         ORDER BY c.complain_at DESC`
      );
      return result.rows.map(formatComplain);
    }

    const result = await pool.query(
      `SELECT c.*, cc.category_name, cc.dept,
              m.name AS member_name, m.dept AS member_dept
       FROM complain c
       JOIN complain_category cc ON c.category_id = cc.category_id
       JOIN member m ON c.complain_by = m.member_id
       WHERE cc.category_name = $1 AND c.is_deleted = FALSE
       ORDER BY c.complain_at DESC`,
      [dept]
    );
    return result.rows.map(formatComplain);
  },

  // 민원 목록 조회 - 관리자(A): 전체
  findAll: async () => {
    const result = await pool.query(
      `SELECT c.*, cc.category_name, cc.dept,
              m.name AS member_name, m.dept AS member_dept
       FROM complain c
       JOIN complain_category cc ON c.category_id = cc.category_id
       JOIN member m ON c.complain_by = m.member_id
       WHERE c.is_deleted = FALSE
       ORDER BY c.complain_at DESC`
    );
    return result.rows.map(formatComplain);
  },

  // 민원 단건 조회
  findById: async (complain_id) => {
    const result = await pool.query(
      `SELECT c.*, cc.category_name, cc.dept,
              m.name AS member_name, m.dept AS member_dept
       FROM complain c
       JOIN complain_category cc ON c.category_id = cc.category_id
       JOIN member m ON c.complain_by = m.member_id
       WHERE c.complain_id = $1 AND c.is_deleted = FALSE`,
      [complain_id]
    );
    if (!result.rows[0]) return null;
    return formatComplain(result.rows[0]);
  },

  // 민원 이미지 목록 조회
  findImages: async (complain_id) => {
    const result = await pool.query(
      `SELECT complain_img_id AS id, complain_img_url AS url,
              complain_img_order AS order, complain_img_size AS size
       FROM complain_img
       WHERE complain_id = $1
       ORDER BY complain_img_order ASC`,
      [complain_id]
    );
    return result.rows;
  },

  // 처리 이미지 목록 조회
  findProcessImages: async (process_id) => {
    const result = await pool.query(
      `SELECT process_img_id AS id, process_img_url AS url,
              process_img_order AS order, process_img_size AS size
       FROM process_img
       WHERE process_id = $1
       ORDER BY process_img_order ASC`,
      [process_id]
    );
    return result.rows;
  },

  // 민원 수정 (접수전 본인만)
  update: async (complain_id, { category_id, complain_title, complain_content, location }) => {
    const result = await pool.query(
      `UPDATE complain
       SET category_id = $1, complain_title = $2, complain_content = $3, location = $4
       WHERE complain_id = $5
       RETURNING *`,
      [category_id, complain_title, complain_content, location, complain_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.complain_id,
      title: row.complain_title,
      content: row.complain_content,
      location: row.location,
      status: stateMap[row.state] || row.state,
      date: row.complain_at,
    };
  },

  // 민원 삭제 (논리적)
  softDelete: async (complain_id) => {
    const result = await pool.query(
      `UPDATE complain
       SET is_deleted = TRUE, deleted_at = NOW()
       WHERE complain_id = $1
       RETURNING complain_id`,
      [complain_id]
    );
    return result.rows[0];
  },

  // 민원 상태 변경
  updateState: async (complain_id, state) => {
    const result = await pool.query(
      `UPDATE complain SET state = $1 WHERE complain_id = $2 RETURNING *`,
      [state, complain_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: row.complain_id,
      title: row.complain_title,
      status: stateMap[row.state] || row.state,
      date: row.complain_at,
    };
  },

  // 처리 등록
  createProcess: async ({ complain_id, process_by, process_content }) => {
    const result = await pool.query(
      `INSERT INTO complaint_process (complain_id, process_by, process_content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [complain_id, process_by, process_content]
    );
    return result.rows[0];
  },

  // 처리 조회
  findProcess: async (complain_id) => {
    const result = await pool.query(
      `SELECT cp.*, m.name AS process_by_name
       FROM complaint_process cp
       JOIN member m ON cp.process_by = m.member_id
       WHERE cp.complain_id = $1`,
      [complain_id]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      process_id: row.process_id,
      result: row.process_content,
      resultPerson: row.process_by_name,
      resultDate: row.process_at,
    };
  },

  // 상태 변경 이력 등록
  createStateHistory: async ({ complain_id, changed_by, prev_state, next_state }) => {
    const result = await pool.query(
      `INSERT INTO complain_state_history (complain_id, changed_by, prev_state, next_state)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [complain_id, changed_by, prev_state, next_state]
    );
    return result.rows[0];
  },
};

module.exports = complainModel;