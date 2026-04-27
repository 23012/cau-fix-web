import "./AdminTable.css";
import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import useComplainData from "../../hooks/useComplainData";
import { CATEGORIES } from "../../constants/categories";
import { STATUSES } from "../../constants/status";
import { formatDate } from "../../utils/formatDate";
import Status from "../common/Status";
import Detail from "../detail/detail";

const AdminComplainList = () => {
  const { tableData, setTableData } = useComplainData();
  const [statusFilter, setStatusFilter] = useState("전체");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("번호순");
  const itemsPerPage = 15;

  /* 필터 + 정렬 */
  const filteredData = useMemo(() => {
    const result = tableData.filter((row) => {
      if (statusFilter !== "전체" && row.status !== statusFilter) return false;
      if (categoryFilter !== "전체" && row.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!row.title.toLowerCase().includes(q) && !row.content?.toLowerCase().includes(q)) return false;
      }
      if (startDate || endDate) {
        const { parseExcelDate } = require("../../utils/parseExcelDate");
        const d = parseExcelDate(row.date);
        if (!d) return false;
        if (startDate && d < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59);
          if (d > end) return false;
        }
      }
      return true;
    });

    const sorted = [...result];
    switch (sortOrder) {
      case "번호순": sorted.sort((a, b) => a.id - b.id); break;
      case "최신순": sorted.sort((a, b) => b.id - a.id); break;
      case "오래된순": sorted.sort((a, b) => a.id - b.id); break;
      case "상태순": {
        const order = { "접수전": 0, "접수중": 1, "진행중": 2, "완료": 3 };
        sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
        break;
      }
      default: sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [tableData, statusFilter, categoryFilter, searchQuery, startDate, endDate, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* TODO: 백엔드 연결 시 XLSX.writeFile 대신 GET /api/complains?export=excel 호출 */
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((r) => ({
      "신고번호": r.id, "부서명": r.dept, "장소": r.location,
      "접수시간": formatDate(r.date), "민원분류": r.category,
      "제목": r.title, "민원내용": r.content,
      "처리내용": r.result || "", "상태": r.status,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "민원리스트");
    XLSX.writeFile(wb, "민원리스트.xlsx");
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">📋 민원 리스트</h1>

      {/* 필터 영역 */}
      <div className="admin-filters">
        <div className="admin-filters-left">
          <div className="admin-tabs">
            <label className={statusFilter === "전체" ? "active" : ""}>
              <input type="radio" name="status" value="전체" checked={statusFilter === "전체"} onChange={() => { setStatusFilter("전체"); setCurrentPage(1); }} />
              전체
            </label>
            {STATUSES.map((s) => (
              <label key={s} className={statusFilter === s ? "active" : ""}>
                <input type="radio" name="status" value={s} checked={statusFilter === s} onChange={() => { setStatusFilter(s); setCurrentPage(1); }} />
                {s}
              </label>
            ))}
          </div>

          <select className="admin-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
            <option value="전체">전체 분류</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="text" className="admin-search" placeholder="제목" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
        </div>

        <div className="admin-filters-right">
          <select className="admin-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
            <option value="상태순">상태순</option>
          </select>
          <input type="date" className="admin-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
          <span>~</span>
          <input type="date" className="admin-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
          <button className="admin-excel-btn" onClick={handleExcelDownload}>Excel</button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="admin-table-wrapper">
        <table className="admin-table complain-table">
          <thead>
            <tr>
              <th>번호</th><th>부서명</th><th>장소</th><th>접수시간</th>
              <th>분류</th><th>제목</th><th>민원내용</th><th>처리내용</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} onClick={() => setSelectedComplain(row)} style={{ cursor: "pointer" }}>
                <td>{row.id}</td>
                <td>{row.dept}</td>
                <td>{row.location}</td>
                <td className="nowrap">{formatDate(row.date)}</td>
                <td>{row.category}</td>
                <td className="admin-title-cell">{row.title}</td>
                <td className="admin-content-cell">{row.content}</td>
                <td className="admin-content-cell">{row.result || "-"}</td>
                <td><Status status={row.status} /></td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan={9} className="admin-empty">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="admin-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>다음</button>
      </div>

      {/* 상세 팝업 */}
      {/* TODO: 백엔드 연결 시 onUpdate에서 PUT /api/complains/{id} 호출 */}
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

export default AdminComplainList;
