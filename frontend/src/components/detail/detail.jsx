import "./detail.css";
import { MoreVertical, ChevronRight, Camera } from "lucide-react";
import Status from "../common/Status";
import FormPopup from "../form/FormPopup";
import ProfilePopup from "./ProfilePopup";
import { useState, useRef } from "react";

const CATEGORIES = ["건축영선", "장비(의료,PC)", "기계/소방", "전기/통신", "보안", "미화"];

const Detail = ({ isOpen, onClose, data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("content");
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showCategory, setShowCategory] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [showNoResultPopup, setShowNoResultPopup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !data) return null;

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

  const getImagePath = (imageName) => {
    if (!imageName) return null;
    try {
      return require(`../../assets/images/complain/${imageName}`);
    } catch (error) {
      return null;
    }
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;

  const handleEdit = () => {
    setEditData({
      title: data.title || "",
      category: data.category || "",
      location: data.location || "",
      content: data.content || "",
    });
    setEditImages([]);
    setEditMode(true);
    setMenuOpen(false);
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = () => {
    if (!editData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    onUpdate?.({ ...data, ...editData, images: editImages });
    setEditMode(false);
  };

  const handleResultTab = () => {
    if (data.status === "완료") {
      setActiveTab("result");
    } else {
      setShowNoResultPopup(true);
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setShowCategory(false);
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    if (editImages.length + files.length > 10) {
      alert("사진은 최대 10장까지 첨부할 수 있습니다.");
      return;
    }
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setEditImages((prev) => [...prev, ...newImages]);
  };

  const handleImageRemove = (index) => {
    setEditImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 수정 모드
  if (editMode) {
    return (
      <FormPopup
        isOpen={true}
        onClose={handleEditCancel}
        submitLabel="수정"
        onSubmit={handleEditSubmit}
      >
        <div className="detail-tabs">
          <button className="detail-tab active">민원 내용</button>
          <button className="detail-tab" disabled>처리 내용</button>
        </div>

        <div className="form-field">
          <input
            type="text"
            className="form-input"
            placeholder="제목"
            value={editData.title}
            onChange={(e) => handleEditChange("title", e.target.value)}
          />
        </div>

        <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
          <span className={editData.category ? "form-field-value" : "form-field-placeholder"}>
            {editData.category || "구분"}
          </span>
          <ChevronRight size={20} className="form-field-arrow" />
          {showCategory && (
            <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`form-dropdown-item ${editData.category === cat ? "active" : ""}`}
                  onClick={() => {
                    handleEditChange("category", cat);
                    setShowCategory(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-field form-field-readonly">
          <span className="form-field-value">{formatDate(data.date)}</span>
        </div>

        <div className="form-field">
          <input
            type="text"
            className="form-input"
            placeholder="장소"
            value={editData.location}
            onChange={(e) => handleEditChange("location", e.target.value)}
          />
        </div>

        <div className="form-field">
          <textarea
            className="form-textarea"
            placeholder="접수 내용을 입력하세요"
            value={editData.content}
            onChange={(e) => handleEditChange("content", e.target.value)}
          />
        </div>

        <div className="form-images">
          <div className="form-image-upload" onClick={() => fileInputRef.current?.click()}>
            <Camera size={32} color="#63C3D1" />
            <span className="form-image-count">{editImages.length} / 10</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageAdd}
            />
          </div>
          {editImages.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
          {imagePath && (
            <div className="form-image-preview">
              <img src={imagePath} alt="기존 사진" />
            </div>
          )}
        </div>
      </FormPopup>
    );
  }

  // 읽기 모드
  return (
    <FormPopup isOpen={true} onClose={onClose} hideSubmit>
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          민원 내용
        </button>
        <button
          className={`detail-tab ${activeTab === "result" ? "active" : ""}`}
          onClick={handleResultTab}
        >
          처리 내용
        </button>
      </div>

      {activeTab === "content" ? (
        <>
          <div className="detail-header">
            <div className="detail-header-left">
              <h2 className="detail-title">{data.title || "-"}</h2>
            </div>
            <div className="detail-header-right">
              <Status status={data.status} />
              <button
                className="detail-menu-btn"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreVertical size={20} />
              </button>
              {menuOpen && (
                <div className="detail-menu-popup">
                  {data.status === "접수전" && (
                    <button
                      className="detail-menu-item"
                      onClick={handleEdit}
                    >
                      수정
                    </button>
                  )}
                  <button
                    className="detail-menu-item delete"
                    onClick={() => {
                      console.log("삭제 클릭");
                      setMenuOpen(false);
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

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
            <div className="detail-label">접수 시간</div>
            <div className="detail-value">{formatDate(data.date)}</div>
          </div>

          <div className="detail-tab-content">
            <div className="detail-text-content">
              <p>{data.content || ""}</p>
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
          </div>
        </>
      ) : (
        data.result && (
          <>
            <div className="detail-row">
              <div className="detail-label">처리자</div>
              <div
                className="detail-value detail-value-clickable"
                onClick={() => setShowProfile(true)}
              >
                {data.resultPerson || "-"}
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">처리 시간</div>
              <div className="detail-value">{formatDate(data.resultDate) || "-"}</div>
            </div>

            <div className="detail-tab-content">
              <div className="detail-text-content">
                <p>{data.result || "-"}</p>
              </div>
            </div>
          </>
        )
      )}

      {showNoResultPopup && (
        <div className="detail-no-result-overlay" onClick={() => setShowNoResultPopup(false)}>
          <div className="detail-no-result-popup" onClick={(e) => e.stopPropagation()}>
            <p>아직 민원 처리가 완료되지 않았습니다.<br />처리가 완료되면<br/>내용을 확인하실 수 있습니다.</p>
            <button className="detail-no-result-btn" onClick={() => setShowNoResultPopup(false)}>
              확인
            </button>
          </div>
        </div>
      )}

      <ProfilePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        name={data.resultPerson}
        dept={data.resultDept}
        phone={data.resultPhone}
      />
    </FormPopup>
  );
};

export default Detail;