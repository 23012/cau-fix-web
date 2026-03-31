import { X } from 'lucide-react';
import './ImagePreview.css';

const ImagePreview = ({ src, alt, onClose }) => {
  if (!src) return null;

  return (
    <div className="image-preview-overlay" onClick={onClose}>
      <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
        <button className="image-preview-close" onClick={onClose}>
          <X size={22} color="#fff" />
        </button>
        <img src={src} alt={alt || "미리보기"} className="image-preview-img" />
      </div>
    </div>
  );
};

export default ImagePreview;
