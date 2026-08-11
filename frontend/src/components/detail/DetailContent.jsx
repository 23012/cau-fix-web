import Status from "../common/Status";
import DetailMenu from "./DetailMenu";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

const DetailContent = ({
  data, imagePath, menuOpen, setMenuOpen, setPreviewImage, setImageError,
  setShowReporterProfile, formatDate, apiImages,
  // menu props
  isEditor, fromStorage, user,
  onStatusChange, onDelete, onEdit, onCancelAccept, onAddFolder, onAlreadyMine, onHasOtherPerson,
}) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  // 완료 민원은 관리자에게만 ⋮ 메뉴(삭제) 노출, 그 외 상태는 기존대로
  const isAdmin = user?.role === "관리자" || user?.role === "admin" || user?.role === "A";
  const showMenuBtn = (isEditor || fromStorage) && (data.status !== "완료" || isAdmin);

  return (
    <>
      <div className="detail-header">
        <div className="detail-header-left">
          <h2 className="detail-title"><span className="detail-id">#{data.id}</span>{data.title || "-"}</h2>
        </div>
        <div className="detail-header-right">
          <Status status={data.status} />
          {showMenuBtn && (
            <button className="detail-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={20} />
            </button>
          )}
          {menuOpen && showMenuBtn && (
            <DetailMenu
              isEditor={isEditor}
              fromStorage={fromStorage}
              data={data}
              user={user}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
              onCancelAccept={onCancelAccept}
              onAddFolder={onAddFolder}
              onAlreadyMine={onAlreadyMine}
              onHasOtherPerson={onHasOtherPerson}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">신고자</div>
        <div
          className="detail-value detail-value-clickable"
          onClick={() => (data.memberName || data.reporterName) && setShowReporterProfile(true)}
        >
          {data.memberName || data.reporterName || "-"}
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">부서</div>
        <div className="detail-value">{data.memberDept || data.dept || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">분류</div>
        <div className="detail-value">{data.category || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">장소</div>
        <div className="detail-value">{data.location || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">접수 시간</div>
        <div className="detail-value">{formatDate(data.date)}</div>
      </div>

      <div className="detail-tab-content">
        <div className="detail-text-content">
          <p>{data.content || ""}</p>
          {apiImages && apiImages.length > 0 && (
            <div className="detail-image-scroll-wrapper">
              {showLeftArrow && (
                <button className="detail-image-arrow left" onClick={() => scrollBy(-1)}>
                  <ChevronLeft size={20} />
                </button>
              )}
              <div
                className="detail-image-scroll"
                ref={scrollRef}
                onScroll={handleScroll}
                onLoad={checkOverflow}
              >
                {apiImages.map((img, i) => (
                  <img
                    key={img.id || i}
                    src={img.url}
                    alt={`민원 사진 ${i + 1}`}
                    className="detail-image-thumb"
                    decoding="async"
                    onClick={() => setPreviewImage(img.url)}
                    onLoad={(e) => { e.target.classList.add("loaded"); checkOverflow(); }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ))}
              </div>
              {showRightArrow && (
                <button className="detail-image-arrow right" onClick={() => scrollBy(1)}>
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          )}
          {!apiImages?.length && imagePath && (
            <div className="detail-image-container">
              <img
                src={imagePath}
                alt="민원 사진"
                className="detail-image detail-image-clickable"
                onClick={() => setPreviewImage(imagePath)}
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DetailContent;
