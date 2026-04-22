export const STATUSES = ["접수전", "접수", "진행중", "완료"];

export const STATUS_TABS = ["전체", ...STATUSES];

export const STATUS_ORDER = {
  "접수전": 0,
  "접수": 1,
  "진행중": 2,
  "완료": 3,
};

export const STATUS_COLORS = {
  "접수전": "#9e9e9e",
  "접수": "#FFC107",
  "진행중": "#63BE7B",
  "완료": "#006EB7",
};

export const STATUS_CLASS = {
  "접수전": "pending",
  "접수": "received",
  "진행중": "progress",
  "완료": "done",
};
