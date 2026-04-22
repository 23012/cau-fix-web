import { ArrowLeft } from "lucide-react";
import "./NoticeDetail.css";

const NoticeDetail = ({ data, onBack }) => {
  if (!data) return null;

  return (
    <div className="notice-detail">
      <span className="notice-detail-category">{data.category}</span>
      <h2 className="notice-detail-title">{data.title}</h2>
      <span className="notice-detail-date">{data.date}</span>
      <span className="notice-detail-author">{data.author}</span>

      <div className="notice-detail-divider" />

      <div className="notice-detail-content">
        <p>{data.content || "내용이 없습니다."}</p>
      </div>

      <div className="notice-detail-divider" />
      <div className="notice-detail-back" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>목록으로</span>
      </div>
    </div>
  );
};

export default NoticeDetail;
