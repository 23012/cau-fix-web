const pool = require('../config/db');

let ensured = false;

const accountSwitchModel = {
  /**
   * account_link 테이블 자동 생성 (없으면)
   * owner_id(로그인한 계정)가 자신의 전환 목록에 등록한 member_id(대상 계정).
   * 목록은 "계정 소유"라 로그아웃/재로그인/기기와 무관하게 유지된다.
   * 비밀번호는 저장하지 않는다. revoked=true 이면 대상 계정의 비밀번호가 바뀌어 재등록이 필요한 상태.
   */
  ensureTable: async () => {
    if (ensured) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_link (
        owner_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES member(member_id) ON DELETE CASCADE,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (owner_id, member_id)
      )
    `);
    ensured = true;
  },

  /**
   * 계정 등록(또는 재등록). 이미 있으면 revoked 해제하고 last_used 갱신.
   */
  upsert: async (owner_id, member_id) => {
    const result = await pool.query(
      `INSERT INTO account_link (owner_id, member_id, revoked, last_used_at)
       VALUES ($1, $2, FALSE, NOW())
       ON CONFLICT (owner_id, member_id)
       DO UPDATE SET revoked = FALSE, last_used_at = NOW()
       RETURNING *`,
      [owner_id, member_id]
    );
    return result.rows[0];
  },

  /**
   * 특정 계정(owner)의 전환 목록 (탈퇴 회원 제외). 최근 사용 순.
   */
  listByOwner: async (owner_id) => {
    const result = await pool.query(
      `SELECT al.member_id, al.revoked, al.last_used_at,
              m.login_id, m.name, m.role, m.dept
       FROM account_link al
       JOIN member m ON m.member_id = al.member_id
       WHERE al.owner_id = $1 AND m.is_deleted = FALSE
       ORDER BY al.last_used_at DESC NULLS LAST, al.created_at DESC`,
      [owner_id]
    );
    return result.rows;
  },

  findLink: async (owner_id, member_id) => {
    const result = await pool.query(
      `SELECT * FROM account_link WHERE owner_id = $1 AND member_id = $2`,
      [owner_id, member_id]
    );
    return result.rows[0] || null;
  },

  touch: async (owner_id, member_id) => {
    await pool.query(
      `UPDATE account_link SET last_used_at = NOW()
       WHERE owner_id = $1 AND member_id = $2`,
      [owner_id, member_id]
    );
  },

  remove: async (owner_id, member_id) => {
    await pool.query(
      `DELETE FROM account_link WHERE owner_id = $1 AND member_id = $2`,
      [owner_id, member_id]
    );
  },

  /**
   * 대상 계정(member_id)의 비밀번호가 변경/초기화되면,
   * 그 계정을 자신의 목록에 등록해둔 모든 소유자의 링크를 무효화(재등록 유도).
   * (테이블이 아직 없는 운영 초기 상태에서도 안전하도록 ensureTable 선행)
   */
  revokeByMember: async (member_id) => {
    await accountSwitchModel.ensureTable();
    await pool.query(
      `UPDATE account_link SET revoked = TRUE WHERE member_id = $1`,
      [member_id]
    );
  },
};

module.exports = accountSwitchModel;
