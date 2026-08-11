import { isEditRequestMenuVisible } from '../../utils/editRequestUtils';

const DetailMenu = ({ isEditor, fromStorage, data, user, onStatusChange, onDelete, onEdit, onCancelAccept, onAddFolder, onAlreadyMine, onHasOtherPerson, onClose }) => {
  if (!isEditor) {
    // 처리자
    const { showEditRequest } = isEditRequestMenuVisible(
      data?.status,
      user?.role,
      fromStorage
    );

    if (showEditRequest) {
      return (
        <div className="detail-menu-popup">
          <button className="detail-menu-item" onClick={() => { onEdit(); onClose(); }}>
            수정 요청
          </button>
        </div>
      );
    }

    return null;
  }

  // 사용자/관리자
  const isAdmin = user?.role === "관리자" || user?.role === "admin" || user?.role === "A";
  // 완료된 민원: 수정은 누구도 불가(숨김), 삭제는 관리자만 가능(정리용)
  const isCompleted = data.status === "완료";
  const canEdit = isAdmin || data.status === "접수전";
  // 접수취소: 관리자만, 접수 이후~완료 전(접수중/진행중)일 때만 접수전으로 되돌리기
  const canCancelAccept = isAdmin && (data.status === "접수중" || data.status === "진행중");
  // 삭제: 완료여도 관리자면 표시 (비관리자는 완료 시 숨김)
  const showDelete = !isCompleted || isAdmin;

  // 보여줄 메뉴가 하나도 없으면 렌더하지 않음
  if (isCompleted && !canCancelAccept && !showDelete) return null;

  return (
    <div className="detail-menu-popup">
      {!isCompleted && (
        <button
          className="detail-menu-item"
          onClick={canEdit ? onEdit : () => { alert("관리자 문의 바랍니다."); onClose(); }}
        >
          수정
        </button>
      )}
      {canCancelAccept && (
        <button
          className="detail-menu-item"
          onClick={() => { onCancelAccept(); onClose(); }}
        >
          접수취소
        </button>
      )}
      {showDelete && (
        <button
          className="detail-menu-item delete"
          onClick={canEdit ? () => { onDelete(); onClose(); } : () => { alert("관리자 문의 바랍니다."); onClose(); }}
        >
          삭제
        </button>
      )}
    </div>
  );
};

export default DetailMenu;
