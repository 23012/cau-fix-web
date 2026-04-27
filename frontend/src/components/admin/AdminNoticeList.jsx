import "./AdminNoticeList.css";
import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import * as XLSX from "xlsx";
import noticeDataFile from "../../assets/files/notice-data.xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import { normalizeNoticeCategory } from "../../constants/noticeCategories";
import NoticeForm from "./NoticeForm";

const TABS = ["전체", "공지", "업데이트", "점검"];

const AdminNoticeList = ({ onSelect, updatedNotice }) => {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("최신순");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [noticeFormOpen, setNoticeFormOpen] = useState(false);
  const itemsPerPage = 15;

  // 수정된 공지사항 반영
  useEffect(() => {
    if (updatedNotice) {
      setNotices((prev) =>
        prev.map((n) => (n.id === updatedNotice.id ? { ...n, ...updatedNotice } : n))
      );
    }
  }, [updatedNotice]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [noticeRes, loginRes] = await Promise.all([
          fetch(noticeDataFile),
          fetch(loginDataFile)
        ]);
        const noticeBuffer = await noticeRes.arrayBuffer();
        const loginBuffer = await loginRes.arrayBuffer();

        const loginWorkbook = XLSX.read(loginBuffer, { type: "array" });
        const loginSheet = loginWorkbook.Sheets[loginWorkbook.SheetNames[0]];
        const loginRows = XLSX.utils.sheet_to_json(loginSheet);
        const memberMap = {};
        loginRows.forEach((row) => {
          const id = (row["member_id"] ?? row["id"])?.toString();
          if (id) memberMap[id] = row["name"]?.toString() || "";
        });

        const workbook = XLSX.read(noticeBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          id: row["notice_id"],
          category: normalizeNoticeCategory(row["notice_category"] || ""),
          title: row["notice_title"] || "",
          content: row["notice_content"] || "",
          date: row["noticed_at"] || "",
          updatedAt: row["updated_at"] || "",
          author: memberMap[(row["noticed_by"] ?? "").toString()] || row["noticed_by"] || "",
        }));

        setNotices(parsed);
      } catch (error) {
        // 로드 실패
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let result = notices.filter((n) => {
      if (activeTab !== "전체" && n.category !== activeTab) return false;
      if (searchQuery.trim() && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (startDate && n.date && n.date < startDate.replace(/-/g, ".")) return false;
      if (endDate && n.date && n.date > endDate.replace(/-/g, ".")) return false;
      return true;
    });

    switch (sortOrder) {
      case "최신순":
        result.sort((a, b) => b.id - a.id);
        break;
      case "오래된순":
        result.sort((a, b) => a.id - b.id);
        break;
      case "번호순":
        result.sort((a, b) => a.id - b.id);
        break;
      default:
        result.sort((a, b) => b.id - a.id);
    }
    return result;
  }, [notices, activeTab, searchQuery, sortOrder, startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((r) => ({
      "번호": r.id,
      "카테고리": r.category,
      "제목": r.title,
      "내용": r.content,
      "작성일자": r.date,
      "작성자": r.author,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "공지사항");
    XLSX.writeFile(wb, "공지사항.xlsx");
  };

  return (
    <div className="admin-notice-list">
      <h1 className="admin-notice-title">📢 공지사항</h1>

      {/* 필터 영역 */}
      <div className="admin-notice-filters">
        <div className="admin-notice-filters-left">
          <div className="admin-notice-tabs">
            {TABS.map((tab) => (
              <label key={tab} className={activeTab === tab ? "active" : ""}>
                <input type="radio" name="tab" value={tab} checked={activeTab === tab} onChange={() => { setActiveTab(tab); setCurrentPage(1); }} />
                {tab}
              </label>
            ))}
          </div>

          <input
            type="text"
            className="admin-notice-search"
            placeholder="제목"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="admin-notice-filters-right">
          <select className="admin-notice-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
          </select>
          <input type="date" className="admin-notice-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
          <span>~</span>
          <input type="date" className="admin-notice-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
          <button className="admin-notice-excel-btn" onClick={handleExcelDownload}>Excel</button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="admin-notice-table-wrapper">
        <table className="admin-notice-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>카테고리</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일자</th>
              <th>수정일자</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} onClick={() => onSelect?.(row)} style={{ cursor: "pointer" }}>
                <td>{row.id}</td>
                <td>{row.category}</td>
                <td className="admin-notice-title-cell">{row.title}</td>
                <td>{row.author}</td>
                <td className="nowrap">{row.date}</td>
                <td className="nowrap">{row.updatedAt}</td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan={6} className="admin-notice-empty">공지사항이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="admin-notice-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>다음</button>
      </div>
      <button className="admin-notice-write-btn" onClick={() => setNoticeFormOpen(true)}>
          <span>작성하기</span>
      </button>

      {/* 공지사항 작성 팝업 */}
      <NoticeForm
        isOpen={noticeFormOpen}
        onClose={() => setNoticeFormOpen(false)}
        onSubmit={(data) => {
          // TODO: DB 연결 후 공지사항 등록 API 호출
          setNoticeFormOpen(false);
        }}
      />
    </div>
  );
};

export default AdminNoticeList;
