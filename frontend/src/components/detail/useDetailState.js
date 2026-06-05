import { useState, useMemo } from "react";
import useCategories from "../../hooks/useCategories";
import useComplainDetail from "../../hooks/useComplainDetail";
import useEditRequest from "../../hooks/useEditRequest";
import useImageUpload from "../../hooks/useImageUpload";
import { updateComplaint, deleteComplaint, updateComplaintState, createProcess, uploadProcessImages, deleteComplainImage } from "../../services/complainService";
import { getMemberProfile } from "../../services/memberService";
import { STATUS_LABEL_TO_CODE } from "../../constants/status";

/**
 * Detail 컴포넌트의 모든 상태와 핸들러를 관리하는 커스텀 훅
 */
const useDetailState = ({ isOpen, data, onUpdate, onClose }) => {
  const { categories } = useCategories();
  const { detail: apiDetail, refetch } = useComplainDetail(isOpen && data?.id ? data.id : null);
  const detailData = apiDetail || data;

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const isEditor = user?.role !== "처리자";

  // 수정 요청 훅
  const { editRequest, approving, approve, refetch: refetchEditRequest } = useEditRequest(isOpen && data?.id ? data.id : null);

  // 탭 / 메뉴
  const [activeTab, setActiveTab] = useState("content");
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 수정 요청 모달
  const [editRequestModalOpen, setEditRequestModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // 수정 모드
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showCategory, setShowCategory] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const { images: editImages, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  // 프로필 팝업
  const [showProfile, setShowProfile] = useState(false);
  const [showReporterProfile, setShowReporterProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [reporterProfileData, setReporterProfileData] = useState(null);

  // 확인 팝업
  const [showNoResultPopup, setShowNoResultPopup] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddFolderSuccess, setShowAddFolderSuccess] = useState(false);
  const [showAlreadyMine, setShowAlreadyMine] = useState(false);
  const [showHasOtherPerson, setShowHasOtherPerson] = useState(false);

  // 상태 변경
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  // 처리 내용
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [processContent, setProcessContent] = useState("");
  const [showProcessSuccess, setShowProcessSuccess] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  // --- displayData 계산 ---
  const displayData = data ? {
    ...data,
    ...detailData,
    ...(detailData?.process ? {
      result: detailData.process.result,
      resultPerson: detailData.process.resultPerson,
      resultPersonId: detailData.process.process_by,
      resultDate: detailData.process.resultDate,
    } : {}),
  } : null;

  // --- 이미지 경로 ---
  const getImagePath = (name) => {
    if (!name) return null;
    if (name.startsWith('/uploads/') || name.startsWith('http')) return name;
    return `/uploads/complain/${name}`;
  };

  const imagePath = data?.image && !imageError ? getImagePath(data.image) : null;

  // --- 수정 모드 핸들러 ---
  const handleEdit = () => {
    const source = detailData || data;
    setEditData({ title: source.title || "", category: source.category || "", location: source.location || "", content: source.content || "" });
    setExistingImages(detailData?.images || []);
    resetImages();
    setEditMode(true);
    setMenuOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!editData.title.trim()) { alert("제목을 입력해주세요."); return; }
    try {
      const cat = categories.find((c) => c.category_name === editData.category);
      await updateComplaint(data.id, {
        category_id: cat?.category_id || data.category_id,
        title: editData.title,
        content: editData.content,
        location: editData.location,
      });
      if (editImages.length > 0) {
        const { uploadComplainImages } = await import("../../services/complainService");
        await uploadComplainImages(data.id, editImages.map((img) => img.file));
      }
      setEditMode(false);
      await refetch();
      setShowEditSuccess(true);
    } catch (err) {
      alert(err.message || "수정 중 오류가 발생했습니다.");
    }
  };

  // --- 상태 변경 핸들러 ---
  const handleStatusNext = async () => {
    setShowStatusChange(false);
    if (selectedStatus === "완료") {
      setProcessContent("");
      setShowProcessForm(true);
    } else {
      try {
        const stateCode = STATUS_LABEL_TO_CODE[selectedStatus] || selectedStatus;
        await updateComplaintState(data.id, stateCode);
        await refetch();
        onUpdate?.({ ...data, status: selectedStatus });
        alert("상태가 변경되었습니다.");
      } catch (err) {
        alert(err.message || "상태 변경 중 오류가 발생했습니다.");
      }
    }
    setSelectedStatus("");
  };

  // --- 처리 제출 핸들러 ---
  const handleProcessSubmit = async (processImages) => {
    setShowProcessForm(false);
    setProcessLoading(true);
    try {
      const result = await createProcess(data.id, processContent);
      if (processImages?.length > 0 && result.process?.process_id) {
        const files = processImages.map((img) => img.file).filter(Boolean);
        if (files.length > 0) {
          await uploadProcessImages(result.process.process_id, files);
        }
      }
      await refetch();
      onUpdate?.({ ...data, status: "완료", result: processContent, resultPerson: user?.name, resultPersonId: user?.member_id, resultDate: new Date() });
      setProcessLoading(false);
      alert("처리가 완료되었습니다.");
      setActiveTab("result");
    } catch (err) {
      setProcessLoading(false);
      alert(err.message || "처리 등록 중 오류가 발생했습니다.");
    }
  };

  // --- 삭제 핸들러 ---
  const handleDelete = async () => {
    try {
      await deleteComplaint(data.id);
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (err) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
      setShowDeleteConfirm(false);
    }
  };

  // --- 접수 핸들러 ---
  const handleAccept = async () => {
    try {
      await updateComplaintState(data.id, 'A');
      await refetch();
      onUpdate?.({ ...data, resultPersonId: user?.member_id, resultPerson: user?.name, status: "접수" });
      alert("접수가 완료되었습니다.\n내 처리함에서 확인하세요.");
      setActiveTab("result");
    } catch (err) {
      alert(err.message || "접수 처리 중 오류가 발생했습니다.");
    }
  };

  // --- 진행 핸들러 ---
  const handleProgress = async () => {
    try {
      await updateComplaintState(data.id, 'P');
      await refetch();
      onUpdate?.({ ...data, status: "진행중", resultDate: new Date() });
      alert("진행중으로 변경되었습니다.");
    } catch (err) {
      alert(err.message || "상태 변경 중 오류가 발생했습니다.");
    }
  };

  // --- 프로필 조회 핸들러 ---
  const handleShowProcessorProfile = async () => {
    const personId = detailData?.process?.process_by || displayData?.resultPersonId;
    if (personId) {
      try {
        const res = await getMemberProfile(personId);
        if (res.profile) {
          setProfileData(res.profile);
          setShowProfile(true);
          return;
        }
      } catch {}
    }
    setProfileData({
      name: displayData?.resultPerson || "-",
      dept: detailData?.process?.resultDept || null,
      phone: detailData?.process?.resultPhone || null,
    });
    setShowProfile(true);
  };

  const handleShowReporterProfile = async () => {
    if (displayData?.complain_by) {
      try {
        const res = await getMemberProfile(displayData.complain_by);
        setReporterProfileData(res.profile);
        setShowReporterProfile(true);
        return;
      } catch {}
    }
    setReporterProfileData({ name: displayData?.memberName || "-" });
    setShowReporterProfile(true);
  };

  // --- 수정 요청 승인 핸들러 ---
  const handleApproveEditRequest = async () => {
    if (editRequest?.reasonType === '처리 담당자 변경' || editRequest?.reasonType === '기타') {
      setShowEditForm(true);
    } else {
      try {
        await approve();
        await refetch();
        refetchEditRequest();
        alert("수정 요청이 승인되었습니다.");
      } catch {}
    }
  };

  // --- 기존 이미지 삭제 ---
  const handleDeleteExistingImage = async (imgId) => {
    try {
      await deleteComplainImage(imgId);
      setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
    } catch (err) {
      alert(err.message || "이미지 삭제 실패");
    }
  };

  // canAccept: API에서 내려온 값 (담당 부서 일치 여부)
  // apiDetail 로드 완료 시 API 값 사용, 미로드 시 로컬에서 판단
  const canAccept = (() => {
    if (apiDetail && 'canAccept' in apiDetail) return apiDetail.canAccept;
    if (data && 'canAccept' in data) return data.canAccept;
    // API 미로드 & data에도 없을 때: 처리자면 로컬에서 카테고리 담당 부서 비교
    if (!isEditor && user?.dept) {
      // detailData.dept = 카테고리 담당 부서 (cc.dept)
      const categoryDept = detailData?.dept || displayData?.dept;
      if (categoryDept) {
        return user.dept === '전체' || user.dept === categoryDept;
      }
    }
    return !isEditor; // 처리자면 기본 true (자기 목록에서 접근한 경우)
  })();

  return {
    // 데이터
    categories, detailData, user, isEditor, displayData, imagePath, canAccept,
    editRequest, approving, refetch, refetchEditRequest,

    // 탭 / 메뉴
    activeTab, setActiveTab, imageError, setImageError, menuOpen, setMenuOpen,

    // 수정 모드
    editMode, setEditMode, editData, setEditData, showCategory, setShowCategory,
    existingImages, editImages, fileInputRef, previewImage, setPreviewImage,
    handleImageAdd, handleImageRemove,

    // 수정 요청
    editRequestModalOpen, setEditRequestModalOpen,
    rejectionModalOpen, setRejectionModalOpen,
    showEditForm, setShowEditForm,

    // 프로필
    showProfile, setShowProfile, profileData, setProfileData,
    showReporterProfile, setShowReporterProfile, reporterProfileData, setReporterProfileData,

    // 확인 팝업
    showNoResultPopup, setShowNoResultPopup,
    showEditSuccess, setShowEditSuccess,
    showDeleteConfirm, setShowDeleteConfirm,
    showDeleteSuccess, setShowDeleteSuccess,
    showAddFolder, setShowAddFolder,
    showAddFolderSuccess, setShowAddFolderSuccess,
    showAlreadyMine, setShowAlreadyMine,
    showHasOtherPerson, setShowHasOtherPerson,

    // 상태 변경
    showStatusChange, setShowStatusChange, selectedStatus, setSelectedStatus,

    // 처리 내용
    showProcessForm, setShowProcessForm, processContent, setProcessContent,
    showProcessSuccess, setShowProcessSuccess, processLoading,

    // 핸들러
    handleEdit, handleEditSubmit, handleStatusNext, handleProcessSubmit,
    handleDelete, handleAccept, handleProgress,
    handleShowProcessorProfile, handleShowReporterProfile,
    handleApproveEditRequest, handleDeleteExistingImage,
  };
};

export default useDetailState;
