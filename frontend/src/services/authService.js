import apiClient from './apiClient';

/**
 * 아이디 중복 확인
 * @param {string} loginId - 확인할 아이디
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkDuplicateId(loginId) {
  return apiClient(`/auth/check-id/${encodeURIComponent(loginId)}`);
}

/**
 * 로그인
 * @param {string} loginId - 아이디
 * @param {string} password - 비밀번호
 * @returns {Promise<{message: string, token: string, member: Object}>}
 */
export async function login(loginId, password) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login_id: loginId, password }),
  });
}

/**
 * 회원가입
 * @param {Object} formData - 프론트엔드 폼 데이터
 * @returns {Promise<{message: string, member: Object}>}
 */
export async function register(formData) {
  const payload = {
    login_id: formData.id,
    password: formData.password,
    name: formData.name,
    role: formData.role,
    dept: formData.dept,
    phone: formData.phone,
  };

  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
