const DetailResult = ({ data, formatDate, onShowProfile }) => {
  // 담당자도 없고 처리 내용도 없으면 표시 안함
  if (!data.result && !data.resultPerson) return null;

  return (
    <>
      <div className="detail-row">
        <div className="detail-label">처리자</div>
        <div
          className={`detail-value ${data.resultPerson ? "detail-value-clickable" : ""}`}
          onClick={() => data.resultPerson && onShowProfile()}
        >
          {data.resultPerson || "-"}
        </div>
      </div>

      {data.resultDate && (
        <div className="detail-row">
          <div className="detail-label">처리 시간</div>
          <div className="detail-value">{formatDate(data.resultDate) || "-"}</div>
        </div>
      )}

      {data.result ? (
        <div className="detail-tab-content">
          <div className="detail-text-content">
            <p>{data.result}</p>
          </div>
        </div>
      ) : (
        <div className="detail-tab-content">
          <div className="detail-text-content">
            <p style={{ color: "#999" }}>아직 처리 내용이 작성되지 않았습니다.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailResult;
