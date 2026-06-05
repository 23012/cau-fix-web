/**
 * 처리자용 하단 액션 버튼 영역
 * - 접수하기 / 진행하기 / 처리 내용 작성
 */
const DetailActionButtons = ({ isEditor, fromStorage, status, canAccept = false, onAccept, onProgress, onProcessWrite }) => {
  // 처리자 + 접수전 + 담당 카테고리 일치: 접수하기 버튼
  if (!isEditor && status === "접수전" && canAccept) {
    return (
      <div className="detail-accept-area">
        <button className="detail-accept-btn" onClick={onAccept}>
          접수하기
        </button>
      </div>
    );
  }

  // 처리자 + 내 보관함 + 접수: 진행하기 버튼
  if (!isEditor && fromStorage && (status === "접수" || status === "접수중")) {
    return (
      <div className="detail-accept-area">
        <button className="detail-accept-btn detail-accept-btn--progress" onClick={onProgress}>
          진행하기
        </button>
      </div>
    );
  }

  // 처리자 + 내 보관함 + 진행중: 처리 내용 작성 버튼
  if (!isEditor && fromStorage && status === "진행중") {
    return (
      <div className="detail-accept-area">
        <button className="detail-accept-btn detail-accept-btn--complete" onClick={onProcessWrite}>
          처리 내용 작성
        </button>
      </div>
    );
  }

  return null;
};

export default DetailActionButtons;
