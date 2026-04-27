import "./complain.css";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Filter as FilterIcon, Plus, FolderOpen, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import useComplainData from "../../hooks/useComplainData";
import Search from "../common/search";
import Filter from "../common/filter";
import Status from "../common/Status";
import ComplainForm from "../form/ComplainForm";
import Detail from "../detail/detail";
import MyStorage from "./MyStorage";
import { STATUS_TABS, STATUS_ORDER, STATUS_COLORS } from "../../constants/status";
import { parseExcelDate } from "../../utils/parseExcelDate";

const getChartData = (data) => {
  const counts = data.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  return STATUS_TABS.filter((s) => s !== "전체").map((name) => ({
    name,
    value: counts[name] || 0,
    color: STATUS_COLORS[name],
  }));
};

/**
 * 민원 대시보드 (사용자/처리자 메인 화면)
 * TODO: 백엔드 연결 시
 *   - useComplainData 훅 내부가 API 호출로 교체됨
 *   - 즐겨찾기: POST/DELETE /api/favorites/{complainId}
 *   - 민원 접수: POST /api/complains
 */
const Complain = () => {
  const navigate = useNavigate();
  const { tableData, setTableData } = useComplainData();
  const [user, setUser] = useState(null);
  const [sortOrder, setSortOrder] = useState("번호순");
  const [selectedYear, setSelectedYear] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [activeStatusTab, setActiveStatusTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [complainFormOpen, setComplainFormOpen] = useState(false);
  const [myStorageOpen, setMyStorageOpen] = useState(false);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [fromStorage, setFromStorage] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    category: "",
    startDate: { year: "", month: "", day: "" },
    endDate: { year: "", month: "", day: "" },
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  /* 역할 기반 필터링 */
  const roleFilteredData = tableData.filter((row) => {
    if (!user) return true;
    if (user.role === "관리자") return true;
    if (user.role === "처리자") return row.category === user.dept;
    if (user.role === "사용자") return String(row.complainBy) === String(user.id);
    return true;
  });

  /* 날짜 → 검색 → 추가필터 → 상태탭 → 정렬 파이프라인 */
  const dateFilteredData = roleFilteredData.filter((row) => {
    if (selectedYear === "전체" && selectedMonth === "전체") return true;
    const dateObj = parseExcelDate(row.date);
    if (!dateObj) return false;
    if (selectedYear !== "전체" && dateObj.getFullYear().toString() !== selectedYear) return false;
    if (selectedMonth !== "전체" && (dateObj.getMonth() + 1).toString() !== selectedMonth) return false;
    return true;
  });

  const searchFilteredData = dateFilteredData.filter((row) => {
    if (!searchQuery.trim()) return true;
    return row.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const additionalFilteredData = searchFilteredData.filter((row) => {
    if (filterOptions.statuses.length > 0 && !filterOptions.statuses.includes(row.status)) return false;
    if (filterOptions.category && row.category !== filterOptions.category) return false;
    const { startDate, endDate } = filterOptions;
    if (startDate.year && startDate.month && startDate.day) {
      const start = new Date(startDate.year, startDate.month - 1, startDate.day);
      const rowDate = parseExcelDate(row.date);
      if (rowDate && rowDate < start) return false;
    }
    if (endDate.year && endDate.month && endDate.day) {
      const end = new Date(endDate.year, endDate.month - 1, endDate.day, 23, 59, 59);
      const rowDate = parseExcelDate(row.date);
      if (rowDate && rowDate > end) return false;
    }
    return true;
  });

  const statusFilteredData = additionalFilteredData.filter((row) => {
    if (activeStatusTab === "전체") return true;
    if (activeStatusTab === "즐겨찾기") return favorites.includes(row.id);
    return row.status === activeStatusTab;
  });

  const sortData = (data) => {
    const sorted = [...data];
    switch (sortOrder) {
      case "번호순": return sorted.sort((a, b) => a.id - b.id);
      case "최신순": return sorted.sort((a, b) => {
        const dA = typeof a.date === "number" ? a.date : parseFloat(a.date);
        const dB = typeof b.date === "number" ? b.date : parseFloat(b.date);
        return dB - dA;
      });
      case "오래된순": return sorted.sort((a, b) => {
        const dA = typeof a.date === "number" ? a.date : parseFloat(a.date);
        const dB = typeof b.date === "number" ? b.date : parseFloat(b.date);
        return dA - dB;
      });
      case "상태순": return sorted.sort((a, b) => (STATUS_ORDER[a.status] ?? 999) - (STATUS_ORDER[b.status] ?? 999));
      default: return sorted;
    }
  };

  const filteredData = sortData(statusFilteredData);
  const chartData = getChartData(sortData(additionalFilteredData));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (query) => { setSearchQuery(query); setCurrentPage(1); };
  const handleYearChange = (e) => { setSelectedYear(e.target.value); setCurrentPage(1); };
  const handleMonthChange = (e) => { setSelectedMonth(e.target.value); setCurrentPage(1); };
  const handleFilterApply = (options) => { setFilterOptions(options); setCurrentPage(1); };
  const handleStatusTabChange = (tab) => { setActiveStatusTab(tab); setCurrentPage(1); };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleRowClick = (row) => {
    if (window.innerWidth <= 768) {
      navigate("/complain-detail", { state: { data: row } });
    } else {
      setFromStorage(false);
      setSelectedComplain(row);
    }
  };

  return (
    <div className="dashboard">
      {/* MOBILE 헤더 */}
      <div className="mobile-header">
        <div className="mobile-title-row">
          <h1 className="mobile-title">내 민원</h1>
          {user?.role === "처리자" && user?.dept && (
            <span className="mobile-dept-badge">{user.dept}</span>
          )}
        </div>
        <Search onSearchChange={handleSearchChange} />
      </div>

      <div className="main">
        {/* 차트 영역 */}
        <div className="chart-area">
          <div className="chart-date-filters">
            <select className="dropdown" value={selectedYear} onChange={handleYearChange}>
              <option value="전체">전체</option>
              <option value="2026">2026년</option>
            </select>
            <select className="dropdown" value={selectedMonth} onChange={handleMonthChange}>
              <option value="전체">전체</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
              ))}
            </select>
          </div>

          <div className="chart-container">
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius="50%" outerRadius="95%" dataKey="value" paddingAngle={2}>
                    {chartData.map((item, i) => (<Cell key={i} fill={item.color} />))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}건`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-center-label">
              <span className="chart-center-count">{chartData.reduce((s, d) => s + d.value, 0)}</span>
              <span className="chart-center-unit">건</span>
            </div>
          </div>

          <div className="chart-status-summary">
            {chartData.map((item) => (
              <span key={item.name} className="chart-status-item">
                <span className="chart-status-dot" style={{ background: item.color }} />
                <span className="chart-status-name">{item.name}</span>
                <span className="chart-status-count" style={{ color: item.color }}>{item.value}</span>
              </span>
            ))}
          </div>

          <hr className="chart-divider" />

          <div className="legend-bars">
            {chartData.map((item) => {
              const total = chartData.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="legend-bar-item" title={`${item.name}: ${item.value}건`}>
                  <span className="legend-bar-label" style={{ color: item.color }}>{item.name}</span>
                  <div className="legend-bar-track">
                    <div className="legend-bar-fill" style={{ width: `${percent}%`, background: item.color }} />
                    <span className="legend-bar-tooltip">{item.value}건</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="register-btn favorite-btn" onClick={() => handleStatusTabChange("즐겨찾기")}>
            <Star size={20} strokeWidth={2.5} /><span>즐겨찾기</span>
          </button>
        </div>

        {/* 테이블 영역 */}
        <div className="table-section">
          <div className="table-toolbar">
            <div className="status-tabs">
              {STATUS_TABS.map((tab) => (
                <button key={tab} className={`status-tab ${activeStatusTab === tab ? "active" : ""}`} onClick={() => handleStatusTabChange(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <Search onSearchChange={handleSearchChange} />
          </div>

          <div className="table-controls">
            <div className="controls">
              <div style={{ position: "relative" }}>
                <button className="icon-btn" onClick={() => setFilterOpen(!filterOpen)}>
                  <FilterIcon size={18} />
                </button>
                <Filter isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={handleFilterApply} />
              </div>
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
                  {currentData.map((row) => (
                    <tr key={row.id} onClick={() => handleRowClick(row)} style={{ cursor: "pointer" }}>
                      <td className="col-fav" onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}>
                        <Star size={18} className={`fav-icon ${favorites.includes(row.id) ? "fav-active" : ""}`} fill={favorites.includes(row.id) ? "#FFD23F" : "none"} color={favorites.includes(row.id) ? "#FFD23F" : "#ccc"} />
                      </td>
                      <td>{row.id}</td>
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
      </div>

      {/* FAB — Portal로 body 직속에 렌더링하여 부모 레이아웃 영향 제거 */}
      {createPortal(
        <div className="fab">
          {user?.role === "처리자" ? (
            <button className="fab-btn" onClick={() => setMyStorageOpen(true)}><FolderOpen /></button>
          ) : (
            <button className="fab-btn" onClick={() => setComplainFormOpen(true)}><Plus /></button>
          )}
        </div>,
        document.body
      )}

      {/* TODO: 백엔드 연결 시 onSubmit에서 POST /api/complains 호출 */}
      <ComplainForm isOpen={complainFormOpen} onClose={() => setComplainFormOpen(false)} onSubmit={() => setComplainFormOpen(false)} />

      <MyStorage
        isOpen={myStorageOpen}
        onClose={() => setMyStorageOpen(false)}
        data={tableData.filter((row) => String(row.resultPersonId) === String(user?.id))}
        onSelect={(row) => { setFromStorage(true); setSelectedComplain(row); }}
      />

      {/* TODO: 백엔드 연결 시 onUpdate에서 PUT /api/complains/{id} 호출 */}
      <Detail
        isOpen={!!selectedComplain}
        onClose={() => setSelectedComplain(null)}
        data={selectedComplain}
        fromStorage={fromStorage}
        onUpdate={(updated) => {
          setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setSelectedComplain(updated);
        }}
      />
    </div>
  );
};

export default Complain;
