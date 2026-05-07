import apiClient from './apiClient';

/**
 * 알림 목록 조회 (최근 7일)
 */
export async function getNotifications() {
  return apiClient('/notifications');
}

/**
 * 읽지 않은 알림 수 조회
 */
export async function getUnreadCount() {
  return apiClient('/notifications/unread-count');
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(id) {
  return apiClient(`/notifications/${id}/read`, { method: 'PUT' });
}

/**
 * 전체 읽음 처리
 */
export async function markAllAsRead() {
  return apiClient('/notifications/read-all', { method: 'PUT' });
}
