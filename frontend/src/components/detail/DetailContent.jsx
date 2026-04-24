import Status from "../common/Status";
import DetailMenu from "./DetailMenu";
import { MoreVertical } from "lucide-react";

const DetailContent = ({
  data, imagePath, menuOpen, setMenuOpen, setPreviewImage, setImageError,
  setShowReporterProfile, formatDate,
  // menu props
  isEditor, fromStorage, user,
  onStatusChange, onDelete, onEdit, onAddFolder, onAlreadyMine, onHasOtherPerson,
}) => {
  return (
    <>
      <div className="detail-header">
        <div className="detail-header-left">
          <h2 className="detail-title">{data.title || "-"}</h2>
        </div>
        <div className="detail-header-right">
          <Status status={data.status} />
          <button className="detail-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <DetailMenu
              isEditor={isEditor}
              fromStorage={fromStorage}
              data={data}
              user={user}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
              onAddFolder={onAddFolder}
              onAlreadyMine={onAlreadyMine}
              onHasOtherPerson={onHasOtherPerson}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">신고자</div>
        <div
          className="detail-value detail-value-clickable"
          onClick={() => data.reporterName && setShowReporterProfile(true)}
        >
          {data.reporterName || "-"}
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">부서</div>
        <div className="detail-value">{data.dept || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">분류</div>
        <div className="detail-value">{data.category || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">장소</div>
        <div className="detail-value">{data.location || "-"}</div>
      </div>

      <div className="detail-row">
        <div className="detail-label">접수 시간</div>
        <div className="detail-value">{formatDate(data.date)}</div>
      </div>

      <div className="detail-tab-content">
        <div className="detail-text-content">
          <p>{data.content || ""}</p>
          {imagePath && (
            <div className="detail-image-container">
              <img
                src={imagePath}
                alt="민원 사진"
                className="detail-image"
                onClick={() => setPreviewImage(imagePath)}
                onError={() => setImageError(true)}
                style={{ cursor: "pointer" }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DetailContent;
