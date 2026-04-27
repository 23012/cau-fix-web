import "./AdminDashboard.css";
import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assets/files/sample.xlsx";
import { CATEGORIES } from "../../constants/categories";
import { STATUS_COLORS, normalizeStatus } from "../../constants/status";

/**
 * 관리자 대시보드 (카테고리별 통계 + 차트)
 * TODO: 백엔드 연결 시 Excel 로딩을 GET /api/dashboard/stats?year={}&month={} 로 교체
 */
const AdminDashboard = () => {
  const [tableData, setTableData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState("전체");

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch(sampleFile);
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets["민원"];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          id: row["complain_id"],
          category: row["category_id"] || "",
          status: normalizeStatus(row["state"] || ""),
          date: row["complain_at"],
        }));

        setTableData(parsed);
      } catch (error) {
        // 로드 실패
      }
    };
    loadExcel();
  }, []);

  // 날짜 필터링
  const filteredData = useMemo(() => {
    return tableData.filter((row) => {
      if (!row.date) return false;
      const excelDate = typeof row.date === "number" ? row.date : parseFloat(row.date);
      if (isNaN(excelDate)) return false;
      const dateObj = new Date((excelDate - 25569) * 86400 * 1000);
      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString();
      if (selectedYear !== "전체" && year !== selectedYear) return false;
      if (selectedMonth !== "전체" && month !== selectedMonth) return false;
      return true;
    });
  }, [tableData, selectedYear, selectedMonth]);

  const totalCount = filteredData.length;
  const pendingCount = filteredData.filter((r) => r.status === "접수전" || r.status === "접수중").length;
  const progressCount = filteredData.filter((r) => r.status === "진행중").length;
  const doneCount = filteredData.filter((r) => r.status === "완료").length;

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = filteredData.filter((r) => r.category === cat);
      return {
        name: cat,
        total: items.length,
        pending: items.filter((r) => r.status === "접수전" || r.status === "접수중").length,
        progress: items.filter((r) => r.status === "진행중").length,
        done: items.filter((r) => r.status === "완료").length,
      };
    });
  }, [filteredData]);

  const chartColors = [STATUS_COLORS["접수중"], STATUS_COLORS["진행중"], STATUS_COLORS["완료"]];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">
          <span className="admin-dashboard-icon">📊</span>
          대시보드
        </h1>
        <div className="admin-dashboard-filters">
          <select
            className="admin-dropdown"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="전체">전체</option>
            {[2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="admin-dropdown"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="전체">전체</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* 상단 카드 */}
      <div className="admin-stat-cards">
        <div className="admin-stat-card blue">
          <span className="admin-stat-label">{selectedMonth !== "전체" ? `${selectedMonth}월` : ""} 전체</span>
          <span className="admin-stat-value">{totalCount}</span>
        </div>
        <div className="admin-stat-card pink">
          <span className="admin-stat-label">미진행</span>
          <span className="admin-stat-value">{pendingCount}</span>
        </div>
        <div className="admin-stat-card yellow">
          <span className="admin-stat-label">진행중</span>
          <span className="admin-stat-value">{progressCount}</span>
        </div>
        <div className="admin-stat-card green">
          <span className="admin-stat-label">완료</span>
          <span className="admin-stat-value">{doneCount}</span>
        </div>
      </div>

      {/* 카테고리별 상세 현황 */}
      <h2 className="admin-section-title">
        {selectedMonth !== "전체" ? `${selectedMonth}월` : ""} 상세 현황
      </h2>
      <div className="admin-category-cards">
        {categoryStats.map((cat) => (
          <div key={cat.name} className="admin-category-card">
            <h3 className="admin-category-name">{cat.name}</h3>
            <div className="admin-category-stats">
              <div>전체: {cat.total}</div>
              <div>미진행: {cat.pending}</div>
              <div>진행중: {cat.progress}</div>
              <div>완료: {cat.done}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 통계 차트 */}
      <h2 className="admin-section-title">통계 차트</h2>
      <div className="admin-chart-grid">
        {categoryStats.map((cat) => {
          const chartData = [
            { name: "미진행", value: cat.pending, color: chartColors[0] },
            { name: "진행중", value: cat.progress, color: chartColors[1] },
            { name: "완료", value: cat.done, color: chartColors[2] },
          ];
          const hasData = cat.total > 0;

          return (
            <div key={cat.name} className="admin-chart-item">
              <div className="admin-chart-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hasData ? chartData : [{ name: "없음", value: 1, color: "#e0e0e0" }]}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="100%"
                      dataKey="value"
                      paddingAngle={hasData ? 2 : 0}
                    >
                      {(hasData ? chartData : [{ color: "#e0e0e0" }]).map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Pie>
                    {hasData && <Tooltip formatter={(v, n) => [`${v}건`, n]} />}
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <span className="admin-chart-label">{cat.name}</span>
            </div>
          );
        })}

        {/* 범례 */}
        <div className="admin-chart-legend">
          <span className="admin-legend-item">
            <span className="admin-legend-dot" style={{ background: chartColors[0] }} />미진행
          </span>
          <span className="admin-legend-item">
            <span className="admin-legend-dot" style={{ background: chartColors[1] }} />진행중
          </span>
          <span className="admin-legend-item">
            <span className="admin-legend-dot" style={{ background: chartColors[2] }} />완료
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
