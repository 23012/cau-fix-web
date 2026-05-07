const { Pool, types } = require('pg');
require('dotenv').config();

// TIMESTAMP 타입을 문자열 그대로 반환 (UTC 변환 방지)
types.setTypeParser(1114, (val) => val);
// TIMESTAMPTZ 타입도 문자열 그대로 반환
types.setTypeParser(1184, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('DB connected');
});

pool.on('error', (err) => {
  console.error('DB error', err);
  process.exit(-1);
});

module.exports = pool;