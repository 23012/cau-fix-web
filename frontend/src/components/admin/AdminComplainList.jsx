import "./AdminTable.css";
import { useState, useMemo } from "react";
import useComplainData from "../../hooks/useComplainData";
import { STATUSES } from "../../constants/status";
import useCategories from "../../hooks/useCategories";
import { formatDate } from "../../utils/formatDate";
import { parseExcelDate } from "../../utils/parseExcelDate";
import Status from "../common/Status";
import Detail from "../detail/detail";
import Search from "../common/search";

const AdminComplainList = () => {
  const { tableData, setTableData, refetch } = useComplainData();
  const { categories: deptCategories } = useCategories(true);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("전체 분류");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("번호순");
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    const result = tableData.filter((row) => {
      if (statusFilter !== "전체" && row.status !== statusFilter) return false;
      if (categoryFilter !== "전체 분류" && row.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!row.title.toLowerCase().includes(q) && !row.content?.toLowerCase().includes(q)) return false;
      }
      if (startDate || endDate) {
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
  }, [tableData, statusFilter, searchQuery, startDate, endDate, sortOrder, categoryFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExcelDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (categoryFilter !== '전체 분류') params.append('category', categoryFilter);
      if (statusFilter !== '전체') params.append('status', statusFilter);
      const queryStr = params.toString();

      const response = await fetch(`/api/complaints/export${queryStr ? `?${queryStr}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        alert('엑셀 다운로드에 실패했습니다.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers.get('Content-Disposition');
      const filename = disposition
        ? decodeURIComponent(disposition.split("filename*=UTF-8''")[1] || '민원목록.xlsx')
        : '민원목록.xlsx';
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-mobile-header">
        <h1 className="admin-page-title">민원 리스트</h1>
        <Search onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} />
      </div>

      <h1 className="admin-page-title">민원 리스트</h1>

      <div className="admin-filters">
        <div className="admin-filters-left">
          <div className="admin-tabs">
            <label className={statusFilter === "전체" ? "active" : ""}>
              <input type="radio" name="status" value="전체"
                checked={statusFilter === "전체"}
                onChange={() => { setStatusFilter("전체"); setCurrentPage(1); }} />
              전체
            </label>
            {STATUSES.map((s) => (
              <label key={s} className={statusFilter === s ? "active" : ""}>
                <input type="radio" name="status" value={s}
                  checked={statusFilter === s}
                  onChange={() => { setStatusFilter(s); setCurrentPage(1); }} />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-filters-right">
          <Search
            className="search-container search-pc"
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            placeholder="제목을 입력하세요"
          />
          
          <div className="admin-filters-row">
            <select
              className="admin-select"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              {[{ category_id: -1, category_name: "전체 분류" }, ...deptCategories].map((d) => (
                <option key={d.category_id} value={d.category_name}>{d.category_name}</option>
              ))}
            </select>
          </div>
          <div className="admin-filters-row">
            <input type="date" className="admin-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
            <span>~</span>
            <input type="date" className="admin-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
            <button className="admin-excel-btn" onClick={handleExcelDownload}>Excel</button>
          </div>
        </div>
      </div>

      <div className="admin-filters-row">
        <select className="admin-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
          <option value="번호순">번호순</option>
          <option value="최신순">최신순</option>
          <option value="오래된순">오래된순</option>
          <option value="상태순">상태순</option>
        </select>
      </div>

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
              <tr key={row.id} onClick={() => setSelectedComplain(row)}>
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

      <div className="admin-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>다음</button>
      </div>

      <Detail
        isOpen={!!selectedComplain}
        onClose={() => { setSelectedComplain(null); refetch(); }}
        data={selectedComplain}
        onUpdate={(updated) => {
          if (updated._deleted) {
            setTableData((prev) => prev.filter((r) => r.id !== updated.id));
          } else {
            setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }
          setSelectedComplain(null);
        }}
      />
    </div>
  );
};

export default AdminComplainList;
