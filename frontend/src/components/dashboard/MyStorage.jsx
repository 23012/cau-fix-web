import { useState } from "react";
import { FolderOpen, X, Search as SearchIcon, Filter as FilterIcon } from "lucide-react";
import Status from "../common/Status";
import { STATUS_ORDER } from "../../constants/status";
import { parseExcelDate } from "../../utils/parseExcelDate";
import "./MyStorage.css";

const ITEMS_PER_PAGE = 7;
const STATUS_TABS = ["전체", "접수중", "진행중", "완료"];
const SORT_OPTIONS = ["번호순", "최신순", "오래된순", "상태순"];

const MyStorage = ({ isOpen, onClose, data, onSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("전체");
  const [sortOrder, setSortOrder] = useState("번호순");
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState({ year: "", month: "", day: "" });
  const [endDate, setEndDate] = useState({ year: "", month: "", day: "" });

  if (!isOpen) return null;

  // 검색
  const searched = data.filter((row) => {
    if (!searchQuery.trim()) return true;
    return row.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 상태 필터
  const statusFiltered = searched.filter((row) => {
    if (activeStatus === "전체") return true;
    return row.status === activeStatus;
  });

  // 기간 필터
  const filtered = statusFiltered.filter((row) => {
    if (startDate.year && startDate.month && startDate.day) {
      const s = new Date(startDate.year, startDate.month - 1, startDate.day);
      const rowDate = parseExcelDate(row.date);
      if (rowDate && rowDate < s) return false;
    }
    if (endDate.year && endDate.month && endDate.day) {
      const e = new Date(endDate.year, endDate.month - 1, endDate.day, 23, 59, 59);
      const rowDate = parseExcelDate(row.date);
      if (rowDate && rowDate > e) return false;
    }
    return true;
  });

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    switch (sortOrder) {
      case "최신순": return (typeof b.date === "number" ? b.date : 0) - (typeof a.date === "number" ? a.date : 0);
      case "오래된순": return (typeof a.date === "number" ? a.date : 0) - (typeof b.date === "number" ? b.date : 0);
      case "상태순": return (STATUS_ORDER[a.status] ?? 999) - (STATUS_ORDER[b.status] ?? 999);
      default: return a.id - b.id;
    }
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) { setSearchQuery(""); }
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setStartDate({ year: "", month: "", day: "" });
    setEndDate({ year: "", month: "", day: "" });
    setCurrentPage(1);
  };

  return (
    <div className="my-storage-overlay" onClick={onClose}>
      <div className="my-storage-popup" onClick={(e) => e.stopPropagation()}>
        <button className="my-storage-close" onClick={onClose}><X size={22} /></button>

        <div className="my-storage-header">
          <FolderOpen size={24} color="#63C3D1" />
          <h2>내 보관함</h2>
          <div className="my-storage-header-actions">
            <div className="my-storage-search-container">
              <div className={`my-storage-search-wrapper ${searchOpen ? "open" : ""}`}>
                <input
                  type="text"
                  className="my-storage-search-input"
                  placeholder="제목을 입력하세요"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <button className="my-storage-icon-btn" onClick={toggleSearch}><SearchIcon size={22}/></button>
            </div>
          </div>
        </div>

        {/* 상태 탭 + 필터/정렬 */}
        <div className="my-storage-toolbar">
          <div className="my-storage-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                className={`my-storage-tab ${activeStatus === tab ? "active" : ""}`}
                onClick={() => { setActiveStatus(tab); setCurrentPage(1); }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="my-storage-controls">
            <div style={{ position: "relative" }}>
              <button className="my-storage-icon-btn" onClick={() => setFilterOpen(!filterOpen)}>
                <FilterIcon size={16} />
              </button>
              {filterOpen && (
                <div className="my-storage-filter-panel" onClick={(e) => e.stopPropagation()}>
                  <h4 className="my-storage-filter-title">기간</h4>
                  <div className="my-storage-filter-dates">
                    <div className="my-storage-filter-date-row">
                      <input type="text" placeholder="년" maxLength="4" value={startDate.year} onChange={(e) => setStartDate({ ...startDate, year: e.target.value })} className="my-storage-filter-input" />
                      <span>/</span>
                      <input type="text" placeholder="월" maxLength="2" value={startDate.month} onChange={(e) => setStartDate({ ...startDate, month: e.target.value })} className="my-storage-filter-input" />
                      <span>/</span>
                      <input type="text" placeholder="일" maxLength="2" value={startDate.day} onChange={(e) => setStartDate({ ...startDate, day: e.target.value })} className="my-storage-filter-input" />
                    </div>
                    <span className="my-storage-filter-sep">~</span>
                    <div className="my-storage-filter-date-row">
                      <input type="text" placeholder="년" maxLength="4" value={endDate.year} onChange={(e) => setEndDate({ ...endDate, year: e.target.value })} className="my-storage-filter-input" />
                      <span>/</span>
                      <input type="text" placeholder="월" maxLength="2" value={endDate.month} onChange={(e) => setEndDate({ ...endDate, month: e.target.value })} className="my-storage-filter-input" />
                      <span>/</span>
                      <input type="text" placeholder="일" maxLength="2" value={endDate.day} onChange={(e) => setEndDate({ ...endDate, day: e.target.value })} className="my-storage-filter-input" />
                    </div>
                  </div>
                  <div className="my-storage-filter-actions">
                    <button className="my-storage-filter-reset" onClick={resetFilter}>초기화</button>
                    <button className="my-storage-filter-apply" onClick={() => { setFilterOpen(false); setCurrentPage(1); }}>적용</button>
                  </div>
                </div>
              )}
            </div>
            <select className="my-storage-sort" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
              {SORT_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>
        </div>

        {/* 테이블 */}
        <div className="my-storage-table-wrap">
          <table className="my-storage-table">
            <thead>
              <tr><th>번호</th><th>제목</th><th>상태</th></tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr><td colSpan={3} className="my-storage-empty">민원이 없습니다.</td></tr>
              ) : (
                currentData.map((row) => (
                  <tr key={row.id} onClick={() => onSelect?.(row)} style={{ cursor: "pointer" }}>
                    <td>{row.id}</td>
                    <td className="my-storage-title">{row.title}</td>
                    <td><Status status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="my-storage-pagination">
          <button className="my-storage-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt;</button>
          <span className="my-storage-page-info">{currentPage}/{totalPages || 1}</span>
          <button className="my-storage-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default MyStorage;
