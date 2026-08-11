import apiClient from './apiClient';

/**
 * 민원 목록 조회
 * @param {Object} params - 쿼리 파라미터 (category, status, startDate, endDate)
 * @returns {Promise<{complaints: Array}>}
 */
export async function getComplaints(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.status) query.append('status', params.status);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const queryStr = query.toString();
  return apiClient(`/complaints${queryStr ? `?${queryStr}` : ''}`);
}

/**
 * 민원 상세 조회
 * @param {number} id - 민원 ID
 * @returns {Promise<{complain: Object, process: Object|null, images: Array, processImages: Array}>}
 */
export async function getComplaintDetail(id) {
  return apiClient(`/complaints/${id}`);
}

/**
 * 민원 등록
 * @param {Object} data - { category_id, title, content, location }
 * @returns {Promise<{message: string, complain: Object}>}
 */
export async function createComplaint({ category_id, title, content, location }) {
  return apiClient('/complaints', {
    method: 'POST',
    body: JSON.stringify({ category_id, title, content, location }),
  });
}

/**
 * 민원 이미지 업로드
 * @param {number} complainId - 민원 ID
 * @param {File[]} files - 이미지 파일 배열
 * @returns {Promise<{message: string, images: Array}>}
 */
export async function uploadComplainImages(complainId, files) {
  const formData = new FormData();
  formData.append('complain_id', complainId);
  files.forEach((file) => formData.append('images', file));

  const response = await fetch('/api/uploads/complain', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const { ApiError } = await import('./apiClient');
    throw new ApiError(response.status, body.message || '이미지 업로드 중 오류가 발생했습니다.');
  }

  return response.json();
}

/**
 * 민원 수정 (접수전만 가능)
 * @param {number} id - 민원 ID
 * @param {Object} data - { category_id, title, content, location }
 * @returns {Promise<{message: string, complain: Object}>}
 */
export async function updateComplaint(id, { category_id, title, content, location }) {
  return apiClient(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ category_id, title, content, location }),
  });
}

/**
 * 민원 삭제 (접수전만 가능)
 * @param {number} id - 민원 ID
 * @returns {Promise<{message: string}>}
 */
export async function deleteComplaint(id) {
  return apiClient(`/complaints/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 민원 상태 변경 (처리자/관리자)
 * @param {number} id - 민원 ID
 * @param {string} state - 상태 코드 (B, A, P, D)
 * @returns {Promise<{message: string, complain: Object}>}
 */
export async function updateComplaintState(id, state) {
  return apiClient(`/complaints/${id}/state`, {
    method: 'PUT',
    body: JSON.stringify({ state }),
  });
}

/**
 * 민원 처리 등록 (처리자/관리자)
 * @param {number} id - 민원 ID
 * @param {string} processContent - 처리 내용
 * @returns {Promise<{message: string, process: Object}>}
 */
export async function createProcess(id, processContent) {
  return apiClient(`/complaints/${id}/process`, {
    method: 'POST',
    body: JSON.stringify({ process_content: processContent }),
  });
}

/**
 * 처리 내용 저장/수정 (배정된 담당 처리자, 상태 유지)
 * @param {number} id - 민원 ID
 * @param {string} processContent - 처리 내용
 */
export async function saveProcess(id, processContent) {
  return apiClient(`/complaints/${id}/process`, {
    method: 'PUT',
    body: JSON.stringify({ process_content: processContent }),
  });
}

/**
 * 처리 이미지 업로드
 * @param {number} processId - 처리 ID
 * @param {File[]} files - 이미지 파일 배열
 * @returns {Promise<{message: string, images: Array}>}
 */
export async function uploadProcessImages(processId, files) {
  const formData = new FormData();
  formData.append('process_id', processId);
  files.forEach((file) => formData.append('images', file));

  const response = await fetch('/api/uploads/process', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const { ApiError } = await import('./apiClient');
    throw new ApiError(response.status, body.message || '이미지 업로드 중 오류가 발생했습니다.');
  }

  return response.json();
}

/**
 * 민원 이미지 삭제
 * @param {number} imageId - 이미지 ID
 * @returns {Promise<{message: string}>}
 */
export async function deleteComplainImage(imageId) {
  return apiClient(`/uploads/complain/${imageId}`, {
    method: 'DELETE',
  });
}

/**
 * 처리 이미지 삭제
 * @param {number} imageId - 처리 이미지 ID
 */
export async function deleteProcessImage(imageId) {
  return apiClient(`/uploads/process/${imageId}`, {
    method: 'DELETE',
  });
}
