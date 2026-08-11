import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

const DetailResult = ({ data, formatDate, onShowProfile, processImages = [], setPreviewImage }) => {
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

  // 담당자도 없고 처리 내용도 없으면 표시 안함
  if (!data.result && !data.resultPerson) return null;

  return (
    <>
      <div className="detail-row">
        <div className="detail-label">처리자</div>
        <div
          className={`detail-value ${data.resultPerson ? "detail-value-clickable" : ""}`}
          onClick={() => data.resultPerson && onShowProfile()}
        >
          {data.resultPerson || "-"}
        </div>
      </div>

      {data.resultDate && (
        <div className="detail-row">
          <div className="detail-label">처리 시간</div>
          <div className="detail-value">{formatDate(data.resultDate) || "-"}</div>
        </div>
      )}

      {data.result ? (
        <div className="detail-tab-content">
          <div className="detail-text-content">
            <p>{data.result}</p>
            {processImages.length > 0 && (
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
                  {processImages.map((img, i) => (
                    <img
                      key={img.id || i}
                      src={img.url}
                      alt={`처리 사진 ${i + 1}`}
                      className="detail-image-thumb"
                      decoding="async"
                      onClick={() => setPreviewImage?.(img.url)}
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
          </div>
        </div>
      ) : (
        <div className="detail-tab-content">
          <div className="detail-text-content">
            <p className="detail-no-content">아직 처리 내용이 작성되지 않았습니다.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailResult;
