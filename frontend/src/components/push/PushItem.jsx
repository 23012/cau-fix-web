import "./PushItem.css";

const formatTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

const PushItem = ({ push, size = "small", onClick }) => {
  return (
    <div
      className={`push-item-row ${!push.read ? "unread" : ""} push-item-row--${size} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="push-item-text">
        <p className="push-item-title">{push.title}</p>
        <p className="push-item-desc">{push.desc}</p>
      </div>
      <span className="push-item-time">{formatTime(push.time)}</span>
    </div>
  );
};

export default PushItem;
