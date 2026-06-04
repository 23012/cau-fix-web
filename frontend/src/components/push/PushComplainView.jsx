import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import ProgressBar from "../detail/ProgressBar";
import Status from "../common/Status";
import ImagePreview from "../common/ImagePreview";
import RejectionModal from "../detail/RejectionModal";
import EditComplaintPopup from "../detail/EditComplaintPopup";
import useEditRequest from "../../hooks/useEditRequest";
import { STATUS_CODE_TO_LABEL } from "../../constants/status";
import { parseExcelDate } from "../../utils/parseExcelDate";
import "./PushComplainView.css";

const PushComplainView = ({ data, onBack, onRefresh, rejectionReason }) => {
  const [activeTab, setActiveTab] = useState("content");
  const [imageError, setImageError] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isAdmin = user?.role === "관리자" || user?.role === "admin" || user?.role === "A";

  // 수정 요청 훅
  const { editRequest, approving, approve, refetch: refetchEditRequest } = useEditRequest(data?.id || null);

  // 수정 요청 전 상태 기준으로 ProgressBar 표시
  const progressStatus = useMemo(() => {
    if (data?.status === "수정중" && editRequest?.prevState) {
      return STATUS_CODE_TO_LABEL[editRequest.prevState] || data.status;
    }
    return data?.status;
  }, [data?.status, editRequest]);

  if (!data) return null;

  const formatDate = (value) => {
    if (!value) return "-";
    const dateObj = parseExcelDate(value);
    if (!dateObj) return "-";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const h = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const getImagePath = (imageName) => {
    if (!imageName) return null;
    if (imageName.startsWith('/uploads/') || imageName.startsWith('http')) return imageName;
    return `/uploads/complain/${imageName}`;
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;

  return (
    <>
      <div className="pcv-header" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>알림으로 돌아가기</span>
      </div>

      {/* 수정 요청 사유 */}
      <div className="pcv-body">
        {editRequest && (
          <>
            <div className="edit-title">수정 요청 사유</div>
            <div className="pcv-edit-request-reason">
              <span className="pcv-edit-request-reason-text">
                {editRequest.reasonType === '분류 항목 변경' && (
                  <>분류항목변경 : {editRequest.detail || '-'}</>
                )}
                {editRequest.reasonType === '기타' && (
                  <>기타 : {editRequest.detail || '-'}</>
                )}
                {editRequest.reasonType === '처리 담당자 변경' && (
                  <>처리 담당자 변경</>
                )}
                {!['분류 항목 변경', '기타', '처리 담당자 변경'].includes(editRequest.reasonType) && (
                  <>{editRequest.reasonType}</>
                )}
              </span>
            </div>
          </>
        )}

        {/* 반려 사유 */}
        {rejectionReason && (
          <>
            <div className="edit-title">반려 사유</div>
            <div className="pcv-edit-request-reason">
              <span className="pcv-edit-request-reason-text">
                {rejectionReason}
              </span>
            </div>
          </>
        )}

        <ProgressBar status={progressStatus} />

        <div className="pcv-tabs">
          <button
            className={`pcv-tab ${activeTab === "content" ? "active" : ""}`}
            onClick={() => setActiveTab("content")}
          >
            접수 내역
          </button>
          <button
            className={`pcv-tab ${activeTab === "result" ? "active" : ""}`}
            onClick={() => data.status === "완료" && setActiveTab("result")}
          >
            처리 내역
          </button>
        </div>

        {activeTab === "content" ? (
          <div className="pcv-content">
            <div className="pcv-title-row">
              <h3 className="pcv-title">{data.title}</h3>
              <Status status={data.status} />
            </div>
            <div className="pcv-row"><span className="pcv-label">신고자</span><span className="pcv-value">{data.memberName || data.reporterName || "-"}</span></div>
            <div className="pcv-row"><span className="pcv-label">부서</span><span className="pcv-value">{data.memberDept || data.dept || "-"}</span></div>
            <div className="pcv-row"><span className="pcv-label">구분</span><span className="pcv-value">{data.category || "-"}</span></div>
            <div className="pcv-row"><span className="pcv-label">장소</span><span className="pcv-value">{data.location || "-"}</span></div>
            <div className="pcv-row"><span className="pcv-label">시간</span><span className="pcv-value">{formatDate(data.date)}</span></div>
            <div className="pcv-desc">
              <p>{data.content || ""}</p>
              {imagePath && (
                <img
                  src={imagePath}
                  alt="민원 사진"
                  className="pcv-image"
                  onClick={() => setPreviewImage(imagePath)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="pcv-content">
            <div className="pcv-row"><span className="pcv-label">처리자</span><span className="pcv-value">{data.resultPerson || "-"}</span></div>
            <div className="pcv-row"><span className="pcv-label">처리 시간</span><span className="pcv-value">{formatDate(data.resultDate)}</span></div>
            <div className="pcv-desc"><p>{data.result || "-"}</p></div>
          </div>
        )}

        {/* 수정 요청 승인/반려 버튼 (관리자만) */}
        {editRequest && isAdmin && (
          <div className="pcv-edit-request-actions">
            <button
              className="pcv-edit-request-btn approve"
              onClick={async () => {
                // 담당자 변경 또는 기타: API 호출 없이 바로 수정 폼 표시
                if (editRequest?.reasonType === '처리 담당자 변경' || editRequest?.reasonType === '기타') {
                  setShowEditForm(true);
                } else {
                  // 분류 항목 변경: 즉시 처리
                  try {
                    await approve();
                    refetchEditRequest();
                    onRefresh?.();
                    alert("수정 요청이 승인되었습니다.");
                  } catch (err) {}
                }
              }}
              disabled={approving}
            >
              승인
            </button>
            <button
              className="pcv-edit-request-btn reject"
              onClick={() => setRejectionModalOpen(true)}
              disabled={approving}
            >
              반려
            </button>
          </div>
        )}
      </div>

      <ImagePreview src={previewImage} alt="민원 사진" onClose={() => setPreviewImage(null)} />

      {/* 승인 후 민원 수정 폼 (담당자 변경 / 기타) */}
      {showEditForm && (editRequest?.reasonType === '처리 담당자 변경' || editRequest?.reasonType === '기타') && (
        <EditComplaintPopup
          isOpen={true}
          onClose={() => setShowEditForm(false)}
          complaintId={data.id}
          editRequest={editRequest}
          currentData={data}
          onComplete={async () => {
            setShowEditForm(false);
            refetchEditRequest();
            onRefresh?.();
          }}
        />
      )}

      {/* 반려 모달 */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        complaintId={data.id}
        onSuccess={() => {
          setRejectionModalOpen(false);
          refetchEditRequest();
          onRefresh?.();
          alert("수정 요청이 반려되었습니다.");
        }}
      />
    </>
  );
};

export default PushComplainView;
