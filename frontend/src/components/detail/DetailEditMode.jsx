import { ChevronRight, Camera } from "lucide-react";
import FormPopup from "../form/FormPopup";
import ImagePreview from "../common/ImagePreview";
import { formatDate } from "../../utils/formatDate";

/**
 * 민원 수정 모드 폼 컴포넌트
 */
const DetailEditMode = ({
  data,
  editData,
  setEditData,
  categories,
  showCategory,
  setShowCategory,
  existingImages,
  editImages,
  fileInputRef,
  previewImage,
  setPreviewImage,
  handleImageAdd,
  handleImageRemove,
  handleDeleteExistingImage,
  onClose,
  onSubmit,
}) => {
  return (
    <FormPopup
      isOpen={true}
      onClose={() => {
        const hasChanges = editData.title.trim() || editData.category || editData.location.trim() || editData.content.trim() || editImages.length > 0;
        if (hasChanges) {
          if (!window.confirm("작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?")) return;
        }
        onClose();
      }}
      submitLabel="수정"
      onSubmit={onSubmit}
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
          onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
        />
      </div>

      <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
        <span className={editData.category ? "form-field-value" : "form-field-placeholder"}>
          {editData.category || "구분"}
        </span>
        <ChevronRight size={20} className="form-field-arrow" />
        {showCategory && (
          <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                className={`form-dropdown-item ${editData.category === cat.category_name ? "active" : ""}`}
                onClick={() => { setEditData((p) => ({ ...p, category: cat.category_name })); setShowCategory(false); }}
              >
                {cat.category_name}
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
          onChange={(e) => setEditData((p) => ({ ...p, location: e.target.value }))}
        />
      </div>

      <div className="form-field">
        <textarea
          className="form-textarea"
          placeholder="접수 내용을 입력하세요"
          value={editData.content}
          onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))}
        />
      </div>

      <div className="form-images">
        <div className="form-image-upload" onClick={() => fileInputRef.current?.click()}>
          <Camera size={32} color="#63C3D1" />
          <span className="form-image-count">{editImages.length + existingImages.length} / 10</span>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageAdd} />
        </div>
        {editImages.map((img, i) => (
          <div key={i} className="form-image-preview">
            <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
            <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
          </div>
        ))}
        {existingImages.map((img) => (
          <div key={img.id} className="form-image-preview">
            <img src={img.url} alt="기존 사진" onClick={() => setPreviewImage(img.url)} />
            <button className="form-image-remove" onClick={() => handleDeleteExistingImage(img.id)}>×</button>
          </div>
        ))}
      </div>

      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </FormPopup>
  );
};

export default DetailEditMode;
