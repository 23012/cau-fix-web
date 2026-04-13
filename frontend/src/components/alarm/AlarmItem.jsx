import "./AlarmItem.css";

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

const AlarmItem = ({ alarm, size = "small", onClick }) => {
  return (
    <div
      className={`alarm-item-row ${!alarm.read ? "unread" : ""} alarm-item-row--${size} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="alarm-item-text">
        <p className="alarm-item-title">{alarm.title}</p>
        <p className="alarm-item-desc">{alarm.desc}</p>
      </div>
      <span className="alarm-item-time">{formatTime(alarm.time)}</span>
    </div>
  );
};

export default AlarmItem;
