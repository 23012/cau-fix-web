import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import noticeDataFile from "../../assets/files/notice-data.xlsx";
import Search from "../common/search";
import "./NoticeList.css";

const TABS = ["전체", "안내", "업데이트", "이벤트", "작업", "공고"];

const NoticeList = ({ onSelect }) => {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(noticeDataFile);
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          id: row["NO"],
          category: row["카테고리"] || "",
          title: row["제목"] || "",
          content: row["내용"] || "",
          date: row["작성일자"] || "",
          author: row["작성자"] || "",
          views: row["조회수"] || 0,
        }));

        setNotices(parsed);
      } catch (error) {
        console.error("공지사항 로드 실패:", error);
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
          <div
            key={notice.id}
            className="notice-item"
            onClick={() => onSelect?.(notice)}
          >
            <span className="notice-item-category">{notice.category}</span>
            <span className="notice-item-title">{notice.title}</span>
            <span className="notice-item-date">{notice.date}</span>
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