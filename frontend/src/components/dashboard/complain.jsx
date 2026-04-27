import "./complain.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter as FilterIcon, Plus, FolderOpen, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assets/files/sample.xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import Search from "../common/search";
import Filter from "../common/filter";
import Status from "../common/Status";
import ComplainForm from "../form/ComplainForm";

import Detail from "../detail/detail";
import MyStorage from "./MyStorage";
import { STATUS_TABS, STATUS_ORDER, STATUS_COLORS, normalizeStatus } from "../../constants/status";
import { normalizeCategory } from "../../constants/categories";
import { parseExcelDate } from "../../utils/parseExcelDate";

const getChartData = (data) => {
  const counts = data.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return STATUS_TABS.filter(s => s !== "전체").map(name => ({
    name,
    value: counts[name] || 0,
    color: STATUS_COLORS[name],
  }));
};

const Complain = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
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

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const [sampleRes, loginRes] = await Promise.all([
          fetch(sampleFile),
          fetch(loginDataFile)
        ]);
        const sampleBuffer = await sampleRes.arrayBuffer();
        const loginBuffer = await loginRes.arrayBuffer();

        const loginWorkbook = XLSX.read(loginBuffer, { type: "array" });
        const loginSheet = loginWorkbook.Sheets[loginWorkbook.SheetNames[0]];
        const loginRows = XLSX.utils.sheet_to_json(loginSheet);
        const memberMap = {};
        const memberByIdMap = {};
        loginRows.forEach((row) => {
          const name = row["name"]?.toString();
          const memberId = row["member_id"];
          if (name) {
            memberMap[name] = {
              department: row["dept"]?.toString() || null,
              phone: row["phone"]?.toString() || null,
            };
          }
          if (memberId != null) {
            memberByIdMap[String(memberId)] = {
              name: name || null,
              department: row["dept"]?.toString() || null,
              phone: row["phone"]?.toString() || null,
            };
          }
        });

        const workbook = XLSX.read(sampleBuffer, { type: "array" });
        
        const complainSheet = workbook.Sheets["민원"];
        const complainRows = XLSX.utils.sheet_to_json(complainSheet);
        
        const resultSheet = workbook.Sheets["처리"];
        const resultRows = XLSX.utils.sheet_to_json(resultSheet);
        
        const resultMap = {};
        resultRows.forEach((row) => {
          resultMap[row["complain_id"]] = {
            resultContent: row["process_content"],
            resultPersonId: row["process_by"],
            resultPerson: memberByIdMap[String(row["process_by"])]?.name || null,
            resultDate: row["process_at"]
          };
        });

        const parsed = complainRows.map((row) => ({
          id: row["complain_id"],
          complainBy: row["complain_by"] || null,
          reporterName: memberByIdMap[String(row["complain_by"])]?.name || null,
          reporterPhone: memberByIdMap[String(row["complain_by"])]?.phone || null,
          dept: memberByIdMap[String(row["complain_by"])]?.department || null,
          category: normalizeCategory(row["category_id"]),
          title: row["complain_title"],
          content: row["complain_content"],
          result: resultMap[row["complain_id"]]?.resultContent || null,
          resultPerson: resultMap[row["complain_id"]]?.resultPerson || null,
          resultPersonId: resultMap[row["complain_id"]]?.resultPersonId || null,
          resultDate: resultMap[row["complain_id"]]?.resultDate || null,
          resultDept: memberByIdMap[String(resultMap[row["complain_id"]]?.resultPersonId)]?.department || null,
          resultPhone: memberByIdMap[String(resultMap[row["complain_id"]]?.resultPersonId)]?.phone || null,
          location: row["location"],
          status: normalizeStatus(row["state"]),
          date: row["complain_at"],
        }));

        setTableData(parsed);
      } catch (error) {
        // Excel 로드 실패 시 빈 데이터 유지
      }
    };

    loadExcel();
  }, []);

  // 역할 기반 필터링
  const roleFilteredData = tableData.filter((row) => {
    if (!user) return true;
    const role = user.role; // 라벨값: 사용자, 처리자, 관리자
    if (role === "관리자") return true;
    if (role === "처리자") return row.category === user.dept;
    if (role === "사용자") {
      return String(row.complainBy) === String(user.id);
    }
    return true;
  });

  // 날짜 필터링 함수
  const filterByDate = (data) => {
    return data.filter((row) => {
      if (selectedYear === "전체" && selectedMonth === "전체") return true;
      const dateObj = parseExcelDate(row.date);
      if (!dateObj) return false;

      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString();

      if (selectedYear !== "전체" && year !== selectedYear) return false;
      if (selectedMonth !== "전체" && month !== selectedMonth) return false;
      return true;
    });
  };

  // 날짜 필터링 적용
  const dateFilteredData = filterByDate(roleFilteredData);

  // 검색 필터링
  const searchFilteredData = dateFilteredData.filter((row) => {
    if (searchQuery.trim() === "") return true;
    return row.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 추가 필터 적용 (상태, 분류, 기간)
  const additionalFilteredData = searchFilteredData.filter((row) => {
    // 상태 필터
    if (filterOptions.statuses.length > 0 && !filterOptions.statuses.includes(row.status)) {
      return false;
    }

    // 분류 필터
    if (filterOptions.category && row.category !== filterOptions.category) {
      return false;
    }

    // 기간 필터
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

  // 상태 탭 필터 적용
  const statusFilteredData = additionalFilteredData.filter((row) => {
    if (activeStatusTab === "전체") return true;
    if (activeStatusTab === "즐겨찾기") return favorites.includes(row.id);
    return row.status === activeStatusTab;
  });

  // 정렬 함수
  const sortData = (data) => {
    const sorted = [...data];

    switch (sortOrder) {
      case "번호순":
        return sorted.sort((a, b) => a.id - b.id);
      
      case "최신순":
        return sorted.sort((a, b) => {
          const dateA = typeof a.date === 'number' ? a.date : parseFloat(a.date);
          const dateB = typeof b.date === 'number' ? b.date : parseFloat(b.date);
          return dateB - dateA;
        });
      
      case "오래된순":
        return sorted.sort((a, b) => {
          const dateA = typeof a.date === 'number' ? a.date : parseFloat(a.date);
          const dateB = typeof b.date === 'number' ? b.date : parseFloat(b.date);
          return dateA - dateB;
        });
      
      case "상태순":
        return sorted.sort((a, b) => {
          const orderA = STATUS_ORDER[a.status] ?? 999;
          const orderB = STATUS_ORDER[b.status] ?? 999;
          return orderA - orderB;
        });
      
      default:
        return sorted;
    }
  };

  // 정렬 적용
  const filteredData = sortData(statusFilteredData);

  // 차트 데이터는 상태 탭 필터 전 데이터 기준
  const chartData = getChartData(sortData(additionalFilteredData));

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setCurrentPage(1);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterApply = (options) => {
    setFilterOptions(options);
    setCurrentPage(1);
  };

  const handleStatusTabChange = (tab) => {
    setActiveStatusTab(tab);
    setCurrentPage(1);
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleRowClick = (row) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      navigate('/complain-detail', { state: { data: row } });
    } else {
      setFromStorage(false);
      setSelectedComplain(row);
    }
  };
  
  return (
    <div className="dashboard">

      {/* MOBILE: 내 민원 제목 + 검색 */}
      <div className="mobile-header">
        <div className="mobile-title-row">
          <h1 className="mobile-title">내 민원</h1>
          {user?.role === "처리자" && user?.dept && (
            <span className="mobile-dept-badge">{user.dept}</span>
          )}
        </div>
        <Search onSearchChange={handleSearchChange} />
      </div>

      {/* MAIN */}
      <div className="main">

        {/* LEFT: CHART AREA */}
        <div className="chart-area">

          <div className="chart-date-filters">
            <select 
              className="dropdown"
              value={selectedYear}
              onChange={handleYearChange}
            >
              <option value="전체">전체</option>
              <option value="2026">2026년</option>
            </select>

            <select 
              className="dropdown"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              <option value="전체">전체</option>
              <option value="1">1월</option>
              <option value="2">2월</option>
              <option value="3">3월</option>
              <option value="4">4월</option>
              <option value="5">5월</option>
              <option value="6">6월</option>
              <option value="7">7월</option>
              <option value="8">8월</option>
              <option value="9">9월</option>
              <option value="10">10월</option>
              <option value="11">11월</option>
              <option value="12">12월</option>
            </select>
          </div>

          <div className="chart-container">
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="95%"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {chartData.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}건`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-center-label">
              <span className="chart-center-count">{chartData.reduce((s, d) => s + d.value, 0)}</span>
              <span className="chart-center-unit">건</span>
            </div>
          </div>

          {/* 상태별 건수 */}
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

          {/* LEGEND BARS */}
          <div className="legend-bars">
            {chartData.map((item) => {
              const total = chartData.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="legend-bar-item" title={`${item.name}: ${item.value}건`}>
                  <span className="legend-bar-label" style={{ color: item.color }}>{item.name}</span>
                  <div className="legend-bar-track">
                    <div
                      className="legend-bar-fill"
                      style={{ width: `${percent}%`, background: item.color }}
                    />
                    <span className="legend-bar-tooltip">{item.value}건</span>
                  </div>
                </div>
              );
            })}
          </div>

          {user?.role === "처리자" ? (
            <button className="register-btn favorite-btn" onClick={() => handleStatusTabChange("즐겨찾기")}>
                <Star size={20} strokeWidth={2.5} />
                <span>즐겨찾기</span>
              </button>
          ) : (
            <>
              <button className="register-btn" onClick={() => setComplainFormOpen(true)}>
                <Plus size={20} strokeWidth={2.5} />
                <span>민원 작성하기</span>
              </button>
            </>
          )}

        </div>

        {/* RIGHT: TABLE SECTION */}
        <div className="table-section">

          {/* 상태 탭 */}
          <div className="table-toolbar">
            <div className="status-tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`status-tab ${activeStatusTab === tab ? "active" : ""}`}
                  onClick={() => handleStatusTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {user?.role === "처리자" && (
                <button className="storage-btn" onClick={() => setMyStorageOpen(true)}>
                  <FolderOpen size={20} />
                  <span>내 처리 현황</span>
                </button>
              )}
            <Search onSearchChange={handleSearchChange} />
          </div>

          {/* 필터/정렬 */}
          <div className="table-controls">
            <div className="controls">
              <div style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={() => setFilterOpen(!filterOpen)}>
                  <FilterIcon size={18} />
                </button>
                <Filter
                  isOpen={filterOpen}
                  onClose={() => setFilterOpen(false)}
                  onApply={handleFilterApply}
                />
              </div>
              <select 
                className="dropdown sort-dropdown"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="번호순">번호순</option>
                <option value="최신순">최신순</option>
                <option value="오래된순">오래된순</option>
                <option value="상태순">상태순</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
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
                    <tr key={row.id} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                      <td className="col-fav" onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}>
                        <Star
                          size={18}
                          className={`fav-icon ${favorites.includes(row.id) ? "fav-active" : ""}`}
                          fill={favorites.includes(row.id) ? "#FFD23F" : "none"}
                          color={favorites.includes(row.id) ? "#FFD23F" : "#ccc"}
                        />
                      </td>
                      <td>{row.id}</td>
                      {user?.role !== "처리자" && <td className="col-category">{row.category}</td>}
                      <td className="title">{row.title}</td>
                      <td>
                        <Status status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              <span className="pagination-info">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                &gt;
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* FAB */}
      <div className="fab">
        {user?.role === "처리자" ? (
          <button className="fab-btn" onClick={() => setMyStorageOpen(true)}>
            <FolderOpen size={40} />
          </button>
        ) : (
          <button className="fab-btn" onClick={() => setComplainFormOpen(true)}>
            <Plus size={40} />
          </button>
        )}
      </div>

      {/* 민원 접수 팝업 */}
      <ComplainForm
        isOpen={complainFormOpen}
        onClose={() => setComplainFormOpen(false)}
        onSubmit={(data) => {
          setComplainFormOpen(false);
        }}
      />

      {/* 내 보관함 팝업 (처리자) */}
      <MyStorage
        isOpen={myStorageOpen}
        onClose={() => setMyStorageOpen(false)}
        data={tableData.filter((row) => String(row.resultPersonId) === String(user?.id))}
        onSelect={(row) => {
          setFromStorage(true);
          setSelectedComplain(row);
        }}
      />

      {/* 민원 상세 팝업 (데스크톱) */}
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
