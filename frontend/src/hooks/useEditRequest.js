import { useState, useEffect, useCallback } from "react";
import { getEditRequest, approveEditRequest } from "../services/editRequestService";

/**
 * 수정 요청 관련 상태 관리 훅
 * @param {number|null} complaintId - 민원 ID (null이면 호출 안 함)
 * @returns {{ editRequest: Object|null, loading: boolean, error: string|null, approving: boolean, approve: Function, refetch: Function }}
 */
export default function useEditRequest(complaintId) {
  const [editRequest, setEditRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);

  const fetchEditRequest = useCallback(async () => {
    if (!complaintId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getEditRequest(complaintId);
      setEditRequest(result.editRequest || null);
    } catch (err) {
      setError(err.message || "수정 요청 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  const approve = useCallback(async () => {
    if (!complaintId || approving) return;
    setApproving(true);
    setError(null);
    try {
      await approveEditRequest(complaintId);
      // 승인 성공 후 수정 요청 데이터 갱신 (status가 APPROVED로 변경됨)
      await fetchEditRequest();
    } catch (err) {
      if (err.status === 409) {
        setError("이미 처리된 요청입니다.");
        await fetchEditRequest();
      } else {
        setError(err.message || "승인 처리 중 오류가 발생했습니다.");
      }
      throw err;
    } finally {
      setApproving(false);
    }
  }, [complaintId, approving, fetchEditRequest]);

  useEffect(() => {
    fetchEditRequest();
  }, [fetchEditRequest]);

  return {
    editRequest,
    loading,
    error,
    approving,
    approve,
    refetch: fetchEditRequest,
  };
}
