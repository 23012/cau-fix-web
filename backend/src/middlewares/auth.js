const jwt = require('jsonwebtoken');
const memberModel = require('../models/memberModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

const getCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const matched = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!matched) return null;
  return matched.split('=')[1];
};

module.exports = async (req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const cookieToken = getCookieValue(cookieHeader, 'token');
  const auth = req.headers.authorization;
  const bearerToken = auth && auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DB에서 최신 role, dept를 조회하여 반영
    const member = await memberModel.findById(decoded.member_id);
    if (!member) {
      return res.status(401).json({ message: '존재하지 않는 회원입니다.' });
    }

    req.user = {
      ...decoded,
      role: member.role,
      dept: member.dept,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};