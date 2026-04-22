import { useState } from "react";
import { CATEGORIES } from "../../constants/categories";
import "./filter.css";

const Filter = ({ isOpen, onClose, onApply }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState({ year: "", month: "", day: "" });
  const [endDate, setEndDate] = useState({ year: "", month: "", day: "" });

  const handleApply = () => {
    onApply({
      statuses: [],
      category: selectedCategory,
      startDate,
      endDate,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategory("");
    setStartDate({ year: "", month: "", day: "" });
    setEndDate({ year: "", month: "", day: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3 className="filter-title">분류</h3>
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">전체</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">기간</h3>
        <div className="filter-date-range">
          <div className="filter-date-inputs">
            <input
              type="text"
              placeholder="년"
              maxLength="4"
              value={startDate.year}
              onChange={(e) => setStartDate({ ...startDate, year: e.target.value })}
              className="filter-date-input"
            />
            <span>/</span>
            <input
              type="text"
              placeholder="월"
              maxLength="2"
              value={startDate.month}
              onChange={(e) => setStartDate({ ...startDate, month: e.target.value })}
              className="filter-date-input"
            />
            <span>/</span>
            <input
              type="text"
              placeholder="일"
              maxLength="2"
              value={startDate.day}
              onChange={(e) => setStartDate({ ...startDate, day: e.target.value })}
              className="filter-date-input"
            />
          </div>
          <span className="filter-date-separator">~</span>
          <div className="filter-date-inputs">
            <input
              type="text"
              placeholder="년"
              maxLength="4"
              value={endDate.year}
              onChange={(e) => setEndDate({ ...endDate, year: e.target.value })}
              className="filter-date-input"
            />
            <span>/</span>
            <input
              type="text"
              placeholder="월"
              maxLength="2"
              value={endDate.month}
              onChange={(e) => setEndDate({ ...endDate, month: e.target.value })}
              className="filter-date-input"
            />
            <span>/</span>
            <input
              type="text"
              placeholder="일"
              maxLength="2"
              value={endDate.day}
              onChange={(e) => setEndDate({ ...endDate, day: e.target.value })}
              className="filter-date-input"
            />
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button className="filter-reset-btn" onClick={handleReset}>
          초기화
        </button>
        <button className="filter-apply-btn" onClick={handleApply}>
          적용
        </button>
      </div>
    </div>
  );
};

export default Filter;
