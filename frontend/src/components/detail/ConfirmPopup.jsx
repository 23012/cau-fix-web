import "./detail.css";

const ConfirmPopup = ({ isOpen, message, onConfirm, onCancel, confirmLabel = "확인", cancelLabel, confirmType }) => {
  if (!isOpen) return null;

  return (
    <div className="detail-confirm-overlay" onClick={onCancel || onConfirm}>
      <div className="detail-confirm-popup" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        {cancelLabel ? (
          <div className="detail-confirm-actions">
            <button className="detail-confirm-btn cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className={`detail-confirm-btn ${confirmType || ""}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        ) : (
          <button className="detail-confirm-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmPopup;
