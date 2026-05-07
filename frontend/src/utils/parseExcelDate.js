/**
 * 날짜 값(숫자, 문자열, Date)을 Date 객체로 변환합니다.
 * - 엑셀 시리얼 넘버 지원
 * - "2026-05-06 15:24:34.417149" 형식 지원
 * - ISO 문자열 지원
 * @param {number|string|Date} value - 날짜 값
 * @returns {Date|null} 변환된 Date 객체, 실패 시 null
 */
export const parseExcelDate = (value) => {
  if (value == null) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  let dateObj;

  if (typeof value === "number") {
    dateObj = new Date((value - 25569) * 86400 * 1000);
  } else {
    const dateStr = value.toString().trim();
    // "2026-05-06 15:24:34.417149" 형식 처리
    dateObj = new Date(dateStr.replace(" ", "T"));
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date(dateStr);
    }
  }

  if (isNaN(dateObj.getTime())) return null;
  return dateObj;
};
