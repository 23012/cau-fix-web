import apiClient from './apiClient';

/**
 * 이 기기에 등록된 전환 가능 계정 목록
 * @returns {Promise<{accounts: Array<{member_id:number, login_id:string, name:string, role:string, dept:string, revoked:boolean}>}>}
 */
export async function listAccounts() {
  return apiClient('/auth/accounts');
}

/**
 * 계정 추가/재등록 (아이디+비밀번호 검증, 비밀번호는 저장하지 않음)
 */
export async function addAccount(loginId, password) {
  return apiClient('/auth/accounts', {
    method: 'POST',
    body: JSON.stringify({ login_id: loginId, password }),
  });
}

/**
 * 계정 전환 (세션 쿠키 재발급)
 * 실패 시 ApiError.code = 'PASSWORD_CHANGED' | 'NOT_FOUND'
 */
export async function switchAccount(memberId, autoLogin = false) {
  return apiClient('/auth/switch', {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId, auto_login: autoLogin }),
  });
}

/**
 * 계정을 목록에서 제거
 */
export async function removeAccount(memberId) {
  return apiClient(`/auth/accounts/${memberId}`, { method: 'DELETE' });
}
