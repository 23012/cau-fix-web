import { useState } from "react";
import { ChevronRight, Camera } from "lucide-react";
import FormPopup from "./FormPopup";
import ImagePreview from "../common/ImagePreview";
import { CATEGORIES } from "../../constants/categories";
import useImageUpload from "../../hooks/useImageUpload";

/**
 * 민원 접수 폼
 * TODO: 백엔드 연결 시 onSubmit에서 POST /api/complains (multipart/form-data)
 *   - formData 필드 + images 파일 배열 전송
 */
const ComplainForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ title: "", category: "", location: "", content: "" });
  const [showCategory, setShowCategory] = useState(false);
  const { images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (!formData.category) { alert("구분을 선택해주세요."); return; }
    onSubmit?.({ ...formData, date: dateStr, images });
    setFormData({ title: "", category: "", location: "", content: "" });
    resetImages();
    onClose();
  };

  const handleClose = () => {
    setFormData({ title: "", category: "", location: "", content: "" });
    resetImages();
    setShowCategory(false);
    onClose();
  };

  return (
    <FormPopup isOpen={isOpen} onClose={handleClose} title="접수" onSubmit={handleSubmit}>
      <div className="form-field">
        <input type="text" className="form-input" placeholder="제목" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} />
      </div>

      <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
        <span className={formData.category ? "form-field-value" : "form-field-placeholder"}>
          {formData.category || "구분"}
        </span>
        <ChevronRight size={20} className="form-field-arrow" />
        {showCategory && (
          <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`form-dropdown-item ${formData.category === cat ? "active" : ""}`} onClick={() => { handleChange("category", cat); setShowCategory(false); }}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-field form-field-readonly">
        <span className="form-field-value">{dateStr}</span>
      </div>

      <div className="form-field">
        <input type="text" className="form-input" placeholder="장소" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
      </div>

      <div className="form-field">
        <textarea className="form-textarea" placeholder="접수 내용을 입력하세요" value={formData.content} onChange={(e) => handleChange("content", e.target.value)} />
      </div>

      <div className="form-images">
        <div className="form-image-upload" onClick={() => fileInputRef.current?.click()}>
          <Camera size={32} color="#63C3D1" />
          <span className="form-image-count">{images.length} / 10</span>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageAdd} />
        </div>
        {images.map((img, i) => (
          <div key={i} className="form-image-preview">
            <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
            <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
          </div>
        ))}
      </div>

      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </FormPopup>
  );
};

export default ComplainForm;
