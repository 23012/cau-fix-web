const fs = require('fs');
const path = require('path');
const complainModel = require('../models/complainModel');
const { stateReverseMap } = require('../models/complainModel');
const notificationModel = require('../models/notificationModel');
const memberModel = require('../models/memberModel');
const webPushService = require('../services/webPush');
const ExcelJS = require('exceljs');

// 업로드 파일이 저장된 디스크 루트 (이미지 임베드용)
const uploadsRoot = path.resolve(__dirname, '../../uploads');

// 공개 도메인 (엑셀 절대 URL 링크용) - ALLOWED_ORIGINS 첫 값 재사용
const getPublicBaseUrl = () => {
  const origins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return (origins[0] || 'http://localhost:3000').replace(/\/$/, '');
};

// 상대경로(/uploads/...)를 클릭 가능한 절대 URL로 변환
const toAbsoluteUrl = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url; // 이미 절대 URL이면 그대로
  return `${getPublicBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 디스크상의 이미지 파일 경로 + 확장자 (ExcelJS 임베드용). 실패 시 null
const resolveImageFile = (url) => {
  if (!url || /^https?:\/\//i.test(url)) return null; // 외부 URL은 임베드 대상 아님
  const rel = url.replace(/^\/?uploads\//, ''); // '/uploads/complain/x.jpg' -> 'complain/x.jpg'
  const filePath = path.resolve(uploadsRoot, rel);
  // 경로 이탈 방지 (uploadsRoot 밖이면 거부)
  if (!filePath.startsWith(uploadsRoot)) return null;
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const extMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif' };
  if (!extMap[ext]) return null; // ExcelJS 미지원 확장자
  return { filePath, extension: extMap[ext] };
};

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
            { title: '새 민원 접수', body: `새 민원이 접수되었습니다`, data: { complainId: complain.id } }
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

      console.log('[getAll] user:', { role, member_id, dept });

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

      console.log('[getAll] result count:', complaints?.length, 'items:', JSON.stringify(complaints?.map(c => ({ id: c.id, category: c.category }))));
      return res.status(200).json({ complaints });
    } catch (err) {
      console.error('[getAll] ERROR:', err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 엑셀 다운로드 (관리자만)
  exportExcel: async (req, res) => {
    try {
      const { role, member_id, dept } = req.user;

      if (role !== 'A') {
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
        complaints = await complainModel.findAll();
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
        { header: '처리내용', key: 'result', width: 40 },
        { header: '신고자', key: 'memberName', width: 12 },
        { header: '신고자 부서', key: 'memberDept', width: 15 },
        { header: '접수 시간', key: 'date', width: 22 },
        { header: '대표 이미지', key: 'thumbnail', width: 18 },
        { header: '이미지(링크)', key: 'imageUrls', width: 50 },
      ];

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006EB7' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // 대표 이미지 컬럼 인덱스(0-based): 위 columns 배열 순서 기준 10번째
      // (상태 뒤에 '처리내용' 컬럼이 추가되어 이미지 컬럼이 한 칸 밀림)
      const THUMBNAIL_COL = 10;

      complaints.forEach((c) => {
        const row = worksheet.addRow({
          id: c.id, category: c.category, title: c.title, content: c.content,
          location: c.location, status: c.status, result: c.result || '',
          memberName: c.memberName || '-',
          memberDept: c.memberDept || '-', date: c.date, thumbnail: '', imageUrls: '',
        });

        const statusCell = row.getCell('status');
        const statusColors = { '접수전': 'FF9E9E9E', '접수': 'FFFFC107', '진행중': 'FF63BE7B', '완료': 'FF006EB7' };
        if (statusColors[c.status]) {
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors[c.status] } };
          statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }

        // 대표 이미지: 첫 번째 사진을 디스크에서 읽어 셀에 임베드
        const thumbInfo = c.imageList && c.imageList.length > 0
          ? resolveImageFile(c.imageList[0])
          : null;
        if (thumbInfo) {
          try {
            const imageId = workbook.addImage({
              filename: thumbInfo.filePath,
              extension: thumbInfo.extension,
            });
            row.height = 80; // 썸네일이 보이도록 행 높이 확보
            worksheet.addImage(imageId, {
              tl: { col: THUMBNAIL_COL + 0.1, row: row.number - 1 + 0.1 },
              ext: { width: 100, height: 100 },
              editAs: 'oneCell',
            });
          } catch (e) {
            row.getCell('thumbnail').value = '(이미지 로드 실패)';
          }
        } else {
          row.getCell('thumbnail').value = c.imageList && c.imageList.length > 0 ? '(파일 없음)' : '-';
        }

        // 이미지 링크: 클릭 가능한 절대 URL로 변환
        const imageUrlCell = row.getCell('imageUrls');
        if (c.imageList && c.imageList.length > 0) {
          if (c.imageList.length === 1) {
            const abs = toAbsoluteUrl(c.imageList[0]);
            imageUrlCell.value = { text: abs, hyperlink: abs };
            imageUrlCell.font = { color: { argb: 'FF0000FF' }, underline: true };
          } else {
            imageUrlCell.value = c.imageList
              .map((url, i) => `[이미지${i + 1}] ${toAbsoluteUrl(url)}`)
              .join('\n');
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
      if (role === 'E' && complain.dept !== dept && dept !== '전체') {
        // 해당 민원의 처리 담당자이거나 수정 요청자이거나 알림을 받은 사람이면 접근 허용
        const pool = require('../config/db');
        const processCheck = await pool.query(
          `SELECT 1 FROM complaint_process WHERE complain_id = $1 AND process_by = $2`,
          [id, member_id]
        );
        const editReqCheck = await pool.query(
          `SELECT 1 FROM complaint_edit_requests WHERE complaint_id = $1 AND requester_id = $2`,
          [id, member_id]
        );
        const pushCheck = await pool.query(
          `SELECT 1 FROM push_notification WHERE complain_id = $1 AND member_id = $2`,
          [id, member_id]
        );
        if (processCheck.rows.length === 0 && editReqCheck.rows.length === 0 && pushCheck.rows.length === 0) {
          return res.status(403).json({ message: '접근 권한이 없습니다.' });
        }
      }

      // 사용자(C)에게는 '수정중' 상태를 이전 상태로 표시
      if (role === 'C' && complain.status === '수정중') {
        const editRequestModel = require('../models/editRequestModel');
        const { EDIT_REQUEST_STATUS } = require('../models/editRequestModel');
        // PENDING 또는 APPROVED 상태의 수정 요청에서 prev_state 가져오기
        const editReq = await editRequestModel.findPendingByComplaintId(id);
        if (editReq && editReq.prevState) {
          const { stateMap } = require('../models/complainModel');
          complain.status = stateMap[editReq.prevState] || complain.status;
        } else {
          // APPROVED 상태도 확인
          const pool = require('../config/db');
          const result = await pool.query(
            `SELECT prev_state FROM complaint_edit_requests WHERE complaint_id = $1 AND status = $2 LIMIT 1`,
            [id, EDIT_REQUEST_STATUS.APPROVED]
          );
          if (result.rows[0] && result.rows[0].prev_state) {
            const { stateMap } = require('../models/complainModel');
            complain.status = stateMap[result.rows[0].prev_state] || complain.status;
          }
        }
      }

      const process = await complainModel.findProcess(id);
      const images = await complainModel.findImages(id);
      let processImages = [];
      if (process) {
        processImages = await complainModel.findProcessImages(process.process_id);
      }

      // 처리자(E)인 경우 해당 민원을 접수할 수 있는지 여부 판단
      // 자신의 담당 부서와 민원 카테고리의 담당 부서가 일치해야 접수 가능
      let canAccept = false;
      if (role === 'E') {
        canAccept = (dept === '전체' || complain.dept === dept);
      } else if (role === 'A') {
        canAccept = true;
      }

      return res.status(200).json({ complain, process: process || null, images, processImages, canAccept });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 민원 수정 (접수전 본인만, 관리자는 상태 무관)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { category_id, title, content, location } = req.body;

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      if (req.user.role !== 'A') {
        if (complain.complain_by !== req.user.member_id) {
          return res.status(403).json({ message: '접근 권한이 없습니다.' });
        }
        if (complain.status !== '접수전') {
          return res.status(400).json({ message: '접수 전 민원만 수정할 수 있습니다.' });
        }
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

  // 민원 삭제 (접수전 본인만, 관리자는 상태 무관)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      if (req.user.role !== 'A') {
        if (complain.complain_by !== req.user.member_id) {
          return res.status(403).json({ message: '접근 권한이 없습니다.' });
        }
        if (complain.status !== '접수전') {
          return res.status(400).json({ message: '접수 전 민원만 삭제할 수 있습니다.' });
        }
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

      if (role === 'E' && complain.dept !== dept && dept !== '전체') {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      const prevState = stateReverseMap[complain.status];

      const updated = await complainModel.updateState(id, state);

      // 접수중(A) 시 complaint_process에 담당자 할당
      if (state === 'A') {
        const existing = await complainModel.findProcess(id);
        if (!existing) {
          await complainModel.assignProcess({ complain_id: id, process_by: member_id });
        }
      }

      // 진행중(P) 시 처리 시간 업데이트
      if (state === 'P') {
        const existing = await complainModel.findProcess(id);
        if (existing) {
          await complainModel.updateProcessTime(id);
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
        title: complain.title,
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

      if (role === 'E' && complain.dept !== dept && dept !== '전체') {
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
