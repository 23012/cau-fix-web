import { useState } from "react";
import { rejectEditRequest } from "../../services/editRequestService";
import { isRejectionReasonValid } from "../../utils/editRequestUtils";
import "./detail.css";

/**
 * 관리자 거절 사유 입력 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 (취소)
 * @param {number} complaintId - 민원 ID
 * @param {function} onSuccess - 거절 성공 콜백
 */
const RejectionModal = ({ isOpen, onClose, complaintId, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isValid = isRejectionReasonValid(reason);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await rejectEditRequest(complaintId, { reason: reason.trim() });
      setReason("");
      setError(null);
      onSuccess();
    } catch (err) {
      setError(err.message || "거절 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <div className="detail-confirm-overlay" onClick={handleClose}>
      <div
        className="detail-confirm-popup detail-process-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <p>거절 사유</p>
        <textarea
          className="detail-process-textarea"
          placeholder="내용을 입력하세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          disabled={submitting}
        />
        {error && <p className="edit-request-error">{error}</p>}
        <div className="detail-confirm-actions">
          <button
            className="detail-confirm-btn cancel"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            className="detail-confirm-btn"
            disabled={!isValid || submitting}
            onClick={handleSubmit}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
