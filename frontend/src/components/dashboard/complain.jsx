import "./complain.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter as FilterIcon, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assets/files/sample.xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import Search from "../common/search";
import Filter from "../common/filter";
import Status from "../common/Status";
import ComplainForm from "../form/ComplainForm";

import Detail from "../detail/detail";

const getChartData = (data) => {
  const counts = data.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  return [
    { name: "접수전", value: counts["접수전"] || 0, color: "#9e9e9e" },
    { name: "접수", value: counts["접수"] || 0, color: "#FFC107" },
    { name: "진행중", value: counts["진행중"] || 0, color: "#63BE7B" },
    { name: "완료", value: counts["완료"] || 0, color: "#006EB7" },
  ];
};

const STATUS_TABS = ["전체", "접수전", "접수", "진행중", "완료"];

const Complain = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [sortOrder, setSortOrder] = useState("번호순");
  const [selectedYear, setSelectedYear] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [activeStatusTab, setActiveStatusTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [complainFormOpen, setComplainFormOpen] = useState(false);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    category: "",
    startDate: { year: "", month: "", day: "" },
    endDate: { year: "", month: "", day: "" },
  });
  const itemsPerPage = 10;

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
        loginRows.forEach((row) => {
          const name = row["name"]?.toString();
          if (name) {
            memberMap[name] = {
              department: row["department"]?.toString() || null,
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
          resultMap[row["번호"]] = {
            resultContent: row["처리 내용"],
            resultPerson: row["처리자"],
            resultDate: row["처리시간"]
          };
        });

        const parsed = complainRows.map((row) => ({
          id: row["번호"],
          dept: row["부서"],
          category: row["분류"],
          title: row["제목"],
          content: row["민원 내용"],
          result: resultMap[row["번호"]]?.resultContent || null,
          resultPerson: resultMap[row["번호"]]?.resultPerson || null,
          resultDate: resultMap[row["번호"]]?.resultDate || null,
          resultDept: memberMap[resultMap[row["번호"]]?.resultPerson]?.department || null,
          resultPhone: memberMap[resultMap[row["번호"]]?.resultPerson]?.phone || null,
          location: row["장소"],
          status: row["상태"],
          date: row["접수시간"],
          image: row["사진"],
        }));

        setTableData(parsed);
      } catch (error) {
        // Excel 로드 실패 시 빈 데이터 유지
      }
    };

    loadExcel();
  }, []);

  // 날짜 필터링 함수
  const filterByDate = (data) => {
    const result = data.filter((row) => {
      if (selectedYear === "전체" && selectedMonth === "전체") {
        return true;
      }

      if (!row.date) return false;

      let dateObj;
      
      if (typeof row.date === 'number' || !isNaN(parseFloat(row.date))) {
        const excelDate = typeof row.date === 'number' ? row.date : parseFloat(row.date);
        dateObj = new Date((excelDate - 25569) * 86400 * 1000);
      } else {
        const dateStr = row.date.toString().trim();
        const datePart = dateStr.split(' ')[0];
        dateObj = new Date(datePart);
      }

      if (isNaN(dateObj.getTime())) return false;

      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString();

      if (selectedYear !== "전체" && year !== selectedYear) return false;
      if (selectedMonth !== "전체" && month !== selectedMonth) return false;

      return true;
    });
    
    return result;
  };

  // 날짜 필터링 적용
  const dateFilteredData = filterByDate(tableData);

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
      const excelDate = typeof row.date === 'number' ? row.date : parseFloat(row.date);
      const rowDate = new Date((excelDate - 25569) * 86400 * 1000);
      
      if (rowDate < start) return false;
    }

    if (endDate.year && endDate.month && endDate.day) {
      const end = new Date(endDate.year, endDate.month - 1, endDate.day, 23, 59, 59);
      const excelDate = typeof row.date === 'number' ? row.date : parseFloat(row.date);
      const rowDate = new Date((excelDate - 25569) * 86400 * 1000);
      
      if (rowDate > end) return false;
    }

    return true;
  });

  // 상태 탭 필터 적용
  const statusFilteredData = additionalFilteredData.filter((row) => {
    if (activeStatusTab === "전체") return true;
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
        const statusOrder = { "접수전": 0, "접수": 1, "진행중": 2, "완료": 3 };
        return sorted.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 999;
          const orderB = statusOrder[b.status] ?? 999;
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

  const handleRowClick = (row) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      navigate('/complain-detail', { state: { data: row } });
    } else {
      setSelectedComplain(row);
    }
  };
  
  return (
    <div className="dashboard">

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
              <option value="2025">2025년</option>
              <option value="2024">2024년</option>
              <option value="2023">2023년</option>
              <option value="2022">2022년</option>
              <option value="2021">2021년</option>
              <option value="2020">2020년</option>
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
                    innerRadius="55%"
                    outerRadius="85%"
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

          {/* LEGEND BARS */}
          <div className="legend-bars">
            {chartData.map((item) => {
              const total = chartData.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.name} className="legend-bar-item">
                  <span className="legend-bar-label" style={{ color: item.color }}>{item.name}</span>
                  <div className="legend-bar-track">
                    <div
                      className="legend-bar-fill"
                      style={{ width: `${percent}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button className="register-btn" onClick={() => setComplainFormOpen(true)}>
            <Plus size={18} />
            <span>등록하기</span>
          </button>

        </div>

        {/* RIGHT: TABLE SECTION */}
        <div className="table-section">

          {/* 상태 탭 + 필터/정렬 */}
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
            <div className="controls">
              <Search onSearchChange={handleSearchChange} />
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
                    <th>번호</th>
                    <th className="col-category">분류</th>
                    <th>제목</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row) => (
                    <tr key={row.id} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                      <td>{row.id}</td>
                      <td className="col-category">{row.category}</td>
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
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                <span className="pagination-info">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MOBILE TOOLBAR (년/월 + 필터/정렬) */}
      <div className="mobile-toolbar">
        <div className="filters">
          <select 
            className="dropdown"
            value={selectedYear}
            onChange={handleYearChange}
          >
            <option value="전체">전체</option>
            <option value="2026">2026년</option>
            <option value="2025">2025년</option>
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="2022">2022년</option>
            <option value="2021">2021년</option>
            <option value="2020">2020년</option>
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
        <div className="controls">
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setFilterOpen(!filterOpen)}>
              <FilterIcon size={18} />
            </button>
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

      {/* FAB */}
      <div className="fab">
        <button className="fab-btn" onClick={() => setComplainFormOpen(true)}>
          <Plus size={40} />
        </button>
      </div>

      {/* 민원 접수 팝업 */}
      <ComplainForm
        isOpen={complainFormOpen}
        onClose={() => setComplainFormOpen(false)}
        onSubmit={(data) => {
          setComplainFormOpen(false);
        }}
      />

      {/* 민원 상세 팝업 (데스크톱) */}
      <Detail
        isOpen={!!selectedComplain}
        onClose={() => setSelectedComplain(null)}
        data={selectedComplain}
        onUpdate={(updated) => {
          setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setSelectedComplain(null);
        }}
      />

    </div>
  );
};

export default Complain;
