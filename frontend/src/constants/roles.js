// 코드 → 라벨 매핑
export const ROLE_CODE_TO_LABEL = {
  "C": "사용자",
  "E": "처리자",
  "A": "관리자",
};

// 라벨 → 코드 매핑
export const ROLE_LABEL_TO_CODE = {
  "사용자": "C",
  "처리자": "E",
  "관리자": "A",
};

export const ROLES = ["사용자", "처리자", "관리자"];

/**
 * 코드값 또는 레거시 영문값을 라벨로 변환
 * "C" → "사용자", "user" → "사용자", "사용자" → "사용자"
 */
export const normalizeRole = (value) => {
  if (ROLE_CODE_TO_LABEL[value]) return ROLE_CODE_TO_LABEL[value];
  const LEGACY = { "user": "사용자", "manager": "처리자", "admin": "관리자" };
  if (LEGACY[value]) return LEGACY[value];
  return value;
};
