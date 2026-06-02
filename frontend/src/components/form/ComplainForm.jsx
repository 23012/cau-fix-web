import { useState, useMemo } from "react";
import { ChevronRight, Camera } from "lucide-react";
import FormPopup from "./FormPopup";
import ImagePreview from "../common/ImagePreview";
import LoadingPopup from "../common/LoadingPopup";
import useCategories from "../../hooks/useCategories";
import useImageUpload from "../../hooks/useImageUpload";

const ComplainForm = ({ isOpen, onClose, onSubmit }) => {
  const { categories } = useCategories();
  const [formData, setFormData] = useState({ title: "", category: "", location: "", content: "" });
  const [showCategory, setShowCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const { images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  const dateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  //민원 제출
  const handleSubmit = async () => {
    if (!formData.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (!formData.category) { alert("구분을 선택해주세요."); return; }
    if (!formData.location.trim()) { alert("장소를 입력해주세요."); return; }
    if (!formData.content.trim()) { alert("접수 내용을 입력해주세요."); return; }
    setLoading(true);
    try {
      await onSubmit?.({ ...formData, date: dateStr, images });
      setFormData({ title: "", category: "", location: "", content: "" });
      resetImages();
      onClose();
    } catch (err) {
      // onSubmit에서 에러 발생 시 폼을 닫지 않음
    } finally {
      setLoading(false);
    }
  };

  //팝업창 나가기
  const handleClose = () => {
    const hasContent = formData.title.trim() || formData.category || formData.location.trim() || formData.content.trim() || images.length > 0;
    if (hasContent) {
      if (!window.confirm("작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?")) return;
    }
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
            {categories.map((cat) => (
              <button key={cat.category_id} className={`form-dropdown-item ${formData.category === cat.category_name ? "active" : ""}`} onClick={() => { handleChange("category", cat.category_name); setShowCategory(false); }}>
                {cat.category_name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/*민원 입력 창*/}
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
      <LoadingPopup isOpen={loading} message="민원 등록 중입니다..." />
    </FormPopup>
  );
};

export default ComplainForm;
