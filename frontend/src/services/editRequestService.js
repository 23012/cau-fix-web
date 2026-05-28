import apiClient from './apiClient';

/**
 * 수정 요청 제출 (처리자)
 * @param {number} complaintId - 민원 ID
 * @param {Object} data - 수정 요청 데이터
 * @param {string} data.reasonType - 사유 타입 ("담당자 변경" | "카테고리 변경 요청" | "기타")
 * @param {string} data.detail - 상세 내용 (카테고리명 또는 기타 사유 텍스트)
 * @returns {Promise<{message: string}>}
 */
export async function submitEditRequest(complaintId, { reasonType, detail }) {
  return apiClient(`/complaints/${complaintId}/edit-request`, {
    method: 'POST',
    body: JSON.stringify({ reasonType, detail }),
  });
}

/**
 * 수정 요청 조회
 * @param {number} complaintId - 민원 ID
 * @returns {Promise<{editRequest: Object|null}>}
 */
export async function getEditRequest(complaintId) {
  return apiClient(`/complaints/${complaintId}/edit-request`);
}

/**
 * 수정 요청 승인 (관리자)
 * @param {number} complaintId - 민원 ID
 * @returns {Promise<{message: string}>}
 */
export async function approveEditRequest(complaintId) {
  return apiClient(`/complaints/${complaintId}/edit-request/approve`, {
    method: 'POST',
  });
}

/**
 * 수정 요청 거절 (관리자)
 * @param {number} complaintId - 민원 ID
 * @param {Object} data - 거절 데이터
 * @param {string} data.reason - 거절 사유 (1~500자)
 * @returns {Promise<{message: string}>}
 */
export async function rejectEditRequest(complaintId, { reason }) {
  return apiClient(`/complaints/${complaintId}/edit-request/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
