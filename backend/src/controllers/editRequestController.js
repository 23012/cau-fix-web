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

      // 관리자에게 알림 발송
      try {
        const admins = await memberModel.findByRole('A');
        if (admins && admins.length > 0) {
          const adminIds = admins.map((a) => a.member_id);
          const customContent = `"${complain.title}"이(가) 수정 요청 되었습니다.`;
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

      const editRequest = await editRequestModel.findPendingByComplaintId(id);

      return res.status(200).json({ editRequest: editRequest || null });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = editRequestController;
