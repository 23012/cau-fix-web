import "./detail.css";
import FormPopup from "../form/FormPopup";
import ProgressBar from "./ProgressBar";
import DetailContent from "./DetailContent";
import DetailResult from "./DetailResult";
import EditRequestSection from "./EditRequestSection";
import DetailEditMode from "./DetailEditMode";
import DetailActionButtons from "./DetailActionButtons";
import DetailPopups from "./DetailPopups";
import useDetailState from "./useDetailState";
import { formatDate } from "../../utils/formatDate";
import { STATUS_CODE_TO_LABEL } from "../../constants/status";

/**
 * 민원 상세 팝업 (읽기 + 수정 모드)
 */
const Detail = ({ isOpen, onClose, data, onUpdate, showProgress = false, fromStorage = false, rejectionReason = null }) => {
  const state = useDetailState({ isOpen, data, onUpdate, onClose });

  if (!isOpen || !data) return null;

  // --- 수정 모드 ---
  if (state.editMode) {
    return (
      <DetailEditMode
        data={data}
        editData={state.editData}
        setEditData={state.setEditData}
        categories={state.categories}
        showCategory={state.showCategory}
        setShowCategory={state.setShowCategory}
        existingImages={state.existingImages}
        editImages={state.editImages}
        fileInputRef={state.fileInputRef}
        previewImage={state.previewImage}
        setPreviewImage={state.setPreviewImage}
        handleImageAdd={state.handleImageAdd}
        handleImageRemove={state.handleImageRemove}
        handleDeleteExistingImage={state.handleDeleteExistingImage}
        onClose={() => { state.setEditMode(false); state.setShowCategory(false); }}
        onSubmit={state.handleEditSubmit}
      />
    );
  }

  // --- 읽기 모드 ---
  return (
    <FormPopup isOpen={true} onClose={onClose} hideSubmit>
      {showProgress && (
        <ProgressBar status={state.editRequest?.prevState ? (STATUS_CODE_TO_LABEL[state.editRequest.prevState] || data.status) : data.status} />
      )}

      {/* 반려 사유 */}
      {rejectionReason && (
        <div className="detail-rejection-wrapper">
          <div className="edit-title">반려 사유</div>
          <div className="pcv-edit-request-reason">
            <span className="pcv-edit-request-reason-text">{rejectionReason}</span>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="detail-tabs">
        <button className={`detail-tab ${state.activeTab === "content" ? "active" : ""}`} onClick={() => state.setActiveTab("content")}>민원 내용</button>
        <button className={`detail-tab ${state.activeTab === "result" ? "active" : ""}`} onClick={() => {
          if (data.status === "접수전") { state.setShowNoResultPopup(true); } else { state.setActiveTab("result"); }
        }}>처리 내용</button>
      </div>

      {/* 탭 본문 */}
      {state.activeTab === "content" ? (
        <DetailContent
          data={state.displayData}
          imagePath={state.imagePath}
          menuOpen={state.menuOpen}
          setMenuOpen={state.setMenuOpen}
          setPreviewImage={state.setPreviewImage}
          setImageError={state.setImageError}
          apiImages={state.detailData?.images || []}
          setShowReporterProfile={state.handleShowReporterProfile}
          formatDate={formatDate}
          isEditor={state.isEditor}
          fromStorage={fromStorage}
          user={state.user}
          onStatusChange={() => state.setShowStatusChange(true)}
          onDelete={() => state.setShowDeleteConfirm(true)}
          onEdit={state.isEditor ? state.handleEdit : () => state.setEditRequestModalOpen(true)}
          onAddFolder={() => state.setShowAddFolder(true)}
          onAlreadyMine={() => state.setShowAlreadyMine(true)}
          onHasOtherPerson={() => state.setShowHasOtherPerson(true)}
        />
      ) : (
        <>
          <DetailResult
            data={state.displayData}
            formatDate={formatDate}
            processImages={state.detailData?.processImages || []}
            setPreviewImage={state.setPreviewImage}
            onShowProfile={state.handleShowProcessorProfile}
          />

          {/* 수정 요청 섹션 */}
          {state.editRequest && (
            <EditRequestSection
              editRequest={state.editRequest}
              isAdmin={state.isEditor && (state.user?.role === "관리자" || state.user?.role === "admin" || state.user?.role === "A")}
              approving={state.approving}
              onApprove={state.handleApproveEditRequest}
              onReject={() => state.setRejectionModalOpen(true)}
            />
          )}
        </>
      )}

      {/* 처리자용 액션 버튼 */}
      <DetailActionButtons
        isEditor={state.isEditor}
        fromStorage={fromStorage}
        status={state.displayData?.status}
        canAccept={state.canAccept}
        onAccept={state.handleAccept}
        onProgress={state.handleProgress}
        onProcessWrite={() => { state.setProcessContent(""); state.setShowProcessForm(true); }}
      />

      {/* 모든 팝업/모달 */}
      <DetailPopups
        data={data}
        displayData={state.displayData}
        user={state.user}
        isEditor={state.isEditor}
        showProfile={state.showProfile}
        setShowProfile={state.setShowProfile}
        profileData={state.profileData}
        setProfileData={state.setProfileData}
        showReporterProfile={state.showReporterProfile}
        setShowReporterProfile={state.setShowReporterProfile}
        reporterProfileData={state.reporterProfileData}
        setReporterProfileData={state.setReporterProfileData}
        previewImage={state.previewImage}
        setPreviewImage={state.setPreviewImage}
        showEditSuccess={state.showEditSuccess}
        setShowEditSuccess={state.setShowEditSuccess}
        showDeleteConfirm={state.showDeleteConfirm}
        setShowDeleteConfirm={state.setShowDeleteConfirm}
        handleDelete={state.handleDelete}
        showDeleteSuccess={state.showDeleteSuccess}
        setShowDeleteSuccess={state.setShowDeleteSuccess}
        onUpdate={onUpdate}
        onClose={onClose}
        showAddFolder={state.showAddFolder}
        setShowAddFolder={state.setShowAddFolder}
        showAddFolderSuccess={state.showAddFolderSuccess}
        setShowAddFolderSuccess={state.setShowAddFolderSuccess}
        showAlreadyMine={state.showAlreadyMine}
        setShowAlreadyMine={state.setShowAlreadyMine}
        showHasOtherPerson={state.showHasOtherPerson}
        setShowHasOtherPerson={state.setShowHasOtherPerson}
        showNoResultPopup={state.showNoResultPopup}
        setShowNoResultPopup={state.setShowNoResultPopup}
        showProcessForm={state.showProcessForm}
        setShowProcessForm={state.setShowProcessForm}
        processContent={state.processContent}
        setProcessContent={state.setProcessContent}
        handleProcessSubmit={state.handleProcessSubmit}
        showProcessSuccess={state.showProcessSuccess}
        setShowProcessSuccess={state.setShowProcessSuccess}
        processLoading={state.processLoading}
        editRequestModalOpen={state.editRequestModalOpen}
        setEditRequestModalOpen={state.setEditRequestModalOpen}
        refetchEditRequest={state.refetchEditRequest}
        refetch={state.refetch}
        rejectionModalOpen={state.rejectionModalOpen}
        setRejectionModalOpen={state.setRejectionModalOpen}
        showEditForm={state.showEditForm}
        setShowEditForm={state.setShowEditForm}
        editRequest={state.editRequest}
      />
    </FormPopup>
  );
};

export default Detail;
