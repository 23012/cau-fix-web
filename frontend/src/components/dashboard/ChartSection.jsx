import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_TABS, STATUS_COLORS } from "../../constants/status";
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

const toInputFormat = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const ChartSection = ({ data, onFavoriteClick, onDateRangeChange }) => {
  const today = new Date();
  const currentYearString = today.getFullYear().toString();
  const currentMonthString = (today.getMonth() + 1).toString();

  const [selectedYear, setSelectedYear] = useState(currentYearString);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString);
  const [startDate, setStartDate] = useState(
    toInputFormat(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [endDate, setEndDate] = useState(
    toInputFormat(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  );

  // 연/월 변경 시 날짜 범위 자동 동기화
  useEffect(() => {
    if (selectedYear === "전체") {
      setStartDate("");
      setEndDate("");
      onDateRangeChange?.("", "");
      return;
    }
    const y = parseInt(selectedYear, 10);
    let newStart, newEnd;
    if (selectedMonth === "전체") {
      newStart = toInputFormat(new Date(y, 0, 1));
      newEnd = toInputFormat(new Date(y, 12, 0));
    } else {
      const m = parseInt(selectedMonth, 10) - 1;
      newStart = toInputFormat(new Date(y, m, 1));
      newEnd = toInputFormat(new Date(y, m + 1, 0));
    }
    setStartDate(newStart);
    setEndDate(newEnd);
    onDateRangeChange?.(newStart, newEnd);
  }, [selectedYear, selectedMonth]);

  // 날짜 범위로 data 필터링
  const filteredData = data.filter((row) => {
    if (!row.date) return false;
    const d = parseExcelDate(row.date);
    if (!d) return false;
    if (startDate && d < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const chartData = getChartData(filteredData);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-area">
      <div className="chart-date-filters">
        <input
          type="date"
          className="dropdown"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); onDateRangeChange?.(e.target.value, endDate); }}
        />
        <span>~</span>
        <input
          type="date"
          className="dropdown"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); onDateRangeChange?.(startDate, e.target.value); }}
        />
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
              <Tooltip formatter={(value, name) => [`${value}건`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-center-label">
          <span
            className="chart-center-count"
            style={{
              fontSize:
                total >= 1000
                  ? "clamp(20px, 3.5vw, 40px)"
                  : total >= 100
                  ? "clamp(26px, 4vw, 50px)"
                  : "clamp(32px, 5vw, 60px)",
            }}
          >
            {total}
          </span>
          <span className="chart-center-unit">건</span>
        </div>
      </div>

      <div className="chart-status-summary">
        {chartData.map((item) => (
          <span key={item.name} className="chart-status-item">
            <span className="chart-status-dot" style={{ background: item.color }} />
            <span className="chart-status-name">{item.name}</span>
            <span className="chart-status-count" style={{ color: item.color }}>
              {item.value}
            </span>
          </span>
        ))}
      </div>

      <hr className="chart-divider" />

      <div className="legend-bars">
        {chartData.map((item) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.name}
              className="legend-bar-item"
              title={`${item.name}: ${item.value}건`}
            >
              <span className="legend-bar-label" style={{ color: item.color }}>
                {item.name}
              </span>
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

      <button className="favorite-btn" onClick={onFavoriteClick}>
        <Star size={20} strokeWidth={2.5} />
        <span>즐겨찾기</span>
      </button>
    </div>
  );
};

export default ChartSection;
