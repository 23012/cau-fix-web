import "./LoadingPopup.css";

const LoadingPopup = ({ isOpen, message = "등록 중입니다..." }) => {
  if (!isOpen) return null;

  return (
    <div className="loading-popup-overlay">
      <div className="loading-popup">
        <div className="loading-spinner" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingPopup;
