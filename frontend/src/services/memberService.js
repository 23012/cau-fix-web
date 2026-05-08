import apiClient from './apiClient';

/**
 * 회원 목록 조회 (관리자)
 */
export async function getMembers() {
  return apiClient('/members');
}

/**
 * 회원 승인
 */
export async function approveMember(id) {
  return apiClient(`/members/${id}/approve`, { method: 'PUT' });
}

/**
 * 권한 변경
 */
export async function updateMemberRole(id, role) {
  return apiClient(`/members/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

/**
 * 담당 카테고리 변경
 */
export async function updateMemberDept(id, dept) {
  return apiClient(`/members/${id}/dept`, {
    method: 'PUT',
    body: JSON.stringify({ dept }),
  });
}

/**
 * 회원 탈퇴 (관리자)
 */
export async function deleteMember(id) {
  return apiClient(`/members/${id}`, { method: 'DELETE' });
}

/**
 * 아이디 중복 확인
 */
export async function checkLoginId(login_id) {
  return apiClient(`/auth/check-id/${login_id}`);
}

/**
 * 회원 추가 (관리자가 직접 등록)
 */
export async function registerMember({ login_id, password, name, role, dept, phone }) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login_id, password, name, role, dept, phone }),
  });
}

/**
 * 회원 프로필 조회 (처리자 정보)
 */
export async function getMemberProfile(id) {
  return apiClient(`/members/${id}/profile`);
}

/**
 * 내 정보 수정 (비밀번호, 전화번호)
 */
export async function updateMyProfile({ password, phone, dept }) {
  return apiClient('/members/me', {
    method: 'PUT',
    body: JSON.stringify({ password, phone, dept }),
  });
}

/**
 * 비밀번호 초기화 (관리자)
 */
export async function resetMemberPassword(id) {
  return apiClient(`/members/${id}/reset-password`, { method: 'PUT' });
}

/**
 * 회원 로그 조회 (관리자)
 */
export async function getMemberLogs(id) {
  return apiClient(`/members/${id}/logs`);
}
