import { STATUSES } from "../../constants/status";

const StatusChangePopup = ({ isOpen, selectedStatus, setSelectedStatus, onCancel, onNext }) => {
  if (!isOpen) return null;

  return (
    <div className="detail-confirm-overlay" onClick={onCancel}>
      <div className="detail-confirm-popup detail-status-popup" onClick={(e) => e.stopPropagation()}>
        <p>변경할 상태를 선택하세요</p>
        <select
          className="detail-status-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">상태 선택</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="detail-confirm-actions">
          <button className="detail-confirm-btn cancel" onClick={onCancel}>
            취소
          </button>
          <button
            className="detail-confirm-btn"
            disabled={!selectedStatus}
            onClick={onNext}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangePopup;
