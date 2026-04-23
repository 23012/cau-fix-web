const DetailResult = ({ data, formatDate, onShowProfile }) => {
  if (!data.result) return null;

  return (
    <>
      <div className="detail-row">
        <div className="detail-label">처리자</div>
        <div
          className="detail-value detail-value-clickable"
          onClick={onShowProfile}
        >
          {data.resultPerson || "-"}
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">처리 시간</div>
        <div className="detail-value">{formatDate(data.resultDate) || "-"}</div>
      </div>

      <div className="detail-tab-content">
        <div className="detail-text-content">
          <p>{data.result || "-"}</p>
        </div>
      </div>
    </>
  );
};

export default DetailResult;
