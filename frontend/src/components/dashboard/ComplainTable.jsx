import { Filter as FilterIcon, Star } from "lucide-react";
import { useState } from "react";
import Search from "../common/search";
import Status from "../common/Status";
import { STATUS_TABS } from "../../constants/status";

const ComplainTable = ({
  user, currentData, favorites, activeStatusTab,
  sortOrder, setSortOrder, currentPage, setCurrentPage, totalPages,
  onSearchChange, onStatusTabChange, onFilterApply, onToggleFavorite, onRowClick,
}) => {

  
  return (
    <div className="table-section">
      <div className="table-toolbar">
        <div className="status-tabs">
          {STATUS_TABS.map((tab) => (
            <button key={tab} className={`status-tab ${activeStatusTab === tab ? "active" : ""}`} onClick={() => onStatusTabChange(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <Search onSearchChange={onSearchChange} />
      </div>

      <div className="table-controls">
        <div className="controls">
          <select className="dropdown sort-dropdown" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
            <option value="상태순">상태순</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th className="col-fav"></th>
                <th>번호</th>
                {user?.role !== "처리자" && <th className="col-category">분류</th>}
                <th>제목</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, index) => (
                <tr key={row.id} onClick={() => onRowClick(row)} style={{ cursor: "pointer" }}>
                  <td className="col-fav" onClick={(e) => { e.stopPropagation(); onToggleFavorite(row.id); }}>
                    <Star size={18} className={`fav-icon ${favorites.includes(row.id) ? "fav-active" : ""}`} fill={favorites.includes(row.id) ? "#FFD23F" : "none"} color={favorites.includes(row.id) ? "#FFD23F" : "#ccc"} />
                  </td>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  {user?.role !== "처리자" && <td className="col-category">{row.category}</td>}
                  <td className="title">{row.title}</td>
                  <td><Status status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt;</button>
          <span className="pagination-info">{currentPage} / {totalPages || 1}</span>
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default ComplainTable;
