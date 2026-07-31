import { useState, useRef } from "react";

const MAX_IMAGES = 10;

// 업로드 전 리사이즈 기준: 긴 변 최대 픽셀 / JPEG 품질
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/**
 * 업로드 전에 이미지를 canvas로 리사이즈 + JPEG 재인코딩한다.
 * - 아이폰 고화질/ProRAW 사진(수십 MB)이 서버 한도를 넘어 업로드가 실패하던 문제 해결
 * - iOS Safari의 HTTP/2 multipart 업로드가 깨지던 문제를, 작고 깨끗한 JPEG blob으로 우회
 * - HEIC → JPEG 변환(iOS Safari는 canvas로 HEIC 디코드 가능)
 * - 큰 원본을 그대로 미리보기하던 데서 오던 일부 기기 화면 깜빡임 완화
 *
 * 디코드 실패(예: 안드로이드에서 HEIC 등) 시 원본 파일을 그대로 반환한다.
 */
const resizeImageFile = (file) =>
  new Promise((resolve) => {
    if (!file.type || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
          try {
            resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
          } catch (e) {
            // 구형 브라우저: File 생성자 미지원 → Blob 그대로(서버는 mimetype으로 처리)
            resolve(blob);
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // 디코드 실패 시 원본 유지
    };
    img.src = objectUrl;
  });

/**
 * 이미지 첨부 공통 훅 (민원 접수, 수정, 처리 내용 작성에서 공통 사용)
 * @param {number} maxCount - 최대 이미지 수 (기본 10)
 * @returns {{ images, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages }}
 */
const useImageUpload = (maxCount = MAX_IMAGES) => {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageAdd = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;
    if (images.length + files.length > maxCount) {
      alert(`사진은 최대 ${maxCount}장까지 첨부할 수 있습니다.`);
      return;
    }
    const newImages = await Promise.all(
      files.map(async (file) => {
        const processed = await resizeImageFile(file);
        return {
          id: Date.now() + Math.random(),
          file: processed,
          preview: URL.createObjectURL(processed),
        };
      })
    );
    setImages((prev) => [...prev, ...newImages]);
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
