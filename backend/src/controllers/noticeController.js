const noticeModel = require('../models/noticeModel');

const noticeController = {
  // 공지사항 등록 (처리자/관리자)
  create: async (req, res) => {
    try {
      const { role, member_id } = req.user;

      if (role === 'C') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { notice_title, notice_category, notice_content, notice_images } = req.body;

      if (!notice_title || !notice_category || !notice_content) {
        return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
      }

      const validCategories = ['G', 'U', 'F'];
      if (!validCategories.includes(notice_category)) {
        return res.status(400).json({ message: '유효하지 않은 카테고리입니다.' });
      }

      const notice = await noticeModel.create({
        notice_by: member_id,
        notice_title,
        notice_category,
        notice_content,
        notice_images: JSON.stringify(notice_images || []),
      });

      return res.status(201).json({ message: '공지사항이 등록되었습니다.', notice });
    } catch (err) {
      console.error('공지사항 등록 에러:', err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: err.message });
    }
  },

  // 공지사항 목록 조회 (전체)
  getAll: async (req, res) => {
    try {
      const notices = await noticeModel.findAll();
      return res.status(200).json({ notices });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 공지사항 상세 조회 (전체)
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const notice = await noticeModel.findById(id);

      if (!notice) {
        return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
      }

      return res.status(200).json({ notice });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 공지사항 수정 (작성자만)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id, role } = req.user;
      const { notice_title, notice_category, notice_content, notice_images } = req.body;

      if (!notice_title || !notice_category || !notice_content) {
        return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
      }

      const validCategories = ['G', 'U', 'F'];
      if (!validCategories.includes(notice_category)) {
        return res.status(400).json({ message: '유효하지 않은 카테고리입니다.' });
      }

      const notice = await noticeModel.findById(id);
      if (!notice) {
        return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
      }

      // 작성자 또는 관리자만 수정 가능
      if (notice.notice_by !== member_id && role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const updated = await noticeModel.update(id, {
        notice_title,
        notice_category,
        notice_content,
        notice_images: JSON.stringify(notice_images || []),
      });

      return res.status(200).json({ message: '공지사항이 수정되었습니다.', notice: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 공지사항 삭제 (작성자/관리자)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id, role } = req.user;

      const notice = await noticeModel.findById(id);
      if (!notice) {
        return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
      }

      // 작성자 또는 관리자만 삭제 가능
      if (notice.notice_by !== member_id && role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      await noticeModel.softDelete(id);
      return res.status(200).json({ message: '공지사항이 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = noticeController;