import "./AdminDashboard.css";
import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import sampleFile from "../../assets/files/sample.xlsx";
import { CATEGORIES } from "../../constants/categories";
import useCategories from "../../hooks/useCategories";
import { STATUS_COLORS, normalizeStatus } from "../../constants/status";

/**
 * 관리자 대시보드 (카테고리별 통계 + 차트)
 * TODO: 백엔드 연결 시 Excel 로딩을 GET /api/dashboard/stats?year={}&month={} 로 교체
 */

/** complain_at 값을 Date 객체로 변환 */
const parseRowDate = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === "number") {
    return new Date((raw - 25569) * 86400 * 1000);
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

/** Date → input[type=date] 형식 "YYYY-MM-DD" */
const toInputFormat = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const AdminDashboard = () => {
  const { categories: apiCategories } = useCategories();
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);

  // 초기값: 현재 월의 첫날 ~ 마지막날
  const today = new Date();
  const [startDate, setStartDate] = useState(
    toInputFormat(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [endDate, setEndDate] = useState(
    toInputFormat(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  );

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
          title: row["complain_title"] || "",
          content: row["complain_content"] || "",
        }));

        setTableData(parsed);
      } catch (error) {
        // 로드 실패
      }
    };
    loadExcel();
  }, []);

  // 날짜 범위 + 상태 + 검색어로만 필터링
  const filteredData = useMemo(() => {
    const rangeStart = startDate ? new Date(startDate) : null;
    const rangeEnd = endDate ? new Date(endDate) : null;
    if (rangeEnd) rangeEnd.setHours(23, 59, 59, 999);

    return tableData.filter((row) => {
      // 상태 필터
      if (statusFilter !== "전체" && row.status !== statusFilter) return false;

      // 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !row.title?.toLowerCase().includes(q) &&
          !row.content?.toLowerCase().includes(q)
        )
          return false;
      }

      // 날짜 범위 필터
      const dateObj = parseRowDate(row.date);
      if (!dateObj) return false;
      if (rangeStart && dateObj < rangeStart) return false;
      if (rangeEnd && dateObj > rangeEnd) return false;

      return true;
    });
  }, [tableData, statusFilter, searchQuery, startDate, endDate]);

  const totalCount = filteredData.length;
  const pendingCount = filteredData.filter(
    (r) => r.status === "접수전" || r.status === "접수중"
  ).length;
  const progressCount = filteredData.filter((r) => r.status === "진행중").length;
  const doneCount = filteredData.filter((r) => r.status === "완료").length;

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    const catNames = apiCategories.length > 0
      ? apiCategories.map((c) => c.category_name)
      : CATEGORIES;
    return catNames.map((cat) => {
      const items = filteredData.filter((r) => r.category === cat);
      return {
        name: cat,
        total: items.length,
        pending: items.filter(
          (r) => r.status === "접수전" || r.status === "접수중"
        ).length,
        progress: items.filter((r) => r.status === "진행중").length,
        done: items.filter((r) => r.status === "완료").length,
      };
    });
  }, [filteredData, apiCategories]);

  const chartColors = [
    STATUS_COLORS["접수중"],
    STATUS_COLORS["진행중"],
    STATUS_COLORS["완료"],
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">대시보드</h1>

        {/* 날짜 범위 필터 */}
        <div className="admin-dashboard-filters">
          <div className="admin-filters-row">
            <input
              type="date"
              className="admin-date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span>~</span>
            <input
              type="date"
              className="admin-date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* 통계 기간 명시 */}
      <div className="admin-dashboard-period">
        * {startDate || "시작일"} ~ {endDate || "종료일"}
      </div>

      {/* 상단 카드 */}
      <div className="admin-stat-cards">
        <div className="admin-stat-card blue">
          <span className="admin-stat-label">전체</span>
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
      <h2 className="admin-section-title">상세 현황</h2>
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
      <div className="admin-chart-legend">
        <span className="admin-legend-item">
          <span className="admin-legend-dot" style={{ background: chartColors[0] }} />
          미진행
        </span>
        <span className="admin-legend-item">
          <span className="admin-legend-dot" style={{ background: chartColors[1] }} />
          진행중
        </span>
        <span className="admin-legend-item">
          <span className="admin-legend-dot" style={{ background: chartColors[2] }} />
          완료
        </span>
      </div>
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
              <span className="admin-chart-label">{cat.name}</span>
              <div className="admin-chart-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        hasData
                          ? chartData
                          : [{ name: "없음", value: 1, color: "#e0e0e0" }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="100%"
                      dataKey="value"
                      paddingAngle={hasData ? 2 : 0}
                    >
                      {(hasData ? chartData : [{ color: "#e0e0e0" }]).map(
                        (item, i) => (
                          <Cell key={i} fill={item.color} />
                        )
                      )}
                    </Pie>
                    {hasData && (
                      <Tooltip formatter={(v, n) => [`${v}건`, n]} />
                    )}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
