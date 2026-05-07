import { useState, useEffect } from "react";
import { getComplaints } from "../services/complainService";
import { normalizeStatus } from "../constants/status";

/**
 * 민원 데이터를 API에서 로딩하는 공통 훅
 * 기존 Excel 로딩을 API 호출로 교체
 */
const useComplainData = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getComplaints();
        const parsed = result.complaints.map((row) => ({
          id: row.id,
          complainBy: row.complainBy || null,
          reporterName: row.memberName || null,
          reporterPhone: row.memberPhone || null,
          dept: row.memberDept || null,
          category: row.category,
          title: row.title,
          content: row.content,
          location: row.location || null,
          status: normalizeStatus(row.status),
          date: row.date,
          image: null,
          result: row.result || null,
          resultPerson: row.resultPerson || null,
          resultPersonId: row.resultPersonId || null,
          resultDate: row.resultDate || null,
          resultDept: row.resultDept || null,
          resultPhone: row.resultPhone || null,
        }));
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
