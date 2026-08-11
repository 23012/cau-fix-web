const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const memberModel = require('../models/memberModel');
const memberLogModel = require('../models/memberLogModel');
const accountSwitchModel = require('../models/accountSwitchModel');
require('dotenv').config();

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
});

const memberSummary = (member, extra = {}) => ({
  member_id: member.member_id,
  login_id: member.login_id,
  name: member.name,
  role: member.role,
  dept: member.dept,
  phone: member.phone,
  ...extra,
});

// 세션 토큰(JWT) 발급 + 쿠키 설정 (로그인과 동일 규칙)
const issueSession = (res, member, autoLogin) => {
  const token = jwt.sign(
    {
      member_id: member.member_id,
      login_id: member.login_id,
      role: member.role,
      dept: member.dept,
    },
    process.env.JWT_SECRET,
    { expiresIn: autoLogin ? '14d' : '8h' }
  );
  res.cookie('token', token, {
    ...cookieBase(),
    maxAge: autoLogin ? 14 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000,
  });
  return token;
};

const accountSwitchController = {
  // 현재 로그인한 계정(owner)의 전환 목록
  list: async (req, res) => {
    try {
      await accountSwitchModel.ensureTable();
      const rows = await accountSwitchModel.listByOwner(req.user.member_id);
      const accounts = rows.map((r) => ({
        member_id: r.member_id,
        login_id: r.login_id,
        name: r.name,
        role: r.role,
        dept: r.dept,
        revoked: r.revoked,
      }));
      return res.status(200).json({ accounts });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 계정 추가/재등록: 대상 아이디+비밀번호 검증 후 현재 계정 목록에 등록 (비밀번호는 저장하지 않음)
  add: async (req, res) => {
    try {
      await accountSwitchModel.ensureTable();
      const { login_id, password } = req.body;
      if (!login_id || !password) {
        return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
      }

      const target = await memberModel.findByLoginId(login_id);
      if (!target) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }
      const isMatch = await bcrypt.compare(password, target.password);
      if (!isMatch) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }
      if (!target.is_approved) {
        return res.status(403).json({ message: '관리자 승인 대기 중입니다.' });
      }
      if (target.member_id === req.user.member_id) {
        return res.status(400).json({ message: '현재 로그인된 계정입니다.' });
      }

      const account = {
        member_id: target.member_id,
        login_id: target.login_id,
        name: target.name,
        role: target.role,
        dept: target.dept,
        revoked: false,
      };

      // 이미 등록되어 있고 정상(비활성화 아님)이면 안내만 하고 그대로 둠
      const existing = await accountSwitchModel.findLink(req.user.member_id, target.member_id);
      if (existing && !existing.revoked) {
        return res.status(200).json({
          code: 'ALREADY_REGISTERED',
          message: '이미 등록된 계정입니다.',
          account,
        });
      }

      // 신규 등록, 또는 비밀번호 변경으로 무효화됐던 계정의 재활성화
      await accountSwitchModel.upsert(req.user.member_id, target.member_id);

      return res.status(200).json({
        code: existing ? 'REACTIVATED' : 'ADDED',
        message: existing ? '계정이 다시 등록되었습니다.' : '계정이 추가되었습니다.',
        account,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 계정 전환: 현재 계정 목록에 등록된(비활성화 안 된) 대상으로 세션 쿠키 재발급
  switch: async (req, res) => {
    try {
      await accountSwitchModel.ensureTable();
      const { member_id, auto_login } = req.body;
      if (!member_id) {
        return res.status(400).json({ message: '전환할 계정이 없습니다.' });
      }

      const link = await accountSwitchModel.findLink(req.user.member_id, member_id);
      if (!link) {
        return res.status(404).json({ code: 'NOT_FOUND', message: '등록되지 않은 계정입니다.' });
      }
      if (link.revoked) {
        return res.status(401).json({
          code: 'PASSWORD_CHANGED',
          message: '비밀번호가 일치하지 않습니다. 기존 계정을 삭제하고 다시 등록해주세요.',
        });
      }

      const member = await memberModel.findById(member_id);
      if (!member || member.is_deleted) {
        await accountSwitchModel.remove(req.user.member_id, member_id);
        return res.status(404).json({ code: 'NOT_FOUND', message: '존재하지 않는 회원입니다.' });
      }
      if (!member.is_approved) {
        return res.status(403).json({ message: '관리자 승인 대기 중입니다.' });
      }

      issueSession(res, member, !!auto_login);
      await accountSwitchModel.touch(req.user.member_id, member_id);

      const lastPwLog = await memberLogModel.findLastPasswordLog(member.member_id);
      const passwordReset = lastPwLog ? lastPwLog.done_by !== member.login_id : false;

      return res.status(200).json({
        message: '계정이 전환되었습니다.',
        member: memberSummary(member, { password_reset: passwordReset }),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 현재 계정 목록에서 제거
  remove: async (req, res) => {
    try {
      await accountSwitchModel.ensureTable();
      const { member_id } = req.params;
      await accountSwitchModel.remove(req.user.member_id, member_id);
      return res.status(200).json({ message: '계정이 목록에서 제거되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = accountSwitchController;
