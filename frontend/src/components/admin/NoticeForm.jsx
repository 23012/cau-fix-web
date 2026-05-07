import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import FormPopup from "../form/FormPopup";
import { NOTICE_CATEGORIES } from "../../constants/noticeCategories";

const NoticeForm = ({ isOpen, onClose, onSubmit, editData }) => {
  const [formData, setFormData] = useState({ title: "", category: "" });
  const [showCategory, setShowCategory] = useState(false);
  const contentRef = useRef(null);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({ title: editData.title || "", category: editData.category || "" });
      if (contentRef.current) {
        contentRef.current.innerHTML = editData.content || "";
      }
    } else if (!isOpen) {
      setFormData({ title: "", category: "" });
      if (contentRef.current) {
        contentRef.current.innerHTML = "";
      }
    }
  }, [isOpen, editData]);

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 클립보드 붙여넣기 - 이미지를 base64로 변환해서 커서 위치에 삽입
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const img = document.createElement("img");
          img.src = reader.result;
          img.style.maxWidth = "100%";
          img.style.borderRadius = "8px";
          img.style.margin = "8px 0";

          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            // 커서를 이미지 뒤로 이동
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            contentRef.current?.appendChild(img);
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, []);

  const handleSubmit = () => {
    if (!formData.title.trim()) { alert("제목을 입력해주세요."); return; }
    if (!formData.category) { alert("카테고리를 선택해주세요."); return; }
    const content = contentRef.current?.innerHTML || "";
    if (!content.trim() || content === "<br>") { alert("내용을 입력해주세요."); return; }
    onSubmit?.({ ...formData, content, date: dateStr, ...(editData ? { id: editData.id } : {}) });
    setFormData({ title: "", category: "" });
    if (contentRef.current) contentRef.current.innerHTML = "";
    onClose();
  };

  const handleClose = () => {
    setFormData({ title: "", category: "" });
    if (contentRef.current) contentRef.current.innerHTML = "";
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

      <div className="form-field">
        <div
          ref={contentRef}
          className="form-textarea notice-form-textarea"
          contentEditable
          onPaste={handlePaste}
          data-placeholder="내용을 입력하세요 (이미지는 Ctrl+V로 붙여넣기)"
          style={{ minHeight: "200px", whiteSpace: "pre-wrap", overflowY: "auto" }}
        />
      </div>
    </FormPopup>
  );
};

export default NoticeForm;
