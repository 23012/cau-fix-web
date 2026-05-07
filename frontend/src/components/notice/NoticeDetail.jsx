import { ArrowLeft, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { parseExcelDate } from "../../utils/parseExcelDate";
import { useRef, useState } from "react";
import "./NoticeDetail.css";

const NoticeDetail = ({ data, onBack, onEdit, onDelete, currentUser }) => {
  if (!data) return null;

  const isAuthor = currentUser && data.author === currentUser;

  return <NoticeDetailInner data={data} onBack={onBack} onEdit={onEdit} onDelete={onDelete} isAuthor={isAuthor} />;
};

const NoticeDetailInner = ({ data, onBack, onEdit, onDelete, isAuthor }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  const checkOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowRightArrow(el.scrollWidth > el.clientWidth);
  };

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
        <p>{data.content || "내용이 없습니다."}</p>
        {data.images && data.images.length > 0 && (
          <div className="notice-image-scroll-wrapper">
            {showLeftArrow && (
              <button className="notice-image-arrow left" onClick={() => scrollBy(-1)}>
                <ChevronLeft size={20} />
              </button>
            )}
            <div
              className="notice-image-scroll"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {data.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`첨부 ${i + 1}`}
                  className="notice-image-thumb"
                  onClick={() => setPreviewImage(src)}
                  onLoad={checkOverflow}
                />
              ))}
            </div>
            {showRightArrow && (
              <button className="notice-image-arrow right" onClick={() => scrollBy(1)}>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}
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

      {previewImage && (
        <div className="notice-image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="미리보기" className="notice-image-preview-full" />
        </div>
      )}
    </div>
  );
};

export default NoticeDetail;
