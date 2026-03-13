import "./detail.css";
import { X } from "lucide-react";
import Status from "../common/Status";
import { useState } from "react";

const Detail = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState("content"); // "content" or "result"
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !data) return null;

  // Excel 날짜를 JavaScript Date로 변환
  const formatDate = (excelDate) => {
    if (!excelDate) return "-";
    
    let dateObj;
    if (typeof excelDate === 'number' || !isNaN(parseFloat(excelDate))) {
      const excelNum = typeof excelDate === 'number' ? excelDate : parseFloat(excelDate);
      dateObj = new Date((excelNum - 25569) * 86400 * 1000);
    } else {
      const dateStr = excelDate.toString().trim();
      const datePart = dateStr.split(' ')[0];
      dateObj = new Date(datePart);
    }
    
    if (isNaN(dateObj.getTime())) return "-";
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 이미지 경로 생성
  const getImagePath = (imageName) => {
    if (!imageName) return null;
    console.log("이미지 파일명:", imageName);
    try {
      const path = require(`../../assets/images/complain/${imageName}`);
      console.log("이미지 경로:", path);
      return path;
    } catch (error) {
      console.error(`이미지를 찾을 수 없습니다: ${imageName}`, error);
      return null;
    }
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;
  console.log("data.image:", data.image);
  console.log("imagePath:", imagePath);

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-container" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="detail-content">
          {/* 탭 헤더 */}
          <div className="detail-tabs">
            <button 
              className={`detail-tab ${activeTab === "content" ? "active" : ""}`}
              onClick={() => setActiveTab("content")}
            >
              민원 내용
            </button>
            <button 
              className={`detail-tab ${activeTab === "result" ? "active" : ""}`}
              onClick={() => setActiveTab("result")}
            >
              처리 내용
            </button>
          </div>

          {/* 제목 헤더 */}
          <div className="detail-header">
            <div className="detail-header-left">
              <h2 className="detail-title">{data.title || "-"}</h2>
            </div>
            <div className="detail-header-right">
              <Status status={data.status} />
            </div>
          </div>

          {/* 정보 행들 */}
          <div className="detail-row">
            <div className="detail-label">부서</div>
            <div className="detail-value">{data.dept || "-"}</div>
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
            <div className="detail-label">접수시간</div>
            <div className="detail-value">{formatDate(data.date)}</div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="detail-tab-content">
            {activeTab === "content" ? (
              <div className="detail-text-content">
                <p>{data.content || "-"}</p>
                {imagePath && (
                  <div className="detail-image-container">
                    <img 
                      src={imagePath} 
                      alt="민원 사진" 
                      className="detail-image"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="detail-text-content">
                <p>{data.result || "-"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
