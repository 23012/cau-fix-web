import { useState, useEffect, useMemo } from "react";
import { STATUS_ORDER } from "../constants/status";
import { parseExcelDate } from "../utils/parseExcelDate";

const useComplainFilter = (tableData) => {
  const [user, setUser] = useState(null);
  const [sortOrder, setSortOrder] = useState("최신순");
  const [selectedYear, setSelectedYear] = useState("전체");
  const [selectedMonth, setSelectedMonth] = useState("전체");
  const [activeStatusTab, setActiveStatusTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    category: "",
    startDate: { year: "", month: "", day: "" },
    endDate: { year: "", month: "", day: "" },
  });
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const sortData = (data) => {
    // 날짜 문자열("2026-08-10 03:59:56")·엑셀 시리얼 모두 안전하게 타임스탬프로 변환.
    // (기존 parseFloat은 문자열에서 연도만 뽑혀 정렬이 안 됐음)
    const toTime = (d) => {
      const dt = parseExcelDate(d);
      return dt ? dt.getTime() : 0;
    };
    const sorted = [...data];
    switch (sortOrder) {
      case "번호순": return sorted.sort((a, b) => a.id - b.id);
      case "최신순": return sorted.sort((a, b) => toTime(b.date) - toTime(a.date));
      case "오래된순": return sorted.sort((a, b) => toTime(a.date) - toTime(b.date));
      case "상태순": return sorted.sort((a, b) => (STATUS_ORDER[a.status] ?? 999) - (STATUS_ORDER[b.status] ?? 999));
      default: return sorted;
    }
  };

  const filteredData = useMemo(() => {
    let data = tableData;

    // 날짜 필터
    if (selectedYear !== "전체" || selectedMonth !== "전체") {
      data = data.filter((row) => {
        const dateObj = parseExcelDate(row.date);
        if (!dateObj) return false;
        if (selectedYear !== "전체" && dateObj.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth !== "전체" && (dateObj.getMonth() + 1).toString() !== selectedMonth) return false;
        return true;
      });
    }

    // 검색
    if (searchQuery.trim()) {
      data = data.filter((row) => row.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 추가 필터
    data = data.filter((row) => {
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

    return data;
  }, [tableData, user, selectedYear, selectedMonth, searchQuery, filterOptions]);

  // 상태탭 적용 전 데이터 (차트용)
  const chartBaseData = useMemo(() => sortData(filteredData), [filteredData, sortOrder]);

  // 상태탭 적용 후 데이터 (테이블용)
  const statusFilteredData = useMemo(() => {
    let data = filteredData;
    if (activeStatusTab === "즐겨찾기") data = data.filter((row) => favorites.includes(row.id));
    else if (activeStatusTab !== "전체") data = data.filter((row) => row.status === activeStatusTab);
    return sortData(data);
  }, [filteredData, activeStatusTab, favorites, sortOrder]);

  const totalPages = Math.ceil(statusFilteredData.length / itemsPerPage);
  const currentData = statusFilteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (query) => { setSearchQuery(query); setCurrentPage(1); };
  const handleYearChange = (e) => { setSelectedYear(e.target.value); setCurrentPage(1); };
  const handleMonthChange = (e) => { setSelectedMonth(e.target.value); setCurrentPage(1); };
  const handleFilterApply = (options) => { setFilterOptions(options); setCurrentPage(1); };
  const handleStatusTabChange = (tab) => { setActiveStatusTab(prev => prev === tab ? "전체" : tab); setCurrentPage(1); };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  return {
    user, sortOrder, setSortOrder,
    selectedYear, selectedMonth,
    activeStatusTab, currentPage, setCurrentPage,
    favorites, totalPages, currentData, itemsPerPage, totalCount: statusFilteredData.length,
    chartBaseData, statusFilteredData,
    handleSearchChange, handleYearChange, handleMonthChange,
    handleFilterApply, handleStatusTabChange, toggleFavorite,
  };
};

export default useComplainFilter;
