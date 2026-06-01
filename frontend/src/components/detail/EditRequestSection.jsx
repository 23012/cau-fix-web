import { getEditRequestSectionVisibility } from "../../utils/editRequestUtils";
import { formatDateTime } from "../../utils/formatDate";

/**
 * 관리자 민원 상세 페이지 - 수정 요청 확인 영역
 * @param {Object|null} editRequest - 수정 요청 데이터
 * @param {boolean} isAdmin - 관리자 여부
 * @param {boolean} approving - 승인 API 진행 중
 * @param {function} onApprove - 승인 버튼 클릭 콜백
 * @param {function} onReject - 거절 버튼 클릭 콜백
 */
const EditRequestSection = ({ editRequest, isAdmin, approving, onApprove, onReject }) => {
  const userRole = isAdmin ? "관리자" : "처리자";
  const { showSection, showButtons } = getEditRequestSectionVisibility(editRequest, userRole);

  if (!showSection) return null;

  const getReasonTypeLabel = (reasonType) => {
    switch (reasonType) {
      case "처리 담당자 변경":
        return "처리 담당자 변경";
      case "분류 항목 변경":
        return "분류 항목 변경";
      case "기타":
        return "기타";
      default:
        return reasonType || "-";
    }
  };

  return (
    <div className="edit-request-section">
      <div className="edit-request-section-title">수정 요청</div>

      <div className="detail-row">
        <div className="detail-label">사유</div>
        <div className="detail-value">{getReasonTypeLabel(editRequest.reasonType)}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">요청 시간</div>
        <div className="detail-value">{formatDateTime(editRequest.createdAt)}</div>
      </div>

      <div className="detail-row">
        <div className="detail-value">
          {(editRequest.reasonType === '처리 담당자 변경') && (
                <>{''}</>
          )}
          {(editRequest.reasonType === '기타' || editRequest.reasonType === '분류 항목 변경') && (
                <>{editRequest.detail}</>
          )}
        </div>
      </div>

      {showButtons && (
        <div className="edit-request-actions">
          <button
            className="edit-request-btn approve"
            onClick={onApprove}
            disabled={approving}
          >
            승인
          </button>
          <button
            className="edit-request-btn reject"
            onClick={onReject}
            disabled={approving}
          >
            반려
          </button>
        </div>
      )}
    </div>
  );
};

export default EditRequestSection;
