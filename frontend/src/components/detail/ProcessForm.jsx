import { Camera } from "lucide-react";
import ImagePreview from "../common/ImagePreview";
import useImageUpload from "../../hooks/useImageUpload";
import { useEffect } from "react";

/**
 * 처리 내용 작성 폼 (처리자가 민원 완료 시 사용)
 */
const ProcessForm = ({ isOpen, content, setContent, onCancel, onSubmit, onSave, existingImages = [], onDeleteExisting }) => {
  const { images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  /* 닫힐 때 이미지 초기화 */
  useEffect(() => {
    if (!isOpen) resetImages();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleCancel = () => {
    const hasContent = content.trim() || images.length > 0;
    if (hasContent) {
      if (!window.confirm("작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?")) return;
    }
    resetImages();
    onCancel();
  };

  return (
    <div className="detail-confirm-overlay" onClick={handleCancel}>
      <div className="detail-confirm-popup detail-process-popup" onClick={(e) => e.stopPropagation()}>
        <p>처리 내용</p>
        <textarea
          className="detail-process-textarea"
          placeholder="처리 내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="form-images">
          <div className="form-image-upload" onClick={() => fileInputRef.current?.click()}>
            <Camera size={28} color="#63C3D1" />
            <span className="form-image-count">{images.length + existingImages.length} / 10</span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageAdd} />
          </div>
          {/* 기존 업로드된 처리 이미지 (X로 삭제) */}
          {existingImages.map((img) => (
            <div key={img.id} className="form-image-preview">
              <img src={img.url} alt="기존 처리 사진" onClick={() => setPreviewImage(img.url)} />
              <button className="form-image-remove" onClick={() => onDeleteExisting?.(img.id)}>×</button>
            </div>
          ))}
          {/* 새로 추가한 이미지 */}
          {images.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
        </div>
        <div className="detail-confirm-actions">
          <button className="detail-confirm-btn cancel" onClick={handleCancel}>취소</button>
          <button className="detail-confirm-btn" disabled={!content.trim()} onClick={() => (onSave || onSubmit)(images)}>저장</button>
        </div>
      </div>
      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </div>
  );
};

export default ProcessForm;
