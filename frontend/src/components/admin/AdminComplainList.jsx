import "./AdminComplainList.css";
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import sampleFile from "../../assets/files/sample.xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import { CATEGORIES } from "../../constants/categories";
import { STATUSES, normalizeStatus } from "../../constants/status";
import { parseExcelDate } from "../../utils/parseExcelDate";
import Status from "../common/Status";
import Detail from "../detail/detail";

const AdminComplainList = () => {
  const [tableData, setTableData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [deptFilter, setDeptFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("최신순");
  const itemsPerPage = 15;

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const [sampleRes, loginRes] = await Promise.all([
          fetch(sampleFile),
          fetch(loginDataFile)
        ]);
        const sampleBuffer = await sampleRes.arrayBuffer();
        const loginBuffer = await loginRes.arrayBuffer();

        const loginWorkbook = XLSX.read(loginBuffer, { type: "array" });
        const loginSheet = loginWorkbook.Sheets[loginWorkbook.SheetNames[0]];
        const loginRows = XLSX.utils.sheet_to_json(loginSheet);
        const memberMap = {};
        loginRows.forEach((row) => {
          const id = (row["member_id"] ?? row["id"])?.toString();
          if (id) {
            memberMap[id] = {
              name: row["name"]?.toString() || "",
              department: row["dept"]?.toString() || "",
              phone: row["phone"]?.toString() || "",
            };
          }
        });

        const workbook = XLSX.read(sampleBuffer, { type: "array" });
        const complainSheet = workbook.Sheets["민원"];
        const complainRows = XLSX.utils.sheet_to_json(complainSheet);

        const resultSheet = workbook.Sheets["처리"];
        const resultRows = XLSX.utils.sheet_to_json(resultSheet);
        const resultMap = {};
        resultRows.forEach((row) => {
          const id = row["complain_id"];
          const processorId = row["process_by"]?.toString() || "";
          const processor = memberMap[processorId] || {};
          resultMap[id] = {
            resultContent: row["process_content"] || "",
            resultPerson: processor.name || "",
            resultPersonId: processorId,
            resultDate: row["process_at"] || "",
          };
        });

        const parsed = complainRows.map((row) => {
          const id = row["complain_id"];
          const userId = (row["complain_by"] ?? "").toString();
          const member = memberMap[userId] || {};
          return {
            id,
            dept: member.department || "-",
            reporterName: member.name || "-",
            reporterPhone: member.phone || "-",
            category: row["category_id"] || "",
            title: row["complain_title"] || "",
            content: row["complain_content"] || "",
            location: row["location"] || "",
            status: normalizeStatus(row["state"] || ""),
            date: row["complain_at"],
            image: row["complain_img_id"] || null,
            result: resultMap[id]?.resultContent || null,
            resultPerson: resultMap[id]?.resultPerson || null,
            resultDate: resultMap[id]?.resultDate || null,
            resultDept: resultMap[id]?.resultPersonId ? (memberMap[resultMap[id].resultPersonId] || {}).department || null : null,
            resultPhone: resultMap[id]?.resultPersonId ? (memberMap[resultMap[id].resultPersonId] || {}).phone || null : null,
          };
        });

        setTableData(parsed);
      } catch (error) {
        // 로드 실패
      }
    };
    loadExcel();
  }, []);

  const formatDate = (value) => {
    const d = parseExcelDate(value);
    if (!d) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  };

  const departments = useMemo(() => {
    const depts = [...new Set(tableData.map((r) => r.dept).filter(Boolean))];
    return ["전체", ...depts.sort()];
  }, [tableData]);

  const filteredData = useMemo(() => {
    const result = tableData.filter((row) => {
      if (statusFilter !== "전체" && row.status !== statusFilter) return false;
      if (categoryFilter !== "전체" && row.category !== categoryFilter) return false;
      if (deptFilter !== "전체" && row.dept !== deptFilter) return false;
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
      case "번호순":
        sorted.sort((a, b) => a.id - b.id);
        break;
      case "최신순":
        sorted.sort((a, b) => b.id - a.id);
        break;
      case "오래된순":
        sorted.sort((a, b) => a.id - b.id);
        break;
      case "상태순": {
        const order = { "접수전": 0, "접수중": 1, "진행중": 2, "완료": 3 };
        sorted.sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
        break;
      }
      default:
        sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [tableData, statusFilter, categoryFilter, deptFilter, searchQuery, startDate, endDate, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((r) => ({
      "신고번호": r.id,
      "부서명": r.dept,
      "장소": r.location,
      "접수시간": formatDate(r.date),
      "민원분류": r.category,
      "제목": r.title,
      "민원내용": r.content,
      "처리내용": r.result || "",
      "상태": r.status,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "민원리스트");
    XLSX.writeFile(wb, "민원리스트.xlsx");
  };

  return (
    <div className="admin-list">
      <h1 className="admin-list-title">📋 민원 리스트</h1>

      {/* 필터 영역 */}
      <div className="admin-list-filters">
        <div className="admin-list-filters-left">
          <div className="admin-list-status-radios">
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

          <select className="admin-list-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
            <option value="전체">전체 분류</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            type="text"
            className="admin-list-search"
            placeholder="제목"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="admin-list-filters-right">
          <select className="admin-list-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
            <option value="상태순">상태순</option>
          </select>
          <input type="date" className="admin-list-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
          <span>~</span>
          <input type="date" className="admin-list-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
          <button className="admin-list-excel-btn" onClick={handleExcelDownload}>Excel</button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="admin-list-table-wrapper">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>부서명</th>
              <th>장소</th>
              <th>접수시간</th>
              <th>민원분류</th>
              <th>제목</th>
              <th>민원내용</th>
              <th>처리내용</th>
              <th>상태</th>
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
                <td className="admin-list-title-cell">{row.title}</td>
                <td className="admin-list-content-cell">{row.content}</td>
                <td className="admin-list-content-cell">{row.result || "-"}</td>
                <td><Status status={row.status} /></td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan={9} className="admin-list-empty">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="admin-list-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>다음</button>
      </div>

      {/* 상세 팝업 */}
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
