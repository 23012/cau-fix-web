import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getComplaints } from "../services/complainService";
import { normalizeStatus } from "../constants/status";

const ComplainDataContext = createContext(null);

/**
 * 민원 데이터 단일 소스 Provider
 * 앱 전체에서 하나의 tableData를 공유하여 데이터 일관성 보장
 */
export const ComplainDataProvider = ({ children }) => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    // 로그인 전이면 호출하지 않음
    const token = localStorage.getItem("token");
    if (!token) {
      setTableData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
      console.log('[ComplainData] loaded', parsed.length, 'complaints');
      setTableData(parsed);
    } catch (error) {
      console.error('[ComplainData] load failed:', error);
      // 데이터 로드 실패 시 빈 목록 유지
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    loadData();
  }, [loadData]);

  // storage 이벤트 (다른 탭에서 로그인/로그아웃 시 반영)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          loadData();
        } else {
          setTableData([]);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadData]);

  // 탭 전환/포커스 시 자동 갱신
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", loadData);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  return (
    <ComplainDataContext.Provider value={{ tableData, setTableData, loading, refetch: loadData }}>
      {children}
    </ComplainDataContext.Provider>
  );
};

/**
 * Context 소비용 훅
 * Provider 바깥에서 호출하면 에러 발생
 */
export const useComplainDataContext = () => {
  const ctx = useContext(ComplainDataContext);
  if (!ctx) {
    throw new Error("useComplainDataContext must be used within ComplainDataProvider");
  }
  return ctx;
};
