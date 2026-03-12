import "./complain.css";
import { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assests/files/sample.xlsx";

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
          date: row["접수시간"]?.toString() || "",
        }));

        setTableData(parsed);
      } catch (error) {
        console.error("Excel 로드 실패:", error);
        // 더미 데이터
        setTableData([
          { id: 1, title: "출입문 지지대 제목 요청", status: "접수전", date: "2026-03-01" },
          { id: 2, title: "에어컨 고장", status: "접수", date: "2026-03-02" },
          { id: 3, title: "화장실 수건 걸이 발견", status: "진행중", date: "2026-03-03" },
          { id: 4, title: "자동문 센서 고장", status: "완료", date: "2026-03-04" },
          { id: 5, title: "정수기 온수 장치 교체", status: "완료", date: "2026-03-05" },
        ]);
      }
    };

    loadExcel();
  }, []);

  const chartData = getChartData(tableData);

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header">
        <h1>내 민원</h1>

        <button className="icon-btn">
          <Search size={24} />
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">

        <div className="filters">
          <select 
            className="dropdown"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
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
            onChange={(e) => setSelectedMonth(e.target.value)}
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
          <button className="icon-btn">
            <Filter size={18} />
          </button>
          
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

              {tableData.map((row) => (
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