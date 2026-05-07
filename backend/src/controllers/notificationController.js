const notificationModel = require('../models/notificationModel');

const notificationController = {
  // 알림 목록 조회 (최근 7일, 본인)
  getAll: async (req, res) => {
    try {
      const { member_id } = req.user;
      const notifications = await notificationModel.findByMember(member_id);
      const unreadCount = notifications.filter((n) => !n.read).length;

      return res.status(200).json({
        notifications,
        unreadCount,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 읽지 않은 알림 수 조회 (상단 뱃지용)
  getUnreadCount: async (req, res) => {
    try {
      const { member_id } = req.user;
      const count = await notificationModel.countUnread(member_id);
      return res.status(200).json({ unreadCount: count });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 알림 읽음 처리 (알림 클릭 시)
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_id } = req.user;

      const notification = await notificationModel.findById(id);
      if (!notification) {
        return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
      }

      // 본인 알림만 읽음 처리 가능
      if (notification.member_id !== member_id) {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      await notificationModel.markAsRead(id, member_id);
      return res.status(200).json({ message: '읽음 처리되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 전체 읽음 처리
  markAllAsRead: async (req, res) => {
    try {
      const { member_id } = req.user;
      await notificationModel.markAllAsRead(member_id);
      return res.status(200).json({ message: '전체 읽음 처리되었습니다.' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
};

module.exports = notificationController;