import { useState, useRef } from "react";
import { FolderOpen, X, Search as SearchIcon, Filter as FilterIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Status from "../common/Status";
import { STATUS_ORDER } from "../../constants/status";
import { parseExcelDate } from "../../utils/parseExcelDate";
import "./MyStorage.css";

const ITEMS_PER_PAGE = 7;
const STATUS_TABS = ["전체", "접수중", "진행중", "완료"];
const SORT_OPTIONS = ["번호순", "최신순", "오래된순", "상태순"];
const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/* ── 미니 달력 컴포넌트 ── */
const MiniCalendar = ({ selected, onSelect }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) => {
    if (!selected || !d) return false;
    return selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  };

  return (
    <div className="ms-calendar">
      <div className="ms-calendar-header">
        <button type="button" className="ms-calendar-nav" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="ms-calendar-title">{viewYear}년 {viewMonth + 1}월</span>
        <button type="button" className="ms-calendar-nav" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>
      <div className="ms-calendar-weekdays">
        {DAYS_OF_WEEK.map((d) => <span key={d} className="ms-calendar-wd">{d}</span>)}
      </div>
      <div className="ms-calendar-grid">
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            className={`ms-calendar-cell ${d ? "" : "empty"} ${isSelected(d) ? "selected" : ""}`}
            disabled={!d}
            onClick={() => d && onSelect(new Date(viewYear, viewMonth, d))}
          >
            {d || ""}
          </button>
        ))}
      </div>
    </div>
  );
};

const MyStorage = ({ isOpen, onClose, data, onSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("전체");
  const [sortOrder, setSortOrder] = useState("최신순");
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState({ year: "", month: "", day: "" });
  const [endDate, setEndDate] = useState({ year: "", month: "", day: "" });
  const [calendarTarget, setCalendarTarget] = useState(null); // "start" | "end" | null

  const filterRef = useRef(null);

  // 팝업 내부 클릭 시 필터 패널 바깥이면 닫기
  const handlePopupClick = (e) => {
    e.stopPropagation();
    // 필터 패널 바깥 클릭 시 닫기
    if (filterOpen && filterRef.current && !filterRef.current.contains(e.target)) {
      setFilterOpen(false);
      setCalendarTarget(null);
    }
  };

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
    setCalendarTarget(null);
    setCurrentPage(1);
  };

  const startDateObj = (startDate.year && startDate.month && startDate.day)
    ? new Date(Number(startDate.year), Number(startDate.month) - 1, Number(startDate.day))
    : null;
  const endDateObj = (endDate.year && endDate.month && endDate.day)
    ? new Date(Number(endDate.year), Number(endDate.month) - 1, Number(endDate.day))
    : null;

  const handleCalendarSelect = (date) => {
    const obj = { year: String(date.getFullYear()), month: String(date.getMonth() + 1), day: String(date.getDate()) };
    if (calendarTarget === "start") setStartDate(obj);
    else if (calendarTarget === "end") setEndDate(obj);
    setCalendarTarget(null);
  };

  return (
    <div className="my-storage-overlay" onClick={(e) => { e.stopPropagation(); if (filterOpen) { setFilterOpen(false); setCalendarTarget(null); } else { onClose(); } }}>
      <div className="my-storage-popup" onClick={handlePopupClick}>
        <div className="my-storage-header">
          <FolderOpen size={24} color="#63C3D1" />
          <h2>내 처리함</h2>
          <div className="my-storage-header-actions">
            {/*검색*/}
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
            <button className="my-storage-icon-btn" onClick={onClose}><X size={22} /></button>
          </div>
        </div>

        {/* 상태 탭 */}
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

        {/* 필터/정렬 */}
        <div className="my-storage-controls">
          <div className="my-storage-filter-wrapper" ref={filterRef}>
            <button className="my-storage-icon-btn" onClick={() => { setFilterOpen(!filterOpen); setCalendarTarget(null); }}>
              <FilterIcon size={18} />
            </button>
            {filterOpen && (
              <div className="my-storage-filter-panel" onClick={(e) => e.stopPropagation()}>
                <h4 className="my-storage-filter-title">기간</h4>
                <div className="my-storage-filter-dates">
                  <button
                    type="button"
                    className={`ms-date-btn ${calendarTarget === "start" ? "active" : ""}`}
                    onClick={() => setCalendarTarget(calendarTarget === "start" ? null : "start")}
                  >
                    {startDate.year ? `${startDate.year}/${startDate.month}/${startDate.day}` : "시작일"}
                  </button>
                  <span className="my-storage-filter-sep">~</span>
                  <button
                    type="button"
                    className={`ms-date-btn ${calendarTarget === "end" ? "active" : ""}`}
                    onClick={() => setCalendarTarget(calendarTarget === "end" ? null : "end")}
                  >
                    {endDate.year ? `${endDate.year}/${endDate.month}/${endDate.day}` : "종료일"}
                  </button>
                </div>
                {calendarTarget && (
                  <MiniCalendar
                    selected={calendarTarget === "start" ? startDateObj : endDateObj}
                    onSelect={handleCalendarSelect}
                  />
                )}
                <div className="my-storage-filter-actions">
                  <button className="my-storage-filter-reset" onClick={resetFilter}>초기화</button>
                  <button className="my-storage-filter-apply" onClick={() => { setFilterOpen(false); setCalendarTarget(null); setCurrentPage(1); }}>적용</button>
                </div>
              </div>
            )}
          </div>
          {/*민원 상태 구분 메뉴바*/}
          <select className="my-storage-sort" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            {SORT_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
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
                  <tr key={row.id} onClick={() => onSelect?.(row)}>
                    <td>{row.id}</td>
                    <td className="my-storage-title">{row.title}</td>
                    <td><Status status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <hr className="my-storage-divider" />      
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
