const categoryModel = require('../models/categoryModel');

const categoryController = {
  // 카테고리 목록 조회 (민원 등록용 - 전체 제외)
  getAll: async (req, res) => {
    try {
      const categories = await categoryModel.findAll();
      return res.status(200).json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 카테고리 목록 조회 (처리자 가입용 - 전체 포함)
  getAllWithTotal: async (req, res) => {
    try {
      const categories = await categoryModel.findAllWithTotal();
      return res.status(200).json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 카테고리 등록 (관리자)
  create: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { category_name, dept } = req.body;
      if (!category_name || !dept) {
        return res.status(400).json({ message: '카테고리명과 부서를 입력해주세요.' });
      }

      const category = await categoryModel.create({ category_name, dept });
      return res.status(201).json({ message: '카테고리가 등록되었습니다.', category });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 카테고리 수정 (관리자)
  update: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;
      const { category_name, dept } = req.body;

      if (!category_name || !dept) {
        return res.status(400).json({ message: '카테고리명과 부서를 입력해주세요.' });
      }

      const category = await categoryModel.findById(id);
      if (!category) {
        return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
      }

      const updated = await categoryModel.update(id, { category_name, dept });
      return res.status(200).json({ message: '카테고리가 수정되었습니다.', category: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 카테고리 삭제 (관리자)
  delete: async (req, res) => {
    try {
      if (req.user.role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const { id } = req.params;

      const category = await categoryModel.findById(id);
      if (!category) {
        return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
      }

      await categoryModel.delete(id);
      return res.status(200).json({ message: '카테고리가 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = categoryController;