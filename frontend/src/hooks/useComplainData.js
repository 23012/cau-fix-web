import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import sampleFile from "../assets/files/sample.xlsx";
import loginDataFile from "../assets/files/logindata.xlsx";
import { normalizeStatus } from "../constants/status";
import { normalizeCategory } from "../constants/categories";

/**
 * 민원 데이터 + 회원 데이터를 엑셀에서 로딩하는 공통 훅
 * TODO: 백엔드 연결 시 이 훅 내부만 API 호출로 교체하면 됨
 *   - GET /api/complains → 민원 목록
 *   - GET /api/members → 회원 정보 (memberMap 대체)
 *   - GET /api/processes → 처리 내역 (resultMap 대체)
 */
const useComplainData = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sampleRes, loginRes] = await Promise.all([
          fetch(sampleFile),
          fetch(loginDataFile),
        ]);
        const sampleBuffer = await sampleRes.arrayBuffer();
        const loginBuffer = await loginRes.arrayBuffer();

        // 회원 정보 매핑
        const loginWb = XLSX.read(loginBuffer, { type: "array" });
        const loginSheet = loginWb.Sheets[loginWb.SheetNames[0]];
        const loginRows = XLSX.utils.sheet_to_json(loginSheet);
        const memberByIdMap = {};
        loginRows.forEach((row) => {
          const memberId = row["member_id"];
          if (memberId != null) {
            memberByIdMap[String(memberId)] = {
              name: row["name"]?.toString() || null,
              department: row["dept"]?.toString() || null,
              phone: row["phone"]?.toString() || null,
            };
          }
        });

        // 민원 + 처리 데이터
        const workbook = XLSX.read(sampleBuffer, { type: "array" });
        const complainRows = XLSX.utils.sheet_to_json(workbook.Sheets["민원"]);
        const resultRows = XLSX.utils.sheet_to_json(workbook.Sheets["처리"]);

        const resultMap = {};
        resultRows.forEach((row) => {
          resultMap[row["complain_id"]] = {
            resultContent: row["process_content"],
            resultPersonId: row["process_by"],
            resultPerson: memberByIdMap[String(row["process_by"])]?.name || null,
            resultDate: row["process_at"],
          };
        });

        const parsed = complainRows.map((row) => {
          const id = row["complain_id"];
          const userId = String(row["complain_by"] ?? "");
          const member = memberByIdMap[userId] || {};
          const result = resultMap[id] || {};
          return {
            id,
            complainBy: row["complain_by"] || null,
            reporterName: member.name || null,
            reporterPhone: member.phone || null,
            dept: member.department || null,
            category: normalizeCategory(row["category_id"]),
            title: row["complain_title"],
            content: row["complain_content"],
            location: row["location"],
            status: normalizeStatus(row["state"]),
            date: row["complain_at"],
            image: row["complain_img_id"] || null,
            result: result.resultContent || null,
            resultPerson: result.resultPerson || null,
            resultPersonId: result.resultPersonId || null,
            resultDate: result.resultDate || null,
            resultDept: memberByIdMap[String(result.resultPersonId)]?.department || null,
            resultPhone: memberByIdMap[String(result.resultPersonId)]?.phone || null,
          };
        });

        setTableData(parsed);
      } catch (error) {
        // 데이터 로드 실패 시 빈 목록 유지
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { tableData, setTableData, loading };
};

export default useComplainData;
