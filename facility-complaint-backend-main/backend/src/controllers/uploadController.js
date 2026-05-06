const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const uploadController = {
  // 민원 이미지 업로드
  uploadComplainImages: async (req, res) => {
    try {
      const { complain_id } = req.body;

      if (!complain_id) {
        return res.status(400).json({ message: '민원 ID가 필요합니다.' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: '업로드할 이미지가 없습니다.' });
      }

      // 기존 이미지 수 확인 (최대 10장)
      const existingResult = await pool.query(
        'SELECT COUNT(*) AS count FROM complain_img WHERE complain_id = $1',
        [complain_id]
      );
      const existingCount = parseInt(existingResult.rows[0].count);

      if (existingCount + req.files.length > 10) {
        // 업로드된 파일 삭제
        req.files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({
          message: `이미지는 최대 10장까지 첨부 가능합니다. (현재 ${existingCount}장)`,
        });
      }

      // DB에 이미지 정보 저장
      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const img_url = `/uploads/complain/${file.filename}`;
        const result = await pool.query(
          `INSERT INTO complain_img (complain_id, complain_img_order, complain_img_url, complain_img_size)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [complain_id, existingCount + i + 1, img_url, file.size]
        );
        images.push(result.rows[0]);
      }

      return res.status(201).json({
        message: '이미지가 업로드되었습니다.',
        images,
      });
    } catch (err) {
      console.error(err);
      // 업로드된 파일 삭제
      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 처리 이미지 업로드
  uploadProcessImages: async (req, res) => {
    try {
      const { process_id } = req.body;

      if (!process_id) {
        return res.status(400).json({ message: '처리 ID가 필요합니다.' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: '업로드할 이미지가 없습니다.' });
      }

      // 기존 이미지 수 확인 (최대 10장)
      const existingResult = await pool.query(
        'SELECT COUNT(*) AS count FROM process_img WHERE process_id = $1',
        [process_id]
      );
      const existingCount = parseInt(existingResult.rows[0].count);

      if (existingCount + req.files.length > 10) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
        return res.status(400).json({
          message: `이미지는 최대 10장까지 첨부 가능합니다. (현재 ${existingCount}장)`,
        });
      }

      // DB에 이미지 정보 저장
      const images = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const img_url = `/uploads/process/${file.filename}`;
        const result = await pool.query(
          `INSERT INTO process_img (process_id, process_img_order, process_img_url, process_img_size)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [process_id, existingCount + i + 1, img_url, file.size]
        );
        images.push(result.rows[0]);
      }

      return res.status(201).json({
        message: '이미지가 업로드되었습니다.',
        images,
      });
    } catch (err) {
      console.error(err);
      if (req.files) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 이미지 삭제
  deleteComplainImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id, role } = req.user;

      // 이미지 조회
      const result = await pool.query(
        `SELECT ci.*, c.complain_by
         FROM complain_img ci
         JOIN complain c ON ci.complain_id = c.complain_id
         WHERE ci.complain_img_id = $1`,
        [id]
      );

      const image = result.rows[0];
      if (!image) {
        return res.status(404).json({ message: '이미지를 찾을 수 없습니다.' });
      }

      // 본인 또는 관리자만 삭제 가능
      if (image.complain_by !== member_id && role !== 'A') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      // 서버 파일 삭제
      const filePath = path.join(__dirname, '../../', image.complain_img_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // DB에서 삭제
      await pool.query('DELETE FROM complain_img WHERE complain_img_id = $1', [id]);

      return res.status(200).json({ message: '이미지가 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 처리 이미지 삭제
  deleteProcessImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.user;

      // 처리자/관리자만 삭제 가능
      if (role === 'C') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const result = await pool.query(
        'SELECT * FROM process_img WHERE process_img_id = $1',
        [id]
      );

      const image = result.rows[0];
      if (!image) {
        return res.status(404).json({ message: '이미지를 찾을 수 없습니다.' });
      }

      // 서버 파일 삭제
      const filePath = path.join(__dirname, '../../', image.process_img_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // DB에서 삭제
      await pool.query('DELETE FROM process_img WHERE process_img_id = $1', [id]);

      return res.status(200).json({ message: '이미지가 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = uploadController;