import "./AdminTable.css";
import { useState, useEffect, useMemo } from "react";
import { getNotices, createNotice } from "../../services/noticeService";
import { parseExcelDate } from "../../utils/parseExcelDate";
import NoticeForm from "./NoticeForm";
import Search from "../common/search";
import { Plus } from "lucide-react";

const TABS = ["전체", "공지", "업데이트", "점검"];
const CATEGORY_LABEL_TO_CODE = { "공지": "G", "업데이트": "U", "점검": "F" };

const AdminNoticeList = ({ onSelect }) => {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("번호순");
  const [currentPage, setCurrentPage] = useState(1);
  const [noticeFormOpen, setNoticeFormOpen] = useState(false);
  const itemsPerPage = 15;

  const loadData = async () => {
    try {
      const result = await getNotices();
      setNotices(result.notices || []);
    } catch (error) {
      // 로드 실패
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    let result = notices.filter((n) => {
      if (activeTab !== "전체" && n.category !== activeTab) return false;
      if (searchQuery.trim() && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    switch (sortOrder) {
      case "최신순": result.sort((a, b) => b.id - a.id); break;
      case "오래된순":
      case "번호순": result.sort((a, b) => a.id - b.id); break;
      default: result.sort((a, b) => b.id - a.id);
    }
    return result;
  }, [notices, activeTab, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateNotice = async (formData) => {
    try {
      await createNotice({
        notice_title: formData.title,
        notice_category: CATEGORY_LABEL_TO_CODE[formData.category] || "G",
        notice_content: formData.content,
      });
      setNoticeFormOpen(false);
      alert("공지사항이 등록되었습니다.");
      loadData();
    } catch (err) {
      alert(err.message || "공지사항 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-mobile-header">
        <h1 className="admin-page-title">공지사항</h1>
        <Search onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} />
      </div>

      <h1 className="admin-page-title">공지사항</h1>

      <div className="admin-filters">
        <div className="admin-filters-left">
          <div className="admin-tabs admin-category-tabs">
            {TABS.map((tab) => (
              <label key={tab} className={activeTab === tab ? "active" : ""}>
                <input type="radio" name="tab" value={tab} checked={activeTab === tab} onChange={() => { setActiveTab(tab); setCurrentPage(1); }} />
                {tab}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-filters-right">
          <Search
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            placeholder="제목을 입력하세요"
            className="search-container search-pc"
          />
          <button className="admin-write-btn" onClick={() => setNoticeFormOpen(true)}>
            <span>작성하기</span>
          </button>
        </div>
      </div>

      <div className="admin-filters-row">
        <select className="admin-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
          <option value="번호순">번호순</option>
          <option value="최신순">최신순</option>
          <option value="오래된순">오래된순</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table notice-table">
          <thead>
            <tr>
              <th>번호</th><th>분류</th><th>제목</th>
              <th>작성자</th><th>작성일자</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} onClick={() => onSelect?.(row)} style={{ cursor: "pointer" }}>
                <td>{row.id}</td>
                <td>{row.category}</td>
                <td className="admin-title-cell">{row.title}</td>
                <td>{row.author}</td>
                <td className="nowrap">{(() => {
                  const d = parseExcelDate(row.date);
                  if (!d) return row.date;
                  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                })()}</td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan={5} className="admin-empty">공지사항이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>다음</button>
      </div>

      <NoticeForm
        isOpen={noticeFormOpen}
        onClose={() => setNoticeFormOpen(false)}
        onSubmit={handleCreateNotice}
      />

      <div className="admin-fab">
        <button className="fab-btn" onClick={() => setNoticeFormOpen(true)}><Plus /></button>
      </div>
    </div>
  );
};

export default AdminNoticeList;
