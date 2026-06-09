import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import DOMPurify from "dompurify";
import FormPopup from "../form/FormPopup";
import { NOTICE_CATEGORIES } from "../../constants/noticeCategories";

// 검증된 라이브러리(DOMPurify) 기반 살균 — 정규식 방식은 우회 가능하여 교체
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "br", "div", "span", "b", "strong", "i", "em", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "blockquote",
    "pre", "code", "img",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "style"],
};

const sanitizeHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
};

const NoticeForm = ({ isOpen, onClose, onSubmit, editData }) => {
  const [formData, setFormData] = useState({ title: "", category: "" });
  const [showCategory, setShowCategory] = useState(false);
  const contentRef = useRef(null);
  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen && editData) {
      setFormData({ title: editData.title || "", category: editData.category || "" });
      if (contentRef.current) {
        contentRef.current.innerHTML = sanitizeHtml(editData.content || "");
      }
    } else if (!isOpen) {
      setFormData({ title: "", category: "" });
      if (contentRef.current) {
        contentRef.current.innerHTML = "";
      }
    }
  }, [isOpen, editData]);

  const dateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [isOpen]);

  const handleChange = (field, value) => {
    if (field === "title" && value.length > 50) {
      alert("50자 이내로 입력해주세요.");
      return;
    }
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
    const rawContent = contentRef.current?.innerHTML || "";
    const content = sanitizeHtml(rawContent);
    if (!content.trim() || content === "<br>") { alert("내용을 입력해주세요."); return; }
    onSubmit?.({ ...formData, content, date: dateStr, ...(editData ? { id: editData.id } : {}) });
  };

  const handleClose = () => {
    const contentHtml = contentRef.current?.innerHTML || "";
    const hasContent = formData.title.trim() || formData.category || (contentHtml.trim() && contentHtml !== "<br>");
    if (hasContent) {
      if (!window.confirm("작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?")) return;
    }
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
        />
      </div>
    </FormPopup>
  );
};

export default NoticeForm;
