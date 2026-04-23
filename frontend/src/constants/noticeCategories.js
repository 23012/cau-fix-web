// 코드 → 라벨 매핑
export const NOTICE_CATEGORY_CODE_TO_LABEL = {
  "G": "공지",
  "U": "업데이트",
  "F": "점검",
};

// 라벨 → 코드 매핑
export const NOTICE_CATEGORY_LABEL_TO_CODE = {
  "공지": "G",
  "업데이트": "U",
  "점검": "F",
};

export const NOTICE_CATEGORIES = ["공지", "업데이트", "점검"];

/**
 * 코드값 또는 레거시 한글값을 라벨로 변환
 * "G" → "공지", "안내" → "공지", "공지" → "공지"
 */
export const normalizeNoticeCategory = (value) => {
  if (NOTICE_CATEGORY_CODE_TO_LABEL[value]) return NOTICE_CATEGORY_CODE_TO_LABEL[value];
  if (value === "안내") return "공지";
  return value;
};
