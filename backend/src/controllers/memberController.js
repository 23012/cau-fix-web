const bcrypt = require('bcrypt');
const memberModel = require('../models/memberModel');
const memberLogModel = require('../models/memberLogModel');
const categoryModel = require('../models/categoryModel');

const memberController = {
  // 회원 목록 조회 (관리자)
  getAll: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      const members = await memberModel.findAll();
      return res.status(200).json({ members });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 회원 승인 (관리자)
  approve: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }
      if (member.is_approved) {
        return res.status(409).json({ message: '이미 승인된 회원입니다.' });
      }

      const adminName = req.user.login_id || 'admin';
      const updated = await memberModel.approve(id);
      await memberLogModel.create({ member_id: id, action: 'A', done_by: adminName });
      return res.status(200).json({ message: '승인이 완료되었습니다.', member: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 권한 변경 (관리자)
  updateRole: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!['C', 'E', 'A'].includes(role)) {
        return res.status(400).json({ message: '유효하지 않은 권한입니다.' });
      }

      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      const updated = await memberModel.updateRole(id, role);
      await memberLogModel.create({ member_id: id, action: 'R', done_by: req.user.login_id || 'admin', detail: `${member.role} → ${role}` });
      return res.status(200).json({ message: '권한이 변경되었습니다.', member: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 담당 카테고리 변경 (관리자)
  updateDept: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const { dept } = req.body;

      // DB에서 유효한 카테고리 목록 조회
      const categories = await categoryModel.findAll();
      const validDepts = ['전체', ...categories.map((c) => c.category_name)];

      if (!dept || !validDepts.includes(dept)) {
        return res.status(400).json({
          message: '유효하지 않은 카테고리입니다.',
          valid: validDepts,
        });
      }

      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      if (member.role !== 'E') {
        return res.status(400).json({ message: '처리자만 담당 카테고리를 변경할 수 있습니다.' });
      }

      const updated = await memberModel.updateDept(id, dept);
      return res.status(200).json({ message: '담당 카테고리가 변경되었습니다.', member: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 내 정보 수정 (본인)
  updateProfile: async (req, res) => {
    try {
      const { password, phone, dept } = req.body;
      const member_id = req.user.member_id;

      // 하나도 입력 안 했으면 에러
      if (!password && !phone && !dept) {
        return res.status(400).json({ message: '수정할 항목을 입력해주세요.' });
      }

      const member = await memberModel.findById(member_id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const updated = await memberModel.updateProfile(member_id, {
        password: hashedPassword,
        phone: phone || member.phone,
        dept: dept || member.dept,
      });

      return res.status(200).json({ message: '내 정보가 수정되었습니다.', member: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 비밀번호 초기화 (관리자)
  resetPassword: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      // 비밀번호를 아이디로 초기화
      const hashedPassword = await bcrypt.hash(member.login_id, 10);
      await memberModel.resetPassword(id, hashedPassword);
      await memberLogModel.create({ member_id: id, action: 'P', done_by: req.user.login_id || 'admin' });
      //비밀번호 초기화 => db 데이터 
      return res.status(200).json({ message: '비밀번호가 초기화되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 회원 탈퇴 (관리자만)
  delete: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
      }

      // 관리자 본인 비밀번호 확인
      const admin = await memberModel.findByLoginId(req.user.login_id);
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      await memberModel.softDelete(id);
      await memberLogModel.create({ member_id: id, action: 'D', done_by: req.user.login_id || 'admin' });
      return res.status(200).json({ message: '탈퇴 처리가 완료되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 프로필 조회 (처리자 정보 - 민원 상세에서 사용)
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;

      const member = await memberModel.findById(id);
      if (!member) {
        return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
      }

      return res.status(200).json({
        profile: {
          name: member.name,
          dept: member.dept,
          phone: member.phone,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 회원 로그 조회 (관리자)
  getLogs: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      const { id } = req.params;
      const logs = await memberLogModel.findByMemberId(id);
      return res.status(200).json({ logs });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = memberController;