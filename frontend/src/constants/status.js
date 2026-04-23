// 코드 → 라벨 매핑
export const STATUS_CODE_TO_LABEL = {
  "B": "접수전",
  "A": "접수중",
  "P": "진행중",
  "D": "완료",
};

// 라벨 → 코드 매핑
export const STATUS_LABEL_TO_CODE = {
  "접수전": "B",
  "접수중": "A",
  "진행중": "P",
  "완료": "D",
};

export const STATUSES = ["접수전", "접수중", "진행중", "완료"];

export const STATUS_TABS = ["전체", ...STATUSES];

export const STATUS_ORDER = {
  "접수전": 0,
  "접수중": 1,
  "진행중": 2,
  "완료": 3,
};

export const STATUS_COLORS = {
  "접수전": "#9e9e9e",
  "접수중": "#FFC107",
  "진행중": "#63BE7B",
  "완료": "#006EB7",
};

export const STATUS_CLASS = {
  "접수전": "pending",
  "접수중": "received",
  "진행중": "progress",
  "완료": "done",
};

/**
 * 코드값 또는 레거시 한글값을 라벨로 변환
 * "B" → "접수전", "접수" → "접수중", "접수전" → "접수전"
 */
export const normalizeStatus = (value) => {
  if (STATUS_CODE_TO_LABEL[value]) return STATUS_CODE_TO_LABEL[value];
  if (value === "접수") return "접수중";
  return value;
};

