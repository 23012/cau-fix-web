import { Camera } from "lucide-react";
import ImagePreview from "../common/ImagePreview";
import useImageUpload from "../../hooks/useImageUpload";
import { useEffect } from "react";

/**
 * 처리 내용 작성 폼 (처리자가 민원 완료 시 사용)
 * TODO: 백엔드 연결 시 onSubmit에서 POST /api/complains/{id}/process (multipart/form-data)
 */
const ProcessForm = ({ isOpen, content, setContent, onCancel, onSubmit }) => {
  const { images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  /* 닫힐 때 이미지 초기화 */
  useEffect(() => {
    if (!isOpen) resetImages();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleCancel = () => {
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
            <span className="form-image-count">{images.length} / 10</span>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={handleImageAdd} />
          </div>
          {images.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
        </div>
        <div className="detail-confirm-actions">
          <button className="detail-confirm-btn cancel" onClick={handleCancel}>취소</button>
          <button className="detail-confirm-btn" disabled={!content.trim()} onClick={() => onSubmit(images)}>완료</button>
        </div>
      </div>
      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </div>
  );
};

export default ProcessForm;
