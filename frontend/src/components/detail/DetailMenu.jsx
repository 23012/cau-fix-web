const DetailMenu = ({ isEditor, fromStorage, data, user, onStatusChange, onDelete, onEdit, onAddFolder, onAlreadyMine, onHasOtherPerson, onClose }) => {
  if (!isEditor) {
    // 처리자
    if (fromStorage) {
      return (
        <div className="detail-menu-popup">
          <button className="detail-menu-item" onClick={() => { onStatusChange(); onClose(); }}>
            상태 변경
          </button>
          <button className="detail-menu-item delete" onClick={() => { onDelete(); onClose(); }}>
            내 처리 현황에서<br />빼기
          </button>
        </div>
      );
    }
    return (
      <div className="detail-menu-popup">
        <button
          className="detail-menu-item"
          onClick={() => {
            onClose();
            if (String(data.resultPersonId) === String(user?.id)) {
              onAlreadyMine();
            } else if (data.resultPersonId) {
              onHasOtherPerson();
            } else {
              onAddFolder();
            }
          }}
        >
          내 처리현황에 추가
        </button>
      </div>
    );
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
