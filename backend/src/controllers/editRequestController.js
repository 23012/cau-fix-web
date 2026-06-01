const editRequestModel = require('../models/editRequestModel');
const complainModel = require('../models/complainModel');
const notificationModel = require('../models/notificationModel');
const webPushService = require('../services/webPush');
const memberModel = require('../models/memberModel');

const editRequestController = {
  /**
   * POST /api/complaints/:id/edit-request
   * 처리자 수정 요청 제출
   */
  submit: async (req, res) => {
    try {
      const { id } = req.params;
      const { reasonType, detail } = req.body;
      const { member_id, role } = req.user;

      if (role === 'C') {
        return res.status(403).json({ message: '처리자만 수정 요청을 할 수 있습니다.' });
      }

      if (!reasonType) {
        return res.status(400).json({ message: '수정 요청 사유를 선택해주세요.' });
      }

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      // 접수 또는 진행중 상태만 수정 요청 가능
      if (complain.status !== '접수' && complain.status !== '진행중') {
        return res.status(400).json({ message: '접수 또는 진행중 상태의 민원만 수정 요청할 수 있습니다.' });
      }

      // 이미 PENDING 상태의 수정 요청이 있는지 확인
      const existing = await editRequestModel.findPendingByComplaintId(id);
      if (existing) {
        return res.status(409).json({ message: '이미 처리 대기 중인 수정 요청이 있습니다.' });
      }

      await editRequestModel.ensureTable();

      // prev_state 저장 (한글 → 코드 변환)
      const { stateReverseMap } = require('../models/complainModel');
      const prevStateCode = stateReverseMap[complain.status] || null;

      const editRequest = await editRequestModel.create({
        complaint_id: id,
        requester_id: member_id,
        reason_type: reasonType,
        detail: detail || '',
        prev_state: prevStateCode,
      });

      // 민원 상태를 'R'(수정중)로 변경
      await complainModel.updateState(id, 'R');

      // 요청자 이름 조회
      const requester = await memberModel.findById(member_id);
      const requesterName = requester?.name || '처리자';

      // 관리자에게 알림 발송
      try {
        const admins = await memberModel.findByRole('A');
        if (admins && admins.length > 0) {
          const adminIds = admins.map((a) => a.member_id);
          const customContent = `${requesterName}님이 수정을 요청했습니다.`;
          await notificationModel.createForManagers({
            complain_id: id,
            manager_ids: adminIds,
            state: 'R',
            complain_title: complain.title,
            custom_content: customContent,
          });

          webPushService.sendToMembers(adminIds, {
            title: complain.title,
            body: customContent,
            data: { complainId: id },
          }).catch(() => {});
        }
      } catch (notifErr) {
        console.error('알림 발송 실패:', notifErr);
      }

      return res.status(201).json({ message: '수정 요청이 완료되었습니다.', editRequest });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  /**
   * GET /api/complaints/:id/edit-request
   * 수정 요청 상세 조회
   */
  get: async (req, res) => {
    try {
      const { id } = req.params;

      await editRequestModel.ensureTable();

      // PENDING 또는 APPROVED 상태의 활성 수정 요청 조회
      const { EDIT_REQUEST_STATUS } = require('../models/editRequestModel');
      const pool = require('../config/db');
      const result = await pool.query(
        `SELECT er.*, m.name AS requester_name
         FROM complaint_edit_requests er
         JOIN member m ON er.requester_id = m.member_id
         WHERE er.complaint_id = $1 AND er.status IN ($2, $3)
         ORDER BY er.created_at DESC
         LIMIT 1`,
        [id, EDIT_REQUEST_STATUS.PENDING, EDIT_REQUEST_STATUS.APPROVED]
      );

      if (!result.rows[0]) {
        return res.status(200).json({ editRequest: null });
      }

      const row = result.rows[0];
      const editRequest = {
        id: row.id,
        complaintId: row.complaint_id,
        requesterId: row.requester_id,
        requesterName: row.requester_name,
        reasonType: row.reason_type,
        detail: row.detail,
        status: row.status,
        prevState: row.prev_state,
        createdAt: row.created_at,
      };

      return res.status(200).json({ editRequest });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  /**
   * POST /api/complaints/:id/edit-request/approve
   * 관리자 수정 요청 승인
   * - 분류 항목 변경: 즉시 카테고리 변경 + 접수전 상태 + 처리자 해제
   * - 담당자 변경 / 기타: 상태 APPROVED로 변경 (처리자가 수정 페이지에서 완료)
   */
  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, member_id } = req.user;

      if (role !== 'A') {
        return res.status(403).json({ message: '관리자만 승인할 수 있습니다.' });
      }

      const editRequest = await editRequestModel.findPendingByComplaintId(id);
      if (!editRequest) {
        return res.status(404).json({ message: '처리 대기 중인 수정 요청이 없습니다.' });
      }

      const { EDIT_REQUEST_STATUS } = require('../models/editRequestModel');
      const pool = require('../config/db');

      // 분류 항목 변경: 즉시 처리
      if (editRequest.reasonType === '분류 항목 변경') {
        // 카테고리 변경
        const categoryResult = await pool.query(
          `SELECT category_id FROM complain_category WHERE category_name = $1`,
          [editRequest.detail]
        );
        if (categoryResult.rows[0]) {
          await pool.query(
            `UPDATE complain SET category_id = $1 WHERE complain_id = $2`,
            [categoryResult.rows[0].category_id, id]
          );
        }
        // 접수전 상태로 변경
        await complainModel.updateState(id, 'B');
        // 처리자 해제 (complaint_process 삭제)
        await pool.query(
          `DELETE FROM complaint_process WHERE complain_id = $1`,
          [id]
        );
        // 수정 요청 상태를 COMPLETED로 (즉시 완료)
        await editRequestModel.updateStatus(editRequest.id, EDIT_REQUEST_STATUS.COMPLETED);
      } else {
        // 담당자 변경 / 기타: PENDING 유지 (수정 완료 시 상태 변경)
        // edit_request status는 변경하지 않음 — completeEdit에서 처리
      }

      // 리뷰 레코드 생성
      const pool2 = require('../config/db');
      await pool2.query(
        `INSERT INTO complaint_edit_request_reviews (edit_request_id, reviewer_id, decision) VALUES ($1, $2, 'APPROVED')`,
        [editRequest.id, member_id]
      );

      // 분류 항목 변경: 즉시 완료이므로 알림 발송 (대상별 다른 메시지)
      if (editRequest.reasonType === '분류 항목 변경') {
        try {
          const complain = await complainModel.findById(id);
          const complainTitle = complain?.title || '';

          // 1. 수정 요청한 처리자: "수정 요청이 승인 완료되었습니다."
          await pool2.query(
            `INSERT INTO push_notification (complain_id, member_id, state, push_content) VALUES ($1, $2, $3, $4)`,
            [id, editRequest.requesterId, 'B', `수정 요청이 승인되었습니다.`]
          );

          // 2. 사용자: "처리자에 의해 민원 분류 항목이 변경되었습니다."
          if (complain?.complain_by && complain.complain_by !== editRequest.requesterId) {
            await pool2.query(
              `INSERT INTO push_notification (complain_id, member_id, state, push_content) VALUES ($1, $2, $3, $4)`,
              [id, complain.complain_by, 'B', `처리자에 의해 민원 분류 항목이 변경되었습니다.`]
            );
          }

          // 3. 변경된 항목 담당 처리자들
          const deptProcessors = await pool2.query(
            `SELECT member_id FROM member WHERE role = 'E' AND is_approved = TRUE AND dept = $1`,
            [editRequest.detail]
          );
          const newProcessorIds = deptProcessors.rows
            .map(r => r.member_id)
            .filter(mid => mid !== editRequest.requesterId);
          
          for (const pid of newProcessorIds) {
            await pool2.query(
              `INSERT INTO push_notification (complain_id, member_id, state, push_content) VALUES ($1, $2, $3, $4)`,
              [id, pid, 'B', `새 민원이 접수되었습니다.`]
            );
          }

          // Web Push
          const allTargets = [editRequest.requesterId, ...(complain?.complain_by ? [complain.complain_by] : []), ...newProcessorIds];
          webPushService.sendToMembers(allTargets, {
            title: complainTitle,
            body: `민원 수정이 완료 되었습니다.`,
            data: { complainId: id },
          }).catch(() => {});
        } catch (notifErr) {
          console.error('분류 항목 변경 알림 발송 실패:', notifErr);
        }
      }

      return res.status(200).json({ message: '수정 요청이 승인되었습니다.', editRequest: { ...editRequest, status: 'A' } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  /**
   * POST /api/complaints/:id/edit-request/reject
   * 관리자 수정 요청 거절
   */
  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { role, member_id } = req.user;

      if (role !== 'A') {
        return res.status(403).json({ message: '관리자만 거절할 수 있습니다.' });
      }

      if (!reason || reason.trim().length === 0 || reason.trim().length > 500) {
        return res.status(400).json({ message: '반려 사유를 입력해주세요. (1~50자)' });
      }

      const editRequest = await editRequestModel.findPendingByComplaintId(id);
      if (!editRequest) {
        return res.status(404).json({ message: '처리 대기 중인 수정 요청이 없습니다.' });
      }

      const { EDIT_REQUEST_STATUS } = require('../models/editRequestModel');

      // 수정 요청 상태를 REJECTED로
      await editRequestModel.updateStatus(editRequest.id, EDIT_REQUEST_STATUS.REJECTED);

      // 민원 상태를 이전 상태로 복원
      if (editRequest.prevState) {
        await complainModel.updateState(id, editRequest.prevState);
      }

      // 리뷰 레코드 생성
      const pool = require('../config/db');
      await pool.query(
        `INSERT INTO complaint_edit_request_reviews (edit_request_id, reviewer_id, decision, reject_reason) VALUES ($1, $2, 'REJECTED', $3)`,
        [editRequest.id, member_id, reason.trim()]
      );

      // 반려 알림: 처리자 + 관리자에게 전송 (반려 사유 포함)
      try {
        const complain = await complainModel.findById(id);
        const pushContent = `민원 수정 요청이 반려 되었습니다.`;
        const pool3 = require('../config/db');
        // 처리자에게
        await pool3.query(
          `INSERT INTO push_notification (complain_id, member_id, state, push_content) VALUES ($1, $2, $3, $4)`,
          [id, editRequest.requesterId, editRequest.prevState || 'R', pushContent]
        );
        // 관리자들에게
        const admins = await memberModel.findByRole('A');
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            if (admin.member_id !== member_id) { // 반려한 관리자 본인 제외
              await pool3.query(
                `INSERT INTO push_notification (complain_id, member_id, state, push_content) VALUES ($1, $2, $3, $4)`,
                [id, admin.member_id, editRequest.prevState || 'R', pushContent]
              );
            }
          }
        }
        const targets = [editRequest.requesterId, ...(admins || []).filter(a => a.member_id !== member_id).map(a => a.member_id)];
        webPushService.sendToMembers(targets, {
          title: complain?.title || '',
          body: `민원 수정 요청이 반려 되었습니다.`,
          data: { complainId: id },
        }).catch(() => {});
      } catch (notifErr) {
        console.error('알림 발송 실패:', notifErr);
      }

      return res.status(200).json({ message: '수정 요청이 반려되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  /**
   * PUT /api/complaints/:id/edit-request/complete
   * 처리자 수정 완료
   * - 담당자 변경: 새 처리자의 내처리함으로 이동 + 접수중 상태
   * - 기타: 상태/처리자 유지 (prev_state로 복원)
   */
  completeEdit: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, member_id } = req.user;
      const { title, content, location, category_id, new_processor_id } = req.body;

      if (role === 'C') {
        return res.status(403).json({ message: '수정 권한이 없습니다.' });
      }

      const { EDIT_REQUEST_STATUS } = require('../models/editRequestModel');
      const pool = require('../config/db');

      // PENDING 또는 APPROVED 상태의 수정 요청 찾기
      const result = await pool.query(
        `SELECT * FROM complaint_edit_requests WHERE complaint_id = $1 AND status IN ($2, $3) LIMIT 1`,
        [id, EDIT_REQUEST_STATUS.PENDING, EDIT_REQUEST_STATUS.APPROVED]
      );
      const editRequest = result.rows[0];
      if (!editRequest) {
        return res.status(400).json({ message: '승인된 수정 요청이 없습니다.' });
      }

      const complain = await complainModel.findById(id);
      if (!complain) {
        return res.status(404).json({ message: '민원을 찾을 수 없습니다.' });
      }

      // before 스냅샷
      const beforeData = {
        title: complain.title,
        content: complain.content,
        location: complain.location,
        category_id: complain.category_id,
      };

      if (editRequest.reason_type === '처리 담당자 변경') {
        // 담당자 변경: 새 처리자로 교체 + 접수중 상태
        if (!new_processor_id) {
          return res.status(400).json({ message: '새 처리자를 선택해주세요.' });
        }
        // complaint_process 업데이트
        await pool.query(
          `UPDATE complaint_process SET process_by = $1, process_at = NOW() WHERE complain_id = $2`,
          [new_processor_id, id]
        );
        // 접수중(A) 상태로 변경
        await complainModel.updateState(id, 'A');

      } else if (editRequest.reason_type === '기타') {
        // 기타: 민원 내용 수정 가능 + 상태/처리자 유지 (prev_state로 복원)
        if (title || content || location || category_id) {
          await pool.query(
            `UPDATE complain SET
              complain_title = COALESCE($1, complain_title),
              complain_content = COALESCE($2, complain_content),
              location = COALESCE($3, location),
              category_id = COALESCE($4, category_id)
            WHERE complain_id = $5`,
            [title || null, content || null, location || null, category_id || null, id]
          );
        }
        // 이전 상태로 복원
        if (editRequest.prev_state) {
          await complainModel.updateState(id, editRequest.prev_state);
        }
      }

      // after 스냅샷
      const updatedComplain = await complainModel.findById(id);
      const afterData = {
        title: updatedComplain?.title,
        content: updatedComplain?.content,
        location: updatedComplain?.location,
        category_id: updatedComplain?.category_id,
      };

      // 수정 이력 기록
      await pool.query(
        `INSERT INTO complaint_edit_history (edit_request_id, complaint_id, changed_by, before_data, after_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [editRequest.id, id, member_id, JSON.stringify(beforeData), JSON.stringify(afterData)]
      );

      // 수정 요청 상태를 COMPLETED로
      await editRequestModel.updateStatus(editRequest.id, EDIT_REQUEST_STATUS.COMPLETED);

      // 수정 완료 알림: 사유별 대상 분기
      try {
        const targets = new Set();
        const pool4 = require('../config/db');

        if (editRequest.reason_type === '처리 담당자 변경') {
          // 민원 등록한 사람 + 수정 요청한 처리자 + 변경된 처리자
          if (updatedComplain?.complain_by) targets.add(updatedComplain.complain_by);
          targets.add(editRequest.requester_id);
          if (new_processor_id) targets.add(new_processor_id);

        } else if (editRequest.reason_type === '분류 항목 변경') {
          // 사용자 + 수정 요청한 처리자 + 변경된 항목 담당 처리자들
          if (updatedComplain?.complain_by) targets.add(updatedComplain.complain_by);
          targets.add(editRequest.requester_id);
          // 변경된 카테고리의 담당 처리자들 조회
          const catResult = await pool4.query(
            `SELECT cc.category_name FROM complain_category cc
             JOIN complain c ON c.category_id = cc.category_id
             WHERE c.complain_id = $1`,
            [id]
          );
          if (catResult.rows[0]) {
            const deptProcessors = await pool4.query(
              `SELECT member_id FROM member WHERE role = 'E' AND is_approved = TRUE AND dept = $1`,
              [catResult.rows[0].category_name]
            );
            deptProcessors.rows.forEach(r => targets.add(r.member_id));
          }

        } else {
          // 기타: 사용자 + 수정 요청한 처리자
          if (updatedComplain?.complain_by) targets.add(updatedComplain.complain_by);
          targets.add(editRequest.requester_id);
        }

        const targetArray = [...targets];
        const customContent = `민원 수정이 완료 되었습니다.`;
        const stateCode = updatedComplain?.status ? require('../models/complainModel').stateReverseMap[updatedComplain.status] || 'A' : 'A';
        for (const targetId of targetArray) {
          await notificationModel.create({
            complain_id: id,
            member_id: targetId,
            state: stateCode,
            complain_title: updatedComplain?.title || '',
          });
        }
        webPushService.sendToMembers(targetArray, {
          title: updatedComplain?.title || '',
          body: customContent,
          data: { complainId: id },
        }).catch(() => {});
      } catch (notifErr) {
        console.error('수정 완료 알림 발송 실패:', notifErr);
      }

      return res.status(200).json({ message: '민원 수정이 완료되었습니다.', complaint: updatedComplain });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  /**
   * GET /api/complaints/:id/edit-request/rejection
   * 최근 거절 사유 조회
   */
  getRejection: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = require('../config/db');
      const result = await pool.query(
        `SELECT r.reject_reason, r.reviewed_at, m.name AS reviewer_name
         FROM complaint_edit_request_reviews r
         JOIN member m ON r.reviewer_id = m.member_id
         WHERE r.edit_request_id IN (
           SELECT er.id FROM complaint_edit_requests er WHERE er.complaint_id = $1
         )
         AND r.decision = 'REJECTED'
         ORDER BY r.reviewed_at DESC
         LIMIT 1`,
        [id]
      );
      if (!result.rows[0]) {
        return res.status(200).json({ rejection: null });
      }
      const row = result.rows[0];
      return res.status(200).json({
        rejection: {
          reason: row.reject_reason,
          reviewerName: row.reviewer_name,
          reviewedAt: row.reviewed_at,
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = editRequestController;
