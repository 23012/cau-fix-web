import ProfilePopup from "./ProfilePopup";
import ImagePreview from "../common/ImagePreview";
import ConfirmPopup from "./ConfirmPopup";
import ProcessForm from "./ProcessForm";
import LoadingPopup from "../common/LoadingPopup";
import EditRequestModal from "./EditRequestModal";
import EditComplaintPopup from "./EditComplaintPopup";
import RejectionModal from "./RejectionModal";

/**
 * Detail 컴포넌트에서 사용하는 모든 팝업/모달을 모아둔 컴포넌트
 */
const DetailPopups = ({
  data,
  displayData,
  user,
  isEditor,

  // 프로필
  showProfile, setShowProfile, profileData, setProfileData,
  showReporterProfile, setShowReporterProfile, reporterProfileData, setReporterProfileData,

  // 이미지 프리뷰
  previewImage, setPreviewImage,

  // 확인 팝업
  showEditSuccess, setShowEditSuccess,
  showDeleteConfirm, setShowDeleteConfirm, handleDelete,
  showDeleteSuccess, setShowDeleteSuccess, onUpdate, onClose,
  showAddFolder, setShowAddFolder,
  showAddFolderSuccess, setShowAddFolderSuccess,
  showAlreadyMine, setShowAlreadyMine,
  showHasOtherPerson, setShowHasOtherPerson,
  showNoResultPopup, setShowNoResultPopup,

  // 처리 내용
  showProcessForm, setShowProcessForm, processContent, setProcessContent,
  handleProcessSubmit, handleProcessSave,
  showCompleteConfirm, setShowCompleteConfirm, handleProcessComplete,
  existingProcessImages, handleDeleteExistingProcessImage,
  showProcessSuccess, setShowProcessSuccess,
  processLoading,

  // 수정 요청
  editRequestModalOpen, setEditRequestModalOpen,
  refetchEditRequest, refetch,

  // 반려
  rejectionModalOpen, setRejectionModalOpen,

  // 수정 폼 (담당자 변경/기타)
  showEditForm, setShowEditForm, editRequest,
}) => {
  return (
    <>
      {/* 프로필 팝업 */}
      <ProfilePopup isOpen={showProfile} onClose={() => { setShowProfile(false); setProfileData(null); }} name={profileData?.name} dept={profileData?.dept} phone={profileData?.phone} />
      <ProfilePopup isOpen={showReporterProfile} onClose={() => { setShowReporterProfile(false); setReporterProfileData(null); }} name={reporterProfileData?.name} dept={reporterProfileData?.dept} phone={reporterProfileData?.phone} />

      {/* 이미지 프리뷰 */}
      <ImagePreview src={previewImage} alt="민원 사진" onClose={() => setPreviewImage(null)} />

      {/* 수정 완료 */}
      <ConfirmPopup isOpen={showEditSuccess} message="수정이 완료되었습니다." onConfirm={() => setShowEditSuccess(false)} />

      {/* 삭제 확인/완료 */}
      <ConfirmPopup
        isOpen={showDeleteConfirm}
        message={isEditor ? <>삭제된 민원은 복구할 수 없습니다.<br />정말 삭제하시겠습니까?</> : "내 폴더에서 삭제하시겠습니까?"}
        cancelLabel="취소"
        onCancel={() => setShowDeleteConfirm(false)}
        confirmLabel="삭제"
        confirmType="delete"
        onConfirm={handleDelete}
      />
      <ConfirmPopup isOpen={showDeleteSuccess} message="삭제가 완료되었습니다." onConfirm={() => { setShowDeleteSuccess(false); onUpdate?.({ ...data, _deleted: true }); onClose(); }} />

      {/* 내 처리함 추가 */}
      <ConfirmPopup
        isOpen={showAddFolder}
        message="내 처리함에 추가하시겠습니까?"
        cancelLabel="취소"
        onCancel={() => setShowAddFolder(false)}
        confirmLabel="추가"
        onConfirm={() => { setShowAddFolder(false); onUpdate?.({ ...data, resultPersonId: user?.id, resultPerson: user?.name, status: data.status === "접수전" ? "접수중" : data.status }); setShowAddFolderSuccess(true); }}
      />
      <ConfirmPopup isOpen={showAddFolderSuccess} message="내 처리함에 추가되었습니다." onConfirm={() => setShowAddFolderSuccess(false)} />

      {/* 이미 내 처리함 또는 다른 담당자 */}
      <ConfirmPopup isOpen={showAlreadyMine} message={<>{data.resultPerson || user?.name} 님이 담당자입니다.<br />내 폴더에서 확인 바랍니다.</>} onConfirm={() => setShowAlreadyMine(false)} />
      <ConfirmPopup isOpen={showHasOtherPerson} message={<>이미 담당자({data.resultPerson})가 배정되어 있어<br />내 폴더에 추가할 수 없습니다.</>} onConfirm={() => setShowHasOtherPerson(false)} />

      {/* 처리 내용 작성 */}
      <ProcessForm isOpen={showProcessForm} content={processContent} setContent={setProcessContent} onCancel={() => setShowProcessForm(false)} onSubmit={handleProcessSubmit} onSave={handleProcessSave} existingImages={existingProcessImages} onDeleteExisting={handleDeleteExistingProcessImage} />

      {/* 처리 완료 확인 (완료 시 수정/삭제 불가 안내) */}
      <ConfirmPopup
        isOpen={showCompleteConfirm}
        message={<>완료를 누르면 수정, 삭제가 불가합니다.<br />완료하시겠습니까?</>}
        cancelLabel="취소"
        onCancel={() => setShowCompleteConfirm(false)}
        confirmLabel="완료"
        onConfirm={handleProcessComplete}
      />
      <ConfirmPopup isOpen={showProcessSuccess} message="처리가 완료되었습니다." onConfirm={() => setShowProcessSuccess(false)} />
      <LoadingPopup isOpen={processLoading} message="처리 등록 중입니다..." />

      {/* 접수전 - 담당자 미배정 */}
      <ConfirmPopup isOpen={showNoResultPopup} message="담당자가 아직 배정되지 않았습니다." onConfirm={() => setShowNoResultPopup(false)} />

      {/* 수정 요청 팝업*/}
      <EditRequestModal
        isOpen={editRequestModalOpen}
        onClose={() => setEditRequestModalOpen(false)}
        complaintId={data.id}
        currentCategory={displayData.category}
        onSuccess={() => {
          setEditRequestModalOpen(false);
          refetchEditRequest();
          refetch();
          onUpdate?.({ ...data, status: "수정중" });
          alert("수정 요청이 완료되었습니다.");
        }}
      />

      {/* 반려 처리 팝업*/}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        complaintId={data.id}
        onSuccess={() => {
          setRejectionModalOpen(false);
          refetch();
          refetchEditRequest();
          alert("반려 처리 되었습니다.");
        }}
      />

      {/* 승인된 수정 요청: 민원 수정 폼 */}
      {showEditForm && (editRequest?.reasonType === '처리 담당자 변경' || editRequest?.reasonType === '기타') && (
        <EditComplaintPopup
          isOpen={true}
          onClose={() => setShowEditForm(false)}
          complaintId={data.id}
          editRequest={editRequest}
          currentData={displayData}
          onComplete={async () => {
            setShowEditForm(false);
            await refetch();
            refetchEditRequest();
            alert("민원 수정이 완료되었습니다.");
          }}
        />
      )}
    </>
  );
};

export default DetailPopups;
