import { parseExcelDate } from "./parseExcelDate";

/**
 * 엑셀 날짜 값을 "YYYY-MM-DD HH:mm" 형식 문자열로 변환
 * @param {number|string|Date} value - 엑셀 날짜 값
 * @returns {string} 포맷된 날짜 문자열, 실패 시 "-"
 */
export const formatDate = (value) => {
  if (!value) return "-";
  const d = parseExcelDate(value);
  if (!d) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
};

/**
 * ISO/DB 날짜 문자열을 "YYYY-MM-DD HH:mm" 형식으로 변환
 * @param {string|Date} raw - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 문자열, 실패 시 "-"
 */
export const formatDateTime = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
};

/**
 * 현재 시각을 "YYYY-MM-DD HH:mm" 형식으로 반환
 * @returns {string}
 */
export const getNow = () => formatDateTime(new Date());
