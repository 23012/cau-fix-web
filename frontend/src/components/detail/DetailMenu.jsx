import { isEditRequestMenuVisible } from '../../utils/editRequestUtils';

const DetailMenu = ({ isEditor, fromStorage, data, user, onStatusChange, onDelete, onEdit, onAddFolder, onAlreadyMine, onHasOtherPerson, onClose }) => {
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
  const canEdit = isAdmin || data.status === "접수전";
  return (
    <div className="detail-menu-popup">
      <button
        className="detail-menu-item"
        onClick={canEdit ? onEdit : () => { alert("관리자 문의 바랍니다."); onClose(); }}
      >
        수정
      </button>
      <button
        className="detail-menu-item delete"
        onClick={canEdit ? () => { onDelete(); onClose(); } : () => { alert("관리자 문의 바랍니다."); onClose(); }}
      >
        삭제
      </button>
    </div>
  );
};

export default DetailMenu;
