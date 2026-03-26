import "./FormPopup.css";
import { X } from "lucide-react";

const FormPopup = ({ isOpen, onClose, title, children, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <button className="form-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="form-content">
          <h2 className="form-title">{title}</h2>

          <div className="form-body">
            {children}
          </div>

          <button className="form-submit-btn" onClick={onSubmit}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormPopup;
