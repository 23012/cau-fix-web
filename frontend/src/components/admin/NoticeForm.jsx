import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Camera } from "lucide-react";
import FormPopup from "../form/FormPopup";
import ImagePreview from "../common/ImagePreview";
import { NOTICE_CATEGORIES } from "../../constants/noticeCategories";

const NoticeForm = ({ isOpen, onClose, onSubmit, editData }) => {
  const [formData, setFormData] = useState({ title: "", category: "", content: "" });
  const [showCategory, setShowCategory] = useState(false);
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({ title: editData.title || "", category: editData.category || "", content: editData.content || "" });
    } else if (!isOpen) {
      setFormData({ title: "", category: "", content: "" });
      setImages([]);
    }
  }, [isOpen, editData]);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addImageFiles = useCallback((files) => {
    if (images.length + files.length > 10) {
      alert("사진은 최대 10장까지 첨부할 수 있습니다.");
      return;
    }
    const newImages = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const handleImageAdd = (e) => {
    addImageFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleImageRemove = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 클립보드 붙여넣기 (Ctrl+V)
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      addImageFiles(imageFiles);
    }
  }, [addImageFiles]);

  const handleSubmit = () => {
    if (!formData.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (!formData.category) { alert("카테고리를 선택해주세요."); return; }
    if (!formData.content.trim()) { alert("내용을 입력해주세요."); return; }
    onSubmit?.({ ...formData, date: dateStr, images, ...(editData ? { id: editData.id } : {}) });
    setFormData({ title: "", category: "", content: "" });
    setImages([]);
    onClose();
  };

  const handleClose = () => {
    setFormData({ title: "", category: "", content: "" });
    setImages([]);
    setShowCategory(false);
    onClose();
  };

  return (
    <FormPopup isOpen={isOpen} onClose={handleClose} title={isEdit ? "공지사항 수정" : "공지사항 작성"} onSubmit={handleSubmit} submitLabel={isEdit ? "수정" : "등록"}>
      <div className="form-field">
        <input type="text" className="form-input" placeholder="제목" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} />
      </div>

      <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
        <span className={formData.category ? "form-field-value" : "form-field-placeholder"}>
          {formData.category || "카테고리"}
        </span>
        <ChevronRight size={20} className="form-field-arrow" />
        {showCategory && (
          <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
            {NOTICE_CATEGORIES.map((cat) => (
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

      <div className="form-field" onPaste={handlePaste}>
        <textarea className="form-textarea" placeholder="내용을 입력하세요" value={formData.content} onChange={(e) => handleChange("content", e.target.value)} style={{ minHeight: "300px" }} />
      </div>

      {images.length > 0 && (
        <div className="form-images">
          {images.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
        </div>
      )}

      <p className="notice-form-hint">* 이미지 첨부 시 붙여넣기를 이용해주세요. (Ctrl+V)</p>

      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </FormPopup>
  );
};

export default NoticeForm;
