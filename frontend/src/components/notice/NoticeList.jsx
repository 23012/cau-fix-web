import { useState, useEffect } from "react";
import { getNotices } from "../../services/noticeService";
import { parseExcelDate } from "../../utils/parseExcelDate";
import Search from "../common/search";
import "./NoticeList.css";

const TABS = ["전체", "공지", "업데이트", "점검"];

const NoticeList = ({ onSelect }) => {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getNotices();
        setNotices(result.notices || []);
      } catch (error) {
        // 로드 실패
      }
    };
    loadData();
  }, []);

  const filtered = notices.filter((n) => {
    if (activeTab !== "전체" && n.category !== activeTab) return false;
    if (searchQuery.trim() && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const visible = filtered.slice(0, visibleCount);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisibleCount(10);
  };

  return (
    <div className="notice-list">
      <div className="notice-list-header">
        <h1 className="notice-list-title">공지사항</h1>
        <Search onSearchChange={(q) => setSearchQuery(q)} />
      </div>

      <div className="notice-list-toolbar">
        <div className="notice-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`notice-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="notice-items">
        {visible.map((notice) => (
          <div key={notice.id} className="notice-item" onClick={() => onSelect?.(notice)}>
            <span className="notice-item-category">{notice.category}</span>
            <span className="notice-item-title">{notice.title}</span>
            <span className="notice-item-date">{(() => {
              const d = parseExcelDate(notice.date);
              if (!d) return notice.date;
              return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            })()}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="notice-empty">공지사항이 없습니다.</div>
        )}
      </div>

      {visibleCount < filtered.length && (
        <div className="notice-more">
          <button className="notice-more-btn" onClick={() => setVisibleCount((prev) => prev + 10)}>
            더 보기({visibleCount}/{filtered.length}) ∨
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeList;
