const complainModel = require('../models/complainModel');
const { stateReverseMap } = require('../models/complainModel');
const notificationModel = require('../models/notificationModel');
const memberModel = require('../models/memberModel');
const webPushService = require('../services/webPush');
const ExcelJS = require('exceljs');

const complainController = {
  // 민원 등록 (사용자)
  create: async (req, res) => {
    try {
      const { category_id, title, content, location } = req.body;

      if (!category_id || !title || !content || !location) {
        return res.status(400).json({ message: '필수 항목을 입력해주세요.' });
      }

      const complain = await complainModel.create({
        complain_by: req.user.member_id,
        category_id,
        complain_title: title,
        complain_content: content,
        location,
      });

      const category = await complainModel.findCategoryById(category_id);
      if (category) {
        const managers = await memberModel.findManagersByCategory(category.category_name);
        if (managers.length > 0) {
          await notificationModel.createForManagers({
            complain_id: complain.id,
            manager_ids: managers.map((m) => m.member_id),
            state: 'B',
            complain_title: title,
          });

          // 웹 푸시 발송 (담당 처리자들에게)
          webPushService.sendToMembers(
            managers.map((m) => m.member_id),
            { title: '새 민원 접수', body: `새 민원이 접수되었습니다: "${title}"`, data: { complainId: complain.id } }
          ).catch(() => {});
        }
      }

      return res.status(201).json({ message: '민원이 등록되었습니다.', complain });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 목록 조회 (역할별 + 필터링)
  getAll: async (req, res) => {
    try {
      const { role, member_id, dept } = req.user;
      const category = req.query.category?.trim();
      const status = req.query.status?.trim();
      const startDate = req.query.startDate?.trim();
      const endDate = req.query.endDate?.trim();

      const hasFilter = category || status || startDate || endDate;

      let complaints;
      if (hasFilter) {
        complaints = await complainModel.findWithFilter({
          role, member_id, dept, category, status, startDate, endDate,
        });
      } else {
        if (role === 'C') {
          complaints = await complainModel.findByMember(member_id);
        } else if (role === 'E') {
          complaints = await complainModel.findByDept(dept);
        } else if (role === 'A') {
          complaints = await complainModel.findAll();
        }
      }

      return res.status(200).json({ complaints });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 엑셀 다운로드 (관리자/처리자)
  exportExcel: async (req, res) => {
    try {
      const { role, member_id, dept } = req.user;

      if (role === 'C') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const category = req.query.category?.trim();
      const status = req.query.status?.trim();
      const startDate = req.query.startDate?.trim();
      const endDate = req.query.endDate?.trim();

      const hasFilter = category || status || startDate || endDate;

      let complaints;
      if (hasFilter) {
        complaints = await complainModel.findWithFilter({
          role, member_id, dept, category, status, startDate, endDate,
        });
      } else {
        if (role === 'E') {
          complaints = await complainModel.findByDept(dept);
        } else {
          complaints = await complainModel.findAll();
        }
      }

      for (const complain of complaints) {
        const images = await complainModel.findImages(complain.id);
        complain.imageList = images.map((img) => img.url);
        complain.imageUrls = complain.imageList.join(', ');
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = '민원리스트';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('민원 목록');

      worksheet.columns = [
        { header: '번호', key: 'id', width: 8 },
        { header: '분류', key: 'category', width: 15 },
        { header: '제목', key: 'title', width: 30 },
        { header: '내용', key: 'content', width: 40 },
        { header: '장소', key: 'location', width: 20 },
        { header: '상태', key: 'status', width: 10 },
        { header: '신고자', key: 'memberName', width: 12 },
        { header: '신고자 부서', key: 'memberDept', width: 15 },
        { header: '접수 시간', key: 'date', width: 22 },
        { header: '이미지', key: 'imageUrls', width: 50 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006EB7' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      complaints.forEach((c) => {
        const row = worksheet.addRow({
          id: c.id, category: c.category, title: c.title, content: c.content,
          location: c.location, status: c.status, memberName: c.memberName || '-',
          memberDept: c.memberDept || '-', date: c.date, imageUrls: '',
        });

        const statusCell = row.getCell('status');
        const statusColors = { '접수전': 'FF9E9E9E', '접수': 'FFFFC107', '진행중': 'FF63BE7B', '완료': 'FF006EB7' };
        if (statusColors[c.status]) {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors[c.status] } };
          statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }

        const imageUrlCell = row.getCell('imageUrls');
        if (c.imageList && c.imageList.length > 0) {
          if (c.imageList.length === 1) {
            imageUrlCell.value = { text: c.imageList[0], hyperlink: `http://localhost${c.imageList[0]}` };
            imageUrlCell.font = { color: { argb: 'FF0000FF' }, underline: true };
          } else {
            imageUrlCell.value = c.imageList.map((url, i) => `[이미지${i + 1}] ${url}`).join('\n');
            imageUrlCell.font = { color: { argb: 'FF0000FF' }, underline: true };
          }
        } else {
          imageUrlCell.value = '-';
        }

        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      });

      worksheet.getRow(1).height = 25;

      let filename;
      if (startDate && endDate) filename = `민원목록_${startDate}_${endDate}.xlsx`;
      else if (startDate) filename = `민원목록_${startDate}_이후.xlsx`;
      else if (endDate) filename = `민원목록_${endDate}_이전.xlsx`;
      else filename = `민원목록_${new Date().toISOString().slice(0, 10)}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 상세 조회
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, member_id, dept } = req.user;

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      if (role === 'C' && complain.complain_by !== member_id) {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      if (role === 'E' && complain.category !== dept && dept !== '전체') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const process = await complainModel.findProcess(id);
      const images = await complainModel.findImages(id);
      let processImages = [];
      if (process) {
        processImages = await complainModel.findProcessImages(process.process_id);
      }

      return res.status(200).json({ complain, process: process || null, images, processImages });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 수정 (접수전 본인만)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { category_id, title, content, location } = req.body;

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }
      if (complain.complain_by !== req.user.member_id) {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      if (complain.status !== '접수전') {
        return res.status(400).json({ message: '접수 전 민원만 수정할 수 있습니다.' });
      }

      const updated = await complainModel.update(id, {
        category_id, complain_title: title, complain_content: content, location,
      });

      return res.status(200).json({ message: '민원이 수정되었습니다.', complain: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 삭제 (접수전 본인만)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }
      if (complain.complain_by !== req.user.member_id) {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      if (complain.status !== '접수전') {
        return res.status(400).json({ message: '접수 전 민원만 삭제할 수 있습니다.' });
      }

      await complainModel.softDelete(id);
      return res.status(200).json({ message: '민원이 삭제되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 상태 변경 (처리자/관리자)
  updateState: async (req, res) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      const { role, member_id, dept } = req.user;

      if (role === 'C') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const validStates = ['B', 'A', 'P', 'D'];
      if (!validStates.includes(state)) {
        return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
      }

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      if (role === 'E' && complain.category !== dept && dept !== '전체') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const prevState = stateReverseMap[complain.status];

      const updated = await complainModel.updateState(id, state);

      // 접수(A) 시 complaint_process에 담당자 할당
      if (state === 'A') {
        const existing = await complainModel.findProcess(id);
        if (!existing) {
          await complainModel.assignProcess({ complain_id: id, process_by: member_id });
        }
      }

      await complainModel.createStateHistory({
        complain_id: id, changed_by: member_id, prev_state: prevState, next_state: state,
      });

      await notificationModel.create({
        complain_id: id, member_id: complain.complain_by, state, complain_title: complain.title,
      });

      // 웹 푸시 발송 (민원인에게)
      const stateText = { B: '접수전', A: '접수', P: '진행중', D: '완료' };
      webPushService.sendToMember(complain.complain_by, {
        title: '민원 상태 변경',
        body: `"${complain.title}"이(가) ${stateText[state] || state} 처리되었습니다.`,
        data: { complainId: id },
      }).catch(() => {});

      return res.status(200).json({ message: '상태가 변경되었습니다.', complain: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 처리 등록 (처리자/관리자)
  createProcess: async (req, res) => {
    try {
      const { id } = req.params;
      const { process_content } = req.body;
      const { role, member_id, dept } = req.user;

      if (role === 'C') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }
      if (!process_content) {
        return res.status(400).json({ message: '처리 내용을 입력해주세요.' });
      }

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      if (role === 'E' && complain.category !== dept && dept !== '전체') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const existing = await complainModel.findProcess(id);
      let process;
      if (existing) {
        // 이미 접수 시 할당된 process가 있으면 내용만 업데이트
        process = await complainModel.updateProcessContent(id, process_content);
      } else {
        await complainModel.assignProcess({ complain_id: id, process_by: member_id });
        process = await complainModel.updateProcessContent(id, process_content);
      }

      const prevState = stateReverseMap[complain.status];
      await complainModel.updateState(id, 'D');

      await complainModel.createStateHistory({
        complain_id: id, changed_by: member_id, prev_state: prevState, next_state: 'D',
      });

      await notificationModel.create({
        complain_id: id, member_id: complain.complain_by, state: 'D', complain_title: complain.title,
      });

      return res.status(201).json({ message: '처리가 완료되었습니다.', process });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = complainController;
