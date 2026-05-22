import "./detail.css";
import { ChevronRight, Camera } from "lucide-react";
import FormPopup from "../form/FormPopup";
import ProfilePopup from "./ProfilePopup";
import ImagePreview from "../common/ImagePreview";
import ProgressBar from "./ProgressBar";
import ConfirmPopup from "./ConfirmPopup";
import DetailContent from "./DetailContent";
import DetailResult from "./DetailResult";
import StatusChangePopup from "./StatusChangePopup";
import ProcessForm from "./ProcessForm";
import LoadingPopup from "../common/LoadingPopup";
import { useState, useMemo } from "react";
import useCategories from "../../hooks/useCategories";
import useComplainDetail from "../../hooks/useComplainDetail";
import { updateComplaint, deleteComplaint, updateComplaintState, createProcess, uploadProcessImages, deleteComplainImage } from "../../services/complainService";
import { getMemberProfile } from "../../services/memberService";
import { formatDate } from "../../utils/formatDate";
import { STATUS_LABEL_TO_CODE } from "../../constants/status";
import useImageUpload from "../../hooks/useImageUpload";

/**
 * 민원 상세 팝업 (읽기 + 수정 모드)
 */
const Detail = ({ isOpen, onClose, data, onUpdate, showProgress = false, fromStorage = false }) => {
  const { categories } = useCategories();
  const { detail: apiDetail, refetch } = useComplainDetail(isOpen && data?.id ? data.id : null);
  const detailData = apiDetail || data;
  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const isEditor = user?.role !== "처리자";

  const [activeTab, setActiveTab] = useState("content");
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // 확인 팝업들
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
  const [showStatusSuccess, setShowStatusSuccess] = useState(false);

  // 처리 내용 작성
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [processContent, setProcessContent] = useState("");
  const [showProcessSuccess, setShowProcessSuccess] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);

  if (!isOpen || !data) return null;

  // API에서 가져온 상세 데이터 또는 목록에서 전달받은 데이터 사용
  const displayData = {
    ...data,
    ...detailData,
    ...(detailData?.process ? {
      result: detailData.process.result,
      resultPerson: detailData.process.resultPerson,
      resultPersonId: detailData.process.process_by,
      resultDate: detailData.process.resultDate,
    } : {}),
  };

  const getImagePath = (name) => {
    if (!name) return null;
    try { return require(`../../assets/images/complain/${name}`); } catch { return null; }
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;

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
      // 새 이미지가 있으면 업로드
      if (editImages.length > 0) {
        const { uploadComplainImages } = await import("../../services/complainService");
        await uploadComplainImages(data.id, editImages.map((img) => img.file));
      }
      setEditMode(false);
      await refetch();
      onUpdate?.({ ...data, ...editData, category: editData.category });
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

  // --- 수정 모드 렌더링 ---
  if (editMode) {
    return (
      <FormPopup isOpen={true} onClose={() => {
        const hasChanges = editData.title.trim() || editData.category || editData.location.trim() || editData.content.trim() || editImages.length > 0;
        if (hasChanges) {
          if (!window.confirm("작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?")) return;
        }
        setEditMode(false); setShowCategory(false);
      }} submitLabel="수정" onSubmit={handleEditSubmit}>
        <div className="detail-tabs">
          <button className="detail-tab active">민원 내용</button>
          <button className="detail-tab" disabled>처리 내용</button>
        </div>
        <div className="form-field">
          <input type="text" className="form-input" placeholder="제목" value={editData.title} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="form-field form-field-select" onClick={() => setShowCategory(!showCategory)}>
          <span className={editData.category ? "form-field-value" : "form-field-placeholder"}>{editData.category || "구분"}</span>
          <ChevronRight size={20} className="form-field-arrow" />
          {showCategory && (
            <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
              {categories.map((cat) => (
                <button key={cat.category_id} className={`form-dropdown-item ${editData.category === cat.category_name ? "active" : ""}`} onClick={() => { setEditData((p) => ({ ...p, category: cat.category_name })); setShowCategory(false); }}>{cat.category_name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="form-field form-field-readonly"><span className="form-field-value">{formatDate(data.date)}</span></div>
        <div className="form-field"><input type="text" className="form-input" placeholder="장소" value={editData.location} onChange={(e) => setEditData((p) => ({ ...p, location: e.target.value }))} /></div>
        <div className="form-field"><textarea className="form-textarea" placeholder="접수 내용을 입력하세요" value={editData.content} onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))} /></div>
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
              <button className="form-image-remove" onClick={async () => {
                try {
                  await deleteComplainImage(img.id);
                  setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
                } catch (err) {
                  alert(err.message || "이미지 삭제 실패");
                }
              }}>×</button>
            </div>
          ))}
        </div>
        <ImagePreview src={previewImage} alt="첨부 사진" onClose={() => setPreviewImage(null)} />
      </FormPopup>
    );
  }

  // --- 읽기 모드 렌더링 ---
  return (
    <FormPopup isOpen={true} onClose={onClose} hideSubmit>
      {showProgress && <ProgressBar status={data.status} />}

      <div className="detail-tabs">
        <button className={`detail-tab ${activeTab === "content" ? "active" : ""}`} onClick={() => setActiveTab("content")}>민원 내용</button>
        <button className={`detail-tab ${activeTab === "result" ? "active" : ""}`} onClick={() => {
          if (data.status === "접수전") { setShowNoResultPopup(true); } else { setActiveTab("result"); }
        }}>처리 내용</button>
      </div>

      {activeTab === "content" ? (
        <DetailContent
          data={displayData} imagePath={imagePath} menuOpen={menuOpen} setMenuOpen={setMenuOpen}
          setPreviewImage={setPreviewImage} setImageError={setImageError}
          apiImages={detailData?.images || []}
          setShowReporterProfile={async () => {
            if (displayData.complain_by) {
              try {
                const res = await getMemberProfile(displayData.complain_by);
                setReporterProfileData(res.profile);
                setShowReporterProfile(true);
                return;
              } catch {}
            }
            setReporterProfileData({ name: displayData.memberName || "-" });
            setShowReporterProfile(true);
          }} formatDate={formatDate}
          isEditor={isEditor} fromStorage={fromStorage} user={user}
          onStatusChange={() => setShowStatusChange(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onEdit={handleEdit}
          onAddFolder={() => setShowAddFolder(true)}
          onAlreadyMine={() => setShowAlreadyMine(true)}
          onHasOtherPerson={() => setShowHasOtherPerson(true)}
        />
      ) : (
        <DetailResult data={displayData} formatDate={formatDate} processImages={detailData?.processImages || []} setPreviewImage={setPreviewImage} onShowProfile={async () => {
          const personId = detailData?.process?.process_by || displayData.resultPersonId;
          if (personId) {
            try {
              const res = await getMemberProfile(personId);
              if (res.profile) {
                setProfileData(res.profile);
                setShowProfile(true);
                return;
              }
            } catch (err) {
              console.error('[Profile] API error:', err.status, err.message);
            }
          }
          // API 실패 시 process에서 가져온 정보로 fallback
          setProfileData({
            name: displayData.resultPerson || "-",
            dept: detailData?.process?.resultDept || null,
            phone: detailData?.process?.resultPhone || null,
          });
          setShowProfile(true);
        }} />
      )}

      {/* 처리자 + 접수전: 접수하기 버튼 */}
      {!isEditor && displayData.status === "접수전" && (
        <div className="detail-accept-area">
          <button className="detail-accept-btn" onClick={async () => {
            try {
              await updateComplaintState(data.id, 'A');
              await refetch();
              onUpdate?.({ ...data, resultPersonId: user?.member_id, resultPerson: user?.name, status: "접수" });
              alert("접수가 완료되었습니다. 내 처리함에서 확인하세요.");
              setActiveTab("result");
            } catch (err) {
              alert(err.message || "접수 처리 중 오류가 발생했습니다.");
            }
          }}>
            접수하기
          </button>
        </div>
      )}

      {/* 처리자 + 내 보관함 + 접수: 진행하기 버튼 */}
      {!isEditor && fromStorage && (displayData.status === "접수" || displayData.status === "접수중") && (
        <div className="detail-accept-area">
          <button className="detail-accept-btn detail-accept-btn--progress" onClick={async () => {
            try {
              await updateComplaintState(data.id, 'P');
              await refetch();
              onUpdate?.({ ...data, status: "진행중", resultDate: new Date() });
              alert("진행중으로 변경되었습니다.");
            } catch (err) {
              alert(err.message || "상태 변경 중 오류가 발생했습니다.");
            }
          }}>
            진행하기
          </button>
        </div>
      )}

      {/* 처리자 + 내 보관함 + 진행중: 처리 내용 작성 버튼 */}
      {!isEditor && fromStorage && displayData.status === "진행중" && (
        <div className="detail-accept-area">
          <button className="detail-accept-btn detail-accept-btn--complete" onClick={() => {
            setProcessContent("");
            setShowProcessForm(true);
          }}>
            처리 내용 작성
          </button>
        </div>
      )}

      {/* 프로필 팝업 */}
      <ProfilePopup isOpen={showProfile} onClose={() => { setShowProfile(false); setProfileData(null); }} name={profileData?.name} dept={profileData?.dept} phone={profileData?.phone} />
      <ProfilePopup isOpen={showReporterProfile} onClose={() => { setShowReporterProfile(false); setReporterProfileData(null); }} name={reporterProfileData?.name} dept={reporterProfileData?.dept} phone={reporterProfileData?.phone} />

      <ImagePreview src={previewImage} alt="민원 사진" onClose={() => setPreviewImage(null)} />

      {/* 수정 완료 */}
      <ConfirmPopup isOpen={showEditSuccess} message="수정이 완료되었습니다." onConfirm={() => { setShowEditSuccess(false); onUpdate?.({ ...data, ...editData, category: editData.category }); }} />

      {/* 삭제 확인/완료 */}
      <ConfirmPopup isOpen={showDeleteConfirm} message={isEditor ? <>삭제된 민원은 복구할 수 없습니다.<br />정말 삭제하시겠습니까?</> : "내 폴더에서 삭제하시겠습니까?"} cancelLabel="취소" onCancel={() => setShowDeleteConfirm(false)} confirmLabel="삭제" confirmType="delete" onConfirm={async () => {
        try {
          await deleteComplaint(data.id);
          setShowDeleteConfirm(false);
          setShowDeleteSuccess(true);
        } catch (err) {
          alert(err.message || "삭제 중 오류가 발생했습니다.");
          setShowDeleteConfirm(false);
        }
      }} />
      <ConfirmPopup isOpen={showDeleteSuccess} message="삭제가 완료되었습니다." onConfirm={() => { setShowDeleteSuccess(false); onUpdate?.({ ...data, _deleted: true }); onClose(); }} />

      {/* 내 폴더 추가 */}
      <ConfirmPopup isOpen={showAddFolder} message="내 처리함에 추가하시겠습니까?" cancelLabel="취소" onCancel={() => setShowAddFolder(false)} confirmLabel="추가" onConfirm={() => { setShowAddFolder(false); onUpdate?.({ ...data, resultPersonId: user?.id, resultPerson: user?.name, status: data.status === "접수전" ? "접수중" : data.status }); setShowAddFolderSuccess(true); }} />
      <ConfirmPopup isOpen={showAddFolderSuccess} message="내 처리함에 추가되었습니다." onConfirm={() => setShowAddFolderSuccess(false)} />

      {/* 이미 내 민원 / 다른 담당자 */}
      <ConfirmPopup isOpen={showAlreadyMine} message={<>{data.resultPerson || user?.name} 님이 담당자입니다.<br />내 폴더에서 확인 바랍니다.</>} onConfirm={() => setShowAlreadyMine(false)} />
      <ConfirmPopup isOpen={showHasOtherPerson} message={<>이미 담당자({data.resultPerson})가 배정되어 있어<br />내 폴더에 추가할 수 없습니다.</>} onConfirm={() => setShowHasOtherPerson(false)} />

      {/* 상태 변경 */}
      <StatusChangePopup isOpen={showStatusChange} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onCancel={() => { setShowStatusChange(false); setSelectedStatus(""); }} onNext={handleStatusNext} />
      <ConfirmPopup isOpen={showStatusSuccess} message="민원 진행 상태가 변경되었습니다." onConfirm={() => setShowStatusSuccess(false)} />

      {/* 처리 내용 작성 */}
      <ProcessForm isOpen={showProcessForm} content={processContent} setContent={setProcessContent} onCancel={() => setShowProcessForm(false)} onSubmit={handleProcessSubmit} />
      <ConfirmPopup isOpen={showProcessSuccess} message="처리가 완료되었습니다." onConfirm={() => setShowProcessSuccess(false)} />
      <LoadingPopup isOpen={processLoading} message="처리 등록 중입니다..." />

      {/* 접수전 - 담당자 미배정 */}
      <ConfirmPopup isOpen={showNoResultPopup} message="담당자가 아직 배정되지 않았습니다." onConfirm={() => setShowNoResultPopup(false)} />
    </FormPopup>
  );
};

export default Detail;
