// 코드 → 라벨 매핑
export const CATEGORY_CODE_TO_LABEL = {
  1: "건축/영선",
  2: "의료장비",
  3: "기계/소방",
  4: "전기/통신",
  5: "보안",
  6: "미화",
};

// 라벨 → 코드 매핑
export const CATEGORY_LABEL_TO_CODE = {
  "건축/영선": 1,
  "의료장비": 2,
  "기계/소방": 3,
  "전기/통신": 4,
  "보안": 5,
  "미화": 6,
};

export const CATEGORIES = [
  "건축/영선",
  "의료장비",
  "기계/소방",
  "전기/통신",
  "보안",
  "미화",
];

export const DEPARTMENTS = ["전체", ...CATEGORIES];

/**
 * 코드값 또는 한글값을 라벨로 변환
 * 1 → "건축/영선", "건축/영선" → "건축/영선"
 */
export const normalizeCategory = (value) => {
  if (CATEGORY_CODE_TO_LABEL[value]) return CATEGORY_CODE_TO_LABEL[value];
  return value;
};
