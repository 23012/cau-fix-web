import { useState, useEffect } from "react";
import { getComplaintDetail } from "../services/complainService";
import { normalizeStatus } from "../constants/status";

const mapDetail = (result) => ({
  ...result.complain,
  status: normalizeStatus(result.complain.status),
  process: result.process || null,
  images: result.images || [],
  processImages: result.processImages || [],
  canAccept: result.canAccept ?? false,
});

/**
 * 민원 상세 데이터를 API에서 가져오는 훅
 * @param {number|null} complainId - 민원 ID (null이면 호출 안 함)
 * @returns {{ detail: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export default function useComplainDetail(complainId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 같은 민원 새로고침용 (상세를 비우지 않아 깜빡임 없음)
  const fetchDetail = async () => {
    if (!complainId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getComplaintDetail(complainId);
      setDetail(mapDetail(result));
    } catch (err) {
      setError(err.message || "상세 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  // 민원 id가 바뀌면 이전 상세를 즉시 비우고 새로 가져온다.
  // (안 비우면 새 fetch가 끝날 때까지 이전 민원 내용이 잔상으로 남는다.
  //  ignore 플래그로 빠르게 전환 시 옛 응답이 새 민원을 덮어쓰는 레이스도 방지)
  useEffect(() => {
    let ignore = false;
    if (!complainId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    setDetail(null);
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const result = await getComplaintDetail(complainId);
        if (!ignore) setDetail(mapDetail(result));
      } catch (err) {
        if (!ignore) setError(err.message || "상세 정보를 불러올 수 없습니다");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [complainId]);

  return { detail, loading, error, refetch: fetchDetail };
}
