import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";
import { parseExcelDate } from "../../utils/parseExcelDate";
import "./NoticeDetail.css";

// 검증된 라이브러리(DOMPurify) 기반 살균 — 정규식 방식은 우회 가능하여 교체
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "br", "div", "span", "b", "strong", "i", "em", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "blockquote",
    "pre", "code", "img",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "style"],
};

const sanitizeHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
};

const NoticeDetail = ({ data, onBack, onEdit, onDelete, currentUser }) => {
  if (!data) return null;

  const isAuthor = currentUser && data.author === currentUser;

  return <NoticeDetailInner data={data} onBack={onBack} onEdit={onEdit} onDelete={onDelete} isAuthor={isAuthor} />;
};

const NoticeDetailInner = ({ data, onBack, onEdit, onDelete, isAuthor }) => {
  return (
    <div className="notice-detail">
      <span className="notice-detail-category">{data.category}</span>
      <h2 className="notice-detail-title">{data.title}</h2>
      <span className="notice-detail-date">{(() => {
        const d = parseExcelDate(data.date);
        if (!d) return data.date;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      })()}</span>
      <span className="notice-detail-author">{data.author}</span>

      <div className="notice-detail-divider" />

      <div className="notice-detail-content">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) || "내용이 없습니다." }} />
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
