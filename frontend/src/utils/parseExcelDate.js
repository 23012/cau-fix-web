/**
 * 엑셀 날짜 값(숫자 또는 문자열)을 Date 객체로 변환합니다.
 * @param {number|string} value - 엑셀 날짜 값
 * @returns {Date|null} 변환된 Date 객체, 실패 시 null
 */
export const parseExcelDate = (value) => {
  if (value == null) return null;

  let dateObj;

  if (typeof value === "number" || !isNaN(parseFloat(value))) {
    const excelNum = typeof value === "number" ? value : parseFloat(value);
    dateObj = new Date((excelNum - 25569) * 86400 * 1000);
  } else {
    const dateStr = value.toString().trim();
    const datePart = dateStr.split(" ")[0];
    dateObj = new Date(datePart);
  }

  if (isNaN(dateObj.getTime())) return null;
  return dateObj;
};
