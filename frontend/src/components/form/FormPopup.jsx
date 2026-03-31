import "./FormPopup.css";
import { X } from "lucide-react";

const FormPopup = ({ isOpen, onClose, title, children, onSubmit, submitLabel = "등록", hideSubmit = false }) => {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <button className="form-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="form-content">
          {title && <h2 className="form-title">{title}</h2>}

          <div className="form-body">
            {children}
          </div>

          {!hideSubmit && (
            <button className="form-submit-btn" onClick={onSubmit}>
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormPopup;
