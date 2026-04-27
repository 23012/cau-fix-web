import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import FormPopup from "../form/FormPopup";

const NOTICE_CATEGORIES = ["공지", "업데이트", "점검"];

const NoticeForm = ({ isOpen, onClose, onSubmit, editData }) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [showCategory, setShowCategory] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        title: editData.title || "",
        category: editData.category || "",
        content: editData.content || "",
      });
    } else if (!isOpen) {
      setFormData({ title: "", category: "", content: "" });
    }
  }, [isOpen, editData]);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!formData.category) {
      alert("카테고리를 선택해주세요.");
      return;
    }
    if (!formData.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    onSubmit?.({ ...formData, date: dateStr, ...(editData ? { id: editData.id } : {}) });
    setFormData({ title: "", category: "", content: "" });
    onClose();
  };

  const handleClose = () => {
    setFormData({ title: "", category: "", content: "" });
    setShowCategory(false);
    onClose();
  };

  return (
    <FormPopup isOpen={isOpen} onClose={handleClose} title={isEdit ? "공지사항 수정" : "공지사항 작성"} onSubmit={handleSubmit} submitLabel={isEdit ? "수정" : "등록"}>
      <div className="form-field">
        <input
          type="text"
          className="form-input"
          placeholder="제목"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>

      <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
        <span className={formData.category ? "form-field-value" : "form-field-placeholder"}>
          {formData.category || "카테고리"}
        </span>
        <ChevronRight size={20} className="form-field-arrow" />
        {showCategory && (
          <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
            {NOTICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`form-dropdown-item ${formData.category === cat ? "active" : ""}`}
                onClick={() => {
                  handleChange("category", cat);
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
        <span className="form-field-value">{dateStr}</span>
      </div>

      <div className="form-field">
        <textarea
          className="form-textarea"
          placeholder="내용을 입력하세요"
          value={formData.content}
          onChange={(e) => handleChange("content", e.target.value)}
          style={{ minHeight: "350px" }}
        />
      </div>
    </FormPopup>
  );
};

export default NoticeForm;
