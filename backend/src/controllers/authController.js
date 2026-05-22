const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const memberModel = require('../models/memberModel');
require('dotenv').config();

const authController = {
  // 아이디 중복 확인
  checkId: async (req, res) => {
    try {
      const { login_id } = req.params;

      if (!login_id || !login_id.trim()) {
        return res.status(400).json({ message: '아이디를 입력해주세요.' });
      }

      const existing = await memberModel.findByLoginId(login_id);

      if (existing) {
        return res.status(200).json({ available: false, message: '이미 사용 중인 아이디입니다.' });
      }

      return res.status(200).json({ available: true, message: '사용 가능한 아이디입니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 회원가입
  register: async (req, res) => {
    try {
      const { login_id, password, name, role, dept, phone } = req.body;

      if (!login_id || !password || !name || !role) {
        return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
      }

      if (!['C', 'E'].includes(role)) {
        return res.status(400).json({ message: '유효하지 않은 권한입니다.' });
      }

      const existing = await memberModel.findByLoginId(login_id);
      if (existing) {
        return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const member = await memberModel.create({
        login_id,
        password: hashedPassword,
        name,
        role,
        dept,
        phone,
      });

      return res.status(201).json({
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.',
        member,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 로그인
  login: async (req, res) => {
    try {
      const { login_id, password } = req.body;

      if (!login_id || !password) {
        return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
      }
      // 아이디 확인
      const member = await memberModel.findByLoginId(login_id);
      if (!member) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 비밀번호 확인
      const isMatch = await bcrypt.compare(password, member.password);
      if (!isMatch) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }
      
      if (!member.is_approved) {
        return res.status(403).json({ message: '관리자 승인 대기 중입니다.' });
      }

      await memberModel.updateLastLogin(member.member_id);

      const token = jwt.sign(
        {
          member_id: member.member_id,
          login_id: member.login_id,
          role: member.role,
          dept: member.dept,
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.status(200).json({
        message: '로그인 성공',
        token,
        member: {
          member_id: member.member_id,
          login_id: member.login_id,
          name: member.name,
          role: member.role,
          dept: member.dept,
          phone: member.phone,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 내 정보 조회
  me: async (req, res) => {
    try {
      const member = await memberModel.findById(req.user.member_id);
      if (!member) {
        return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
      }
      return res.status(200).json({ member });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 로그아웃
  logout: async (req, res) => {
    return res.status(200).json({ message: '로그아웃 되었습니다.' });
  },
};

module.exports = authController;