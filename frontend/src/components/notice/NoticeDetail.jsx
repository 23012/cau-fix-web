import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import "./NoticeDetail.css";

const NoticeDetail = ({ data, onBack, onEdit, onDelete, currentUser }) => {
  if (!data) return null;

  const isAuthor = currentUser && data.author === currentUser;

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

      <div className="notice-detail-footer">
        <div className="notice-detail-back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>목록으로</span>
        </div>

        {isAuthor && (
          <div className="notice-detail-actions">
            <button className="notice-detail-edit-btn" onClick={() => onEdit?.(data)}>
              <Pencil size={16} />
              <span>수정</span>
            </button>
            <button className="notice-detail-delete-btn" onClick={() => {
              if (window.confirm("정말 삭제하시겠습니까?")) {
                onDelete?.(data.id);
              }
            }}>
              <Trash2 size={16} />
              <span>삭제</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetail;
