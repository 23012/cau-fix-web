import { useState, useEffect } from "react";
import { getComplaintDetail } from "../services/complainService";
import { normalizeStatus } from "../constants/status";

/**
 * 민원 상세 데이터를 API에서 가져오는 훅
 * @param {number|null} complainId - 민원 ID (null이면 호출 안 함)
 * @returns {{ detail: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export default function useComplainDetail(complainId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    if (!complainId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getComplaintDetail(complainId);
      setDetail({
        ...result.complain,
        status: normalizeStatus(result.complain.status),
        process: result.process || null,
        images: result.images || [],
        processImages: result.processImages || [],
      });
    } catch (err) {
      setError(err.message || "상세 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [complainId]);

  return { detail, loading, error, refetch: fetchDetail };
}
