/**
 * 로컬 개발용 시드 스크립트 (운영에서 절대 실행 금지)
 *   node backend/scripts/seed-dev.js
 *
 * - 3개 역할 계정(사용자 C / 처리자 E / 관리자 A) 생성/갱신 (모두 승인됨)
 * - 카테고리가 없으면 기본 카테고리 삽입
 * - 샘플 민원을 여러 상태(접수전/접수/진행중/완료)로 삽입 (이미 있으면 건너뜀)
 *
 * 안전장치: DATABASE_URL이 localhost/127.0.0.1가 아니면 아무 것도 안 하고 즉시 중단한다.
 * 재실행 안전: 계정은 있으면 비밀번호/승인만 갱신, 민원은 이미 있으면 건너뜀.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// ── 안전장치: 로컬 DB가 아니면 즉시 중단 (운영 DB 오염 방지) ──────────────
const DB_URL = process.env.DATABASE_URL || '';
const IS_LOCAL = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(DB_URL);
if (!DB_URL) {
  console.error('❌ DATABASE_URL이 없습니다. 루트 .env를 먼저 만들어 주세요.');
  process.exit(1);
}
if (!IS_LOCAL) {
  console.error('❌ 안전장치 발동: DATABASE_URL이 로컬(localhost/127.0.0.1)이 아니라 중단합니다.');
  console.error('   이 스크립트는 로컬 전용입니다. 운영 DB에는 절대 실행하지 마세요.');
  console.error('   현재 대상:', DB_URL.replace(/(:\/\/[^:]+:)[^@]+@/, '$1***@'));
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });

const PASSWORD = 'password123'; // 정책: 영소문자+숫자 10자 이상
const ACCOUNTS = [
  { login_id: 'user01',    name: '김사용', role: 'C', dept: '디지털전략팀', phone: '010-1111-1111' },
  { login_id: 'manager01', name: '박처리', role: 'E', dept: '전체',        phone: '010-2222-2222' },
  { login_id: 'admin01',   name: '이관리', role: 'A', dept: '시설관리팀',  phone: '010-3333-3333' },
];

const DEFAULT_CATEGORIES = [
  ['영선', '시설팀'], ['기계', '시설팀'], ['소방', '시설팀'],
  ['전기/통신', '시설팀'], ['의료장비', '물류관리팀'], ['미화', '총무팀'],
];

async function upsertMember(m, hash) {
  const found = await pool.query(
    'SELECT member_id FROM member WHERE login_id = $1 AND is_deleted = FALSE',
    [m.login_id]
  );
  if (found.rows[0]) {
    const id = found.rows[0].member_id;
    await pool.query(
      `UPDATE member SET password = $1, name = $2, role = $3, dept = $4, phone = $5, is_approved = TRUE
       WHERE member_id = $6`,
      [hash, m.name, m.role, m.dept, m.phone, id]
    );
    return id;
  }
  const r = await pool.query(
    `INSERT INTO member (login_id, password, name, role, dept, phone, is_approved)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING member_id`,
    [m.login_id, hash, m.name, m.role, m.dept, m.phone]
  );
  return r.rows[0].member_id;
}

async function ensureCategories() {
  const { rows } = await pool.query('SELECT category_id FROM complain_category');
  if (rows.length === 0) {
    for (const [name, dept] of DEFAULT_CATEGORIES) {
      await pool.query(
        'INSERT INTO complain_category (category_name, dept) VALUES ($1, $2)',
        [name, dept]
      );
    }
  }
  const res = await pool.query('SELECT category_id, category_name FROM complain_category');
  const map = {};
  res.rows.forEach((r) => { map[r.category_name] = r.category_id; });
  return map;
}

// 접수 시각을 최근부터 시간 간격을 두고 배치 (최신순 정렬 확인용)
function hoursAgo(h) {
  const d = new Date(Date.now() - h * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function seedComplaints(userId, managerId, catMap) {
  const existing = await pool.query('SELECT COUNT(*) AS c FROM complain WHERE complain_by = $1', [userId]);
  if (parseInt(existing.rows[0].c) > 0) {
    console.log('· 샘플 민원이 이미 있어 건너뜀 (user01 소유 민원 존재)');
    return 0;
  }

  // [카테고리, 제목, 내용, 장소, 상태, 처리내용(완료 시), 몇시간전]
  const SAMPLES = [
    ['기계', '엘리베이터 소음', '3호기에서 덜컹거리는 소음이 납니다.', '본관 3층', 'B', null, 1],
    ['전기/통신', '복도 조명 깜빡임', '병동 복도 형광등이 깜빡입니다.', '서관 5층 복도', 'A', '', 3],
    ['영선', '문 손잡이 파손', '화장실 문 손잡이가 헐거워졌습니다.', '동관 2층 화장실', 'P', '', 6],
    ['소방', '소화기 압력 저하', '소화기 게이지가 빨간색입니다.', '지하 1층 주차장', 'D', '소화기 5대 교체 완료했습니다.', 20],
    ['의료장비', '수액대 바퀴 고장', '수액 거치대 바퀴가 빠졌습니다.', '303호 병실', 'B', null, 26],
    ['미화', '휴게실 청소 요청', '직원 휴게실 정리가 필요합니다.', '본관 7층 휴게실', 'D', '청소 및 비품 정리 완료.', 30],
    ['기계', '냉방 약함', '회의실 에어컨 바람이 약합니다.', '별관 대회의실', 'P', '', 34],
    ['전기/통신', '콘센트 불량', '연구실 콘센트가 안 됩니다.', '연구동 401호', 'A', '', 40],
    ['영선', '천장 누수 흔적', '천장에 물 얼룩이 보입니다.', '본관 로비', 'B', null, 48],
    ['기계', '급탕 온도 낮음', '온수가 미지근합니다.', '동관 샤워실', 'D', '온수 밸브 조정 및 배관 점검 완료.', 60],
  ];

  let inserted = 0;
  for (let i = 0; i < SAMPLES.length; i++) {
    const [cat, title, content, loc, state, result] = SAMPLES[i];
    const catId = catMap[cat];
    if (!catId) continue;
    // 먼저 삽입될수록(작은 id) 더 오래된 접수시간 → id 순서 = 접수시간 순서 (운영의 SERIAL과 동일)
    const hours = (SAMPLES.length - i) * 12;
    const c = await pool.query(
      `INSERT INTO complain (complain_by, category_id, complain_title, complain_content, location, state, complain_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING complain_id`,
      [userId, catId, title, content, loc, state, hoursAgo(hours)]
    );
    const complainId = c.rows[0].complain_id;

    // 접수(A)/진행중(P)/완료(D)면 처리 담당 배정. 완료면 처리내용 채움.
    if (['A', 'P', 'D'].includes(state)) {
      await pool.query(
        `INSERT INTO complaint_process (complain_id, process_by, process_content, process_at)
         VALUES ($1, $2, $3, $4)`,
        [complainId, managerId, state === 'D' ? result : '', hoursAgo(Math.max(0, hours - 1))]
      );
    }
    inserted += 1;
  }
  return inserted;
}

(async () => {
  try {
    console.log('▶ 대상 DB(로컬):', DB_URL.replace(/(:\/\/[^:]+:)[^@]+@/, '$1***@'));
    const hash = await bcrypt.hash(PASSWORD, 10);
    const ids = {};
    for (const m of ACCOUNTS) {
      ids[m.role] = await upsertMember(m, hash);
      console.log(`· 계정 준비: ${m.login_id} (${m.role}) → member_id=${ids[m.role]}`);
    }

    const catMap = await ensureCategories();
    console.log(`· 카테고리 ${Object.keys(catMap).length}개 확인`);

    const n = await seedComplaints(ids['C'], ids['E'], catMap);
    console.log(`· 샘플 민원 ${n}건 삽입`);

    console.log('\n✅ 시드 완료');
    console.log('   로그인 비밀번호(공통):', PASSWORD);
    console.log('   사용자 user01 / 처리자 manager01 / 관리자 admin01');
  } catch (e) {
    console.error('❌ 시드 실패:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
