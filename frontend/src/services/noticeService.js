import apiClient from './apiClient';

/**
 * 공지사항 목록 조회
 * @returns {Promise<{notices: Array}>}
 */
export async function getNotices() {
  return apiClient('/notices');
}

/**
 * 공지사항 상세 조회
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getNoticeDetail(id) {
  return apiClient(`/notices/${id}`);
}

/**
 * 공지사항 등록
 * @param {Object} data - { notice_title, notice_category, notice_content }
 * @returns {Promise<{message: string, notice: Object}>}
 */
export async function createNotice({ notice_title, notice_category, notice_content }) {
  return apiClient('/notices', {
    method: 'POST',
    body: JSON.stringify({ notice_title, notice_category, notice_content }),
  });
}

/**
 * 공지사항 수정
 * @param {number} id
 * @param {Object} data - { notice_title, notice_category, notice_content }
 * @returns {Promise<{message: string, notice: Object}>}
 */
export async function updateNotice(id, { notice_title, notice_category, notice_content }) {
  return apiClient(`/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ notice_title, notice_category, notice_content }),
  });
}

/**
 * 공지사항 삭제
 * @param {number} id
 * @returns {Promise<{message: string}>}
 */
export async function deleteNotice(id) {
  return apiClient(`/notices/${id}`, {
    method: 'DELETE',
  });
}
