import "./ProfilePopup.css";
import { X } from "lucide-react";
import logo from "../../assets/images/app.png";

const ProfilePopup = ({ isOpen, onClose, name, dept, phone }) => {
  if (!isOpen) return null;

  return (
    <div className="profile-popup-overlay" onClick={onClose}>
      <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
        <div className="profile-popup-header">
          <button className="profile-popup-close" onClick={onClose}>
            <X size={22} color="#fff" />
          </button>
          <div className="profile-popup-info">
            <div className="profile-popup-avatar">
              <img src={logo} alt="프로필" />
            </div>
            <div className="profile-popup-name-area">
              <div className="profile-popup-name-row">
                <span className="profile-popup-name">{name || "-"}</span>
                <span className="profile-popup-suffix">님</span>
              </div>
              <div className="profile-popup-dept-badge">{dept || "-"}</div>
            </div>
          </div>
        </div>
        <div className="profile-popup-body">
          <div className="profile-popup-row">
            <span className="profile-popup-label">전화 번호</span>
            <span className="profile-popup-value">{phone || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
