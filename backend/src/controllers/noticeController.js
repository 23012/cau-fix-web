const noticeModel = require('../models/noticeModel');
const sanitizeHtmlLib = require('sanitize-html');

// 검증된 라이브러리 기반 HTML 살균 (정규식 방식은 우회 가능하여 교체)
// 공지 에디터가 생성하는 서식 태그 + 붙여넣기 base64 이미지를 허용하되,
// script/이벤트 핸들러/javascript: 등 위험 요소는 제거한다.
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtmlLib(html, {
    allowedTags: [
      'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's',
      'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote',
      'pre', 'code', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      span: ['style'],
      div: ['style'],
      p: ['style'],
    },
    allowedStyles: {
      '*': {
        'max-width': [/^[\d.]+(px|em|rem|%)$/],
        'width': [/^[\d.]+(px|em|rem|%)$/],
        'border-radius': [/^[\d.]+(px|em|rem|%)$/],
        'margin': [/^[\d.\s]+(px|em|rem|%)?$/],
        'text-align': [/^(left|right|center|justify)$/],
        'font-weight': [/^(normal|bold|\d{3})$/],
        'font-style': [/^(normal|italic)$/],
        'text-decoration': [/^(none|underline|line-through)$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
};

const noticeController = {
  // 공지사항 등록 (관리자만)
  create: async (req, res) => {
    try {
      const { role, member_id } = req.user;

      if (role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { notice_title, notice_category, notice_content } = req.body;

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
        notice_content: sanitizeHtml(notice_content),
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
      const sanitizedNotices = notices.map((notice) => ({
        ...notice,
        notice_content: sanitizeHtml(notice.notice_content),
      }));
      return res.status(200).json({ notices: sanitizedNotices });
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

      notice.notice_content = sanitizeHtml(notice.notice_content);
      return res.status(200).json({ notice });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 공지사항 수정 (관리자만)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id, role } = req.user;
      const { notice_title, notice_category, notice_content } = req.body;

      if (role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

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

      const updated = await noticeModel.update(id, {
        notice_title,
        notice_category,
        notice_content: sanitizeHtml(notice_content),
      });

      return res.status(200).json({ message: '공지사항이 수정되었습니다.', notice: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 공지사항 삭제 (관리자만)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id, role } = req.user;

      if (role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const notice = await noticeModel.findById(id);
      if (!notice) {
        return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
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