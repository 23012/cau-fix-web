import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ProgressBar from "../detail/ProgressBar";
import Status from "../common/Status";
import ImagePreview from "../common/ImagePreview";
import "./AlarmComplainView.css";

const AlarmComplainView = ({ data, onBack }) => {
  const [activeTab, setActiveTab] = useState("content");
  const [imageError, setImageError] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  if (!data) return null;

  const formatDate = (excelDate) => {
    if (!excelDate) return "-";
    let dateObj;
    if (typeof excelDate === "number" || !isNaN(parseFloat(excelDate))) {
      const num = typeof excelDate === "number" ? excelDate : parseFloat(excelDate);
      dateObj = new Date((num - 25569) * 86400 * 1000);
    } else {
      dateObj = new Date(excelDate.toString().trim().split(" ")[0]);
    }
    if (isNaN(dateObj.getTime())) return "-";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const h = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const getImagePath = (imageName) => {
    if (!imageName) return null;
    try {
      return require(`../../assets/images/complain/${imageName}`);
    } catch {
      return null;
    }
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;

  return (
    <>
      <div className="acv-header" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>알림으로 돌아가기</span>
      </div>

      <div className="acv-body">
        <ProgressBar status={data.status} />

        <div className="acv-tabs">
          <button
            className={`acv-tab ${activeTab === "content" ? "active" : ""}`}
            onClick={() => setActiveTab("content")}
          >
            접수 내역
          </button>
          <button
            className={`acv-tab ${activeTab === "result" ? "active" : ""}`}
            onClick={() => data.status === "완료" && setActiveTab("result")}
          >
            처리 내역
          </button>
        </div>

        {activeTab === "content" ? (
          <div className="acv-content">
            <div className="acv-title-row">
              <h3 className="acv-title">{data.title}</h3>
              <Status status={data.status} />
            </div>
            <div className="acv-row"><span className="acv-label">구분</span><span className="acv-value">{data.category || "-"}</span></div>
            <div className="acv-row"><span className="acv-label">장소</span><span className="acv-value">{data.location || "-"}</span></div>
            <div className="acv-row"><span className="acv-label">시간</span><span className="acv-value">{formatDate(data.date)}</span></div>
            <div className="acv-desc">
              <p>{data.content || ""}</p>
              {imagePath && (
                <img
                  src={imagePath}
                  alt="민원 사진"
                  className="acv-image"
                  onClick={() => setPreviewImage(imagePath)}
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="acv-content">
            <div className="acv-row"><span className="acv-label">처리자</span><span className="acv-value">{data.resultPerson || "-"}</span></div>
            <div className="acv-row"><span className="acv-label">처리 시간</span><span className="acv-value">{formatDate(data.resultDate)}</span></div>
            <div className="acv-desc"><p>{data.result || "-"}</p></div>
          </div>
        )}
      </div>

      <ImagePreview src={previewImage} alt="민원 사진" onClose={() => setPreviewImage(null)} />
    </>
  );
};

export default AlarmComplainView;
