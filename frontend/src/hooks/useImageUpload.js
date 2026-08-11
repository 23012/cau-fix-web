import { useState, useRef } from "react";

const MAX_IMAGES = 10;

// 업로드 전 리사이즈 기준: 긴 변 최대 픽셀 / JPEG 품질
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

// 서버(백엔드 multer fileFilter)가 허용하는 이미지 형식
const SERVER_ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
// 리사이즈(재인코딩) 실패 시: 서버가 받는 형식이면 원본 그대로, 아니면 null(거부)
const fallbackOrReject = (file) => (SERVER_ALLOWED.includes(file.type) ? file : null);

/**
 * 업로드 전에 이미지를 canvas로 리사이즈 + JPEG 재인코딩한다.
 * - 아이폰 고화질/ProRAW 사진(수십 MB)이 서버 한도를 넘어 업로드가 실패하던 문제 해결
 * - iOS Safari의 HTTP/2 multipart 업로드가 깨지던 문제를, 작고 깨끗한 JPEG blob으로 우회
 * - HEIC → JPEG 변환(iOS Safari는 canvas로 HEIC 디코드 가능)
 *
 * 디코드 실패(예: 크롬에서 HEIC)이고 서버 허용 형식도 아니면 null을 반환해 첨부에서 제외한다.
 * (원본을 그대로 넘기면 미리보기가 깨지고 서버가 415로 거부하므로 걸러낸다.)
 */
const resizeImageFile = (file) =>
  new Promise((resolve) => {
    if (!file.type || !file.type.startsWith("image/")) {
      resolve(null);
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
        resolve(fallbackOrReject(file));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(fallbackOrReject(file));
            return;
          }
          const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
          try {
            resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
          } catch (e) {
            resolve(blob); // 구형 브라우저: File 생성자 미지원 → JPEG Blob 그대로
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // 디코드 실패(예: 크롬에서 HEIC): 서버 허용 형식이면 원본, 아니면 거부
      resolve(fallbackOrReject(file));
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
    const newImages = (
      await Promise.all(
        files.map(async (file) => {
          const processed = await resizeImageFile(file);
          if (!processed) return null; // 지원하지 않는 형식 → 제외
          return {
            id: Date.now() + Math.random(),
            file: processed,
            preview: URL.createObjectURL(processed),
          };
        })
      )
    ).filter(Boolean);
    if (newImages.length < files.length) {
      alert("지원하지 않는 형식의 이미지는 제외됐습니다.\n(jpg, png, gif, webp 형식을 사용해 주세요)");
    }
    if (newImages.length > 0) setImages((prev) => [...prev, ...newImages]);
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
