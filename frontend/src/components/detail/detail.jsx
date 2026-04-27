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
import { useState, useMemo } from "react";
import { CATEGORIES } from "../../constants/categories";
import { formatDate } from "../../utils/formatDate";
import useImageUpload from "../../hooks/useImageUpload";

/**
 * 민원 상세 팝업 (읽기 + 수정 모드)
 * TODO: 백엔드 연결 시
 *   - 수정: PUT /api/complains/{id} (editData + editImages)
 *   - 삭제: DELETE /api/complains/{id}
 *   - 상태 변경: PATCH /api/complains/{id}/status { status }
 *   - 처리 완료: POST /api/complains/{id}/process { content, images }
 *   - 내 폴더 추가: POST /api/complains/{id}/assign { userId }
 */
const Detail = ({ isOpen, onClose, data, onUpdate, showProgress = false, fromStorage = false }) => {
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
  const { images: editImages, fileInputRef, previewImage, setPreviewImage, handleImageAdd, handleImageRemove, resetImages } = useImageUpload();

  // 프로필 팝업
  const [showProfile, setShowProfile] = useState(false);
  const [showReporterProfile, setShowReporterProfile] = useState(false);

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

  if (!isOpen || !data) return null;

  const getImagePath = (name) => {
    if (!name) return null;
    try { return require(`../../assets/images/complain/${name}`); } catch { return null; }
  };

  const imagePath = data.image && !imageError ? getImagePath(data.image) : null;

  // --- 수정 모드 핸들러 ---
  const handleEdit = () => {
    setEditData({ title: data.title || "", category: data.category || "", location: data.location || "", content: data.content || "" });
    resetImages();
    setEditMode(true);
    setMenuOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editData.title.trim()) { alert("제목을 입력해주세요."); return; }
    setEditMode(false);
    setShowEditSuccess(true);
  };

  // --- 상태 변경 핸들러 ---
  const handleStatusNext = () => {
    setShowStatusChange(false);
    if (selectedStatus === "완료") {
      setProcessContent("");
      setShowProcessForm(true);
    } else {
      onUpdate?.({ ...data, status: selectedStatus });
      setShowStatusSuccess(true);
    }
    setSelectedStatus("");
  };

  const handleProcessSubmit = (processImages) => {
    setShowProcessForm(false);
    onUpdate?.({ ...data, status: "완료", result: processContent, resultDate: new Date(), processImages });
    setShowProcessSuccess(true);
  };

  // --- 수정 모드 렌더링 ---
  if (editMode) {
    return (
      <FormPopup isOpen={true} onClose={() => { setEditMode(false); setShowCategory(false); }} submitLabel="수정" onSubmit={handleEditSubmit}>
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
              {CATEGORIES.map((cat) => (
                <button key={cat} className={`form-dropdown-item ${editData.category === cat ? "active" : ""}`} onClick={() => { setEditData((p) => ({ ...p, category: cat })); setShowCategory(false); }}>{cat}</button>
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
            <span className="form-image-count">{editImages.length} / 10</span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageAdd} />
          </div>
          {editImages.map((img, i) => (
            <div key={i} className="form-image-preview">
              <img src={img.preview} alt={`첨부 ${i + 1}`} onClick={() => setPreviewImage(img.preview)} />
              <button className="form-image-remove" onClick={() => handleImageRemove(i)}>×</button>
            </div>
          ))}
          {imagePath && <div className="form-image-preview"><img src={imagePath} alt="기존 사진" onClick={() => setPreviewImage(imagePath)} /></div>}
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
          data={data} imagePath={imagePath} menuOpen={menuOpen} setMenuOpen={setMenuOpen}
          setPreviewImage={setPreviewImage} setImageError={setImageError}
          setShowReporterProfile={setShowReporterProfile} formatDate={formatDate}
          isEditor={isEditor} fromStorage={fromStorage} user={user}
          onStatusChange={() => setShowStatusChange(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onEdit={handleEdit}
          onAddFolder={() => setShowAddFolder(true)}
          onAlreadyMine={() => setShowAlreadyMine(true)}
          onHasOtherPerson={() => setShowHasOtherPerson(true)}
        />
      ) : (
        <DetailResult data={data} formatDate={formatDate} onShowProfile={() => setShowProfile(true)} />
      )}

      {/* 프로필 팝업 */}
      <ProfilePopup isOpen={showProfile} onClose={() => setShowProfile(false)} name={data.resultPerson} dept={data.resultDept} phone={data.resultPhone} />
      <ProfilePopup isOpen={showReporterProfile} onClose={() => setShowReporterProfile(false)} name={data.reporterName} dept={data.dept} phone={data.reporterPhone} />

      <ImagePreview src={previewImage} alt="민원 사진" onClose={() => setPreviewImage(null)} />

      {/* 수정 완료 */}
      <ConfirmPopup isOpen={showEditSuccess} message="수정이 완료되었습니다." onConfirm={() => { onUpdate?.({ ...data, ...editData, images: editImages }); setShowEditSuccess(false); }} />

      {/* 삭제 확인/완료 */}
      <ConfirmPopup isOpen={showDeleteConfirm} message={isEditor ? <>삭제된 민원은 복구할 수 없습니다.<br />정말 삭제하시겠습니까?</> : "내 폴더에서 삭제하시겠습니까?"} cancelLabel="취소" onCancel={() => setShowDeleteConfirm(false)} confirmLabel="삭제" confirmType="delete" onConfirm={() => { setShowDeleteConfirm(false); setShowDeleteSuccess(true); }} />
      <ConfirmPopup isOpen={showDeleteSuccess} message="삭제가 완료되었습니다." onConfirm={() => { setShowDeleteSuccess(false); onClose(); }} />

      {/* 내 폴더 추가 */}
      <ConfirmPopup isOpen={showAddFolder} message="내 폴더에 추가하시겠습니까?" cancelLabel="취소" onCancel={() => setShowAddFolder(false)} confirmLabel="추가" onConfirm={() => { setShowAddFolder(false); onUpdate?.({ ...data, resultPersonId: user?.id, resultPerson: user?.name, status: data.status === "접수전" ? "접수중" : data.status }); setShowAddFolderSuccess(true); }} />
      <ConfirmPopup isOpen={showAddFolderSuccess} message="내 폴더에 추가되었습니다." onConfirm={() => setShowAddFolderSuccess(false)} />

      {/* 이미 내 민원 / 다른 담당자 */}
      <ConfirmPopup isOpen={showAlreadyMine} message={<>{data.resultPerson || user?.name} 님이 담당자입니다.<br />내 폴더에서 확인 바랍니다.</>} onConfirm={() => setShowAlreadyMine(false)} />
      <ConfirmPopup isOpen={showHasOtherPerson} message={<>이미 담당자({data.resultPerson})가 배정되어 있어<br />내 폴더에 추가할 수 없습니다.</>} onConfirm={() => setShowHasOtherPerson(false)} />

      {/* 상태 변경 */}
      <StatusChangePopup isOpen={showStatusChange} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onCancel={() => { setShowStatusChange(false); setSelectedStatus(""); }} onNext={handleStatusNext} />
      <ConfirmPopup isOpen={showStatusSuccess} message="민원 진행 상태가 변경되었습니다." onConfirm={() => setShowStatusSuccess(false)} />

      {/* 처리 내용 작성 */}
      <ProcessForm isOpen={showProcessForm} content={processContent} setContent={setProcessContent} onCancel={() => setShowProcessForm(false)} onSubmit={handleProcessSubmit} />
      <ConfirmPopup isOpen={showProcessSuccess} message="처리가 완료되었습니다." onConfirm={() => setShowProcessSuccess(false)} />

      {/* 접수전 - 담당자 미배정 */}
      <ConfirmPopup isOpen={showNoResultPopup} message="관리자가 아직 배정되지 않았습니다." onConfirm={() => setShowNoResultPopup(false)} />
    </FormPopup>
  );
};

export default Detail;
