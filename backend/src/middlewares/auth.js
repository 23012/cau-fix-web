const jwt = require('jsonwebtoken');
const memberModel = require('../models/memberModel');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  const token = auth.split(' ')[1];

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