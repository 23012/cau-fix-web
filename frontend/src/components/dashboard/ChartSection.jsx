import { Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_TABS, STATUS_COLORS } from "../../constants/status";

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

const ChartSection = ({ data, selectedYear, selectedMonth, onYearChange, onMonthChange, onFavoriteClick }) => {
  const chartData = getChartData(data);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-area">
      <div className="chart-date-filters">
        <select className="dropdown" value={selectedYear} onChange={onYearChange}>
          <option value="전체">전체</option>
          <option value="2026">2026년</option>
        </select>
        <select className="dropdown" value={selectedMonth} onChange={onMonthChange}>
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
          <span className="chart-center-count">{total}</span>
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

      <button className="favorite-btn" onClick={onFavoriteClick}>
        <Star size={20} strokeWidth={2.5} /><span>즐겨찾기</span>
      </button>
    </div>
  );
};

export default ChartSection;
