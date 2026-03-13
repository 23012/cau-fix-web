import "./complain.css";
import { useState, useEffect } from "react";
import { Filter as FilterIcon, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assests/files/sample.xlsx";
import Search from "../common/search";
import Filter from "../common/filter";

const statusClass = (status) => {
  switch (status) {
    case "접수전":
      return "status pending";
    case "접수":
      return "status received";
    case "진행중":
      return "status progress";
    case "완료":
      return "status done";
    default:
      return "status";
  }
};

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

const Complain = () => {
  const [tableData, setTableData] = useState([]);
  const [sortOrder, setSortOrder] = useState("번호순");
  const [selectedYear, setSelectedYear] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
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
        const res = await fetch(sampleFile);
        const buffer = await res.arrayBuffer();

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          id: row["번호"],
          dept: row["부서"],
          category: row["분류"],
          title: row["제목"],
          content: row["민원 내용"],
          result: row["처리 내용"],
          location: row["장소"],
          status: row["상태"],
          date: row["접수시간"], // 원본 그대로 저장 (숫자 또는 문자열)
        }));

        setTableData(parsed);
      } catch (error) {
        console.error("Excel 로드 실패:", error);
      }
    };

    loadExcel();
  }, []);

  // 날짜 필터링 함수
  const filterByDate = (data) => {
    console.log("=== 필터링 시작 ===");
    console.log("선택된 연도:", selectedYear, "선택된 월:", selectedMonth);
    
    const result = data.filter((row, index) => {
      // 전체 선택 시 모두 통과
      if (selectedYear === "전체" && selectedMonth === "전체") {
        return true;
      }

      // date가 없으면 제외
      if (!row.date) {
        if (index < 3) console.log(`Row ${row.id}: 날짜 없음`);
        return false;
      }

      let dateObj;
      
      // Excel 숫자 형식인지 확인 (46082.375 같은 형식)
      if (typeof row.date === 'number' || !isNaN(parseFloat(row.date))) {
        // Excel 날짜를 JavaScript Date로 변환
        // Excel은 1900년 1월 1일을 1로 시작 (실제로는 1899년 12월 30일)
        const excelDate = typeof row.date === 'number' ? row.date : parseFloat(row.date);
        dateObj = new Date((excelDate - 25569) * 86400 * 1000);
        
        if (index < 3) {
          console.log(`Row ${row.id}: Excel 숫자="${row.date}" → 변환="${dateObj.toISOString()}"`);
        }
      } else {
        // 문자열 형식 처리
        const dateStr = row.date.toString().trim();
        if (index < 3) console.log(`Row ${row.id}: 문자열="${dateStr}"`);
        
        const datePart = dateStr.split(' ')[0];
        dateObj = new Date(datePart);
      }

      // 유효한 날짜인지 확인
      if (isNaN(dateObj.getTime())) {
        if (index < 3) console.log(`Row ${row.id}: 유효하지 않은 날짜`);
        return false;
      }

      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString();
      
      if (index < 3) console.log(`Row ${row.id}: year="${year}", month="${month}"`);

      // 연도 필터
      if (selectedYear !== "전체" && year !== selectedYear) {
        if (index < 3) console.log(`Row ${row.id}: 연도 불일치`);
        return false;
      }

      // 월 필터
      if (selectedMonth !== "전체" && month !== selectedMonth) {
        if (index < 3) console.log(`Row ${row.id}: 월 불일치`);
        return false;
      }

      if (index < 3) console.log(`Row ${row.id}: 통과!`);
      return true;
    });
    
    console.log("필터링 결과:", result.length, "개");
    return result;
  };

  // 날짜 필터링 적용
  const dateFilteredData = filterByDate(tableData);
  console.log("날짜 필터링 후:", dateFilteredData.length, "개");

  // 검색 필터링
  const searchFilteredData = dateFilteredData.filter((row) => {
    if (searchQuery.trim() === "") return true;
    return row.title.toLowerCase().includes(searchQuery.toLowerCase());
  });
  console.log("검색 필터링 후:", searchFilteredData.length, "개");

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

  // 정렬 함수
  const sortData = (data) => {
    const sorted = [...data]; // 원본 배열 복사

    switch (sortOrder) {
      case "번호순":
        return sorted.sort((a, b) => a.id - b.id);
      
      case "최신순":
        return sorted.sort((a, b) => {
          // Excel 숫자 형식 비교
          const dateA = typeof a.date === 'number' ? a.date : parseFloat(a.date);
          const dateB = typeof b.date === 'number' ? b.date : parseFloat(b.date);
          return dateB - dateA; // 내림차순 (최신이 위)
        });
      
      case "오래된순":
        return sorted.sort((a, b) => {
          const dateA = typeof a.date === 'number' ? a.date : parseFloat(a.date);
          const dateB = typeof b.date === 'number' ? b.date : parseFloat(b.date);
          return dateA - dateB; // 오름차순 (오래된 것이 위)
        });
      
      case "상태순":
        // 접수전(0), 접수(1), 진행중(2), 완료(3) 순서
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
  const filteredData = sortData(additionalFilteredData);

  // 차트 데이터는 필터링된 데이터 기준
  const chartData = getChartData(filteredData);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);
  console.log("현재 페이지 데이터:", currentData.length, "개");

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

  //DB 연결 작업 필요
  
  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header">
        <h1>내 민원</h1>
        <Search onSearchChange={handleSearchChange} />
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">

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

      {/* MAIN */}
      <div className="main">

        {/* CHART */}
        <div className="chart-card">

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

          {/* LEGEND */}
          <div className="legend">
            {chartData.map((item) => (
              <div key={item.name} className="legend-item">

                <span
                  className="legend-dot"
                  style={{ background: item.color }}
                />

                <span>{item.name}</span>

                <span className="legend-value">
                  {item.value}
                </span>

              </div>
            ))}
          </div>

        </div>

        {/* TABLE */}
        <div className="table-wrapper">

          <table className="table">

            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>상태</th>
              </tr>
            </thead>

            <tbody>

              {currentData.map((row) => (
                <tr key={row.id}>

                  <td>{row.id}</td>

                  <td className="title">
                    {row.title}
                  </td>

                  <td>
                    <span className={statusClass(row.status)}>
                      {row.status}
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

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

      {/* FAB */}
      <div className="fab">

        <button className="fab-btn">
          <Plus size={26} />
        </button>

      </div>

    </div>
  );
};

export default Complain;