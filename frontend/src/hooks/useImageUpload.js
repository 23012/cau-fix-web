import { useState, useRef } from "react";

const MAX_IMAGES = 10;

/**
 * 이미지 첨부 공통 훅 (민원 접수, 수정, 처리 내용 작성에서 공통 사용)
 * @param {number} maxCount - 최대 이미지 수 (기본 10)
 * @returns {{ images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages }}
 */
const useImageUpload = (maxCount = MAX_IMAGES) => {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > maxCount) {
      alert(`사진은 최대 ${maxCount}장까지 첨부할 수 있습니다.`);
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

  const resetImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  return {
    images,
    setImages,
    fileInputRef,
    previewImage,
    setPreviewImage,
    handleImageAdd,
    handleImageRemove,
    resetImages,
  };
};

export default useImageUpload;
