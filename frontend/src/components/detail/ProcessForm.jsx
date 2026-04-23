import { useRef } from "react";
import { Camera } from "lucide-react";
import ImagePreview from "../common/ImagePreview";

const ProcessForm = ({ isOpen, content, setContent, images, setImages, previewImage, setPreviewImage, onCancel, onSubmit }) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      alert("사진은 최대 10장까지 첨부할 수 있습니다.");
      return;
    }
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleImageRemove = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="detail-confirm-overlay" onClick={onCancel}>
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={handleImageAdd}
            />
          </div>
          {images.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
        </div>
        <div className="detail-confirm-actions">
          <button className="detail-confirm-btn cancel" onClick={onCancel}>
            취소
          </button>
          <button
            className="detail-confirm-btn"
            disabled={!content.trim()}
            onClick={onSubmit}
          >
            완료
          </button>
        </div>
      </div>

      <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
    </div>
  );
};

export default ProcessForm;
