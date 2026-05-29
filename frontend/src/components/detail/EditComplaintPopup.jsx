import { X } from "lucide-react";
import EditComplaintForm from "./EditComplaintForm";
import "./EditComplaintPopup.css";

/**
 * 민원 수정 팝업 (별도 창)
 * 내용 높이에 따라 동적으로 크기 조절
 */
const EditComplaintPopup = ({ isOpen, onClose, complaintId, editRequest, currentData, onComplete }) => {
  if (!isOpen) return null;

  return (
    <div className="edit-popup-overlay" onClick={onClose}>
      <div className="edit-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-popup-top-bar">
          <h2 className="edit-popup-title">민원 수정</h2>
          <button className="edit-popup-close-btn" onClick={onClose}>
            <X size={25} />
          </button>
        </div>
        <hr className="edit-popup-divider" />
        <div className="edit-popup-body">
          <EditComplaintForm
            complaintId={complaintId}
            editRequest={editRequest}
            currentData={currentData}
            onComplete={onComplete}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default EditComplaintPopup;
