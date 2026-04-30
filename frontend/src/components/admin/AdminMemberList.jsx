import "./AdminTable.css";
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import { normalizeRole, ROLES } from "../../constants/roles";
import MemberDetailPopup from "./MemberDetailPopup";
import MemberAddForm from "./MemberAddForm";
import Search from "../common/search";

/**
 * 관리자 회원 관리 리스트
 * TODO: 백엔드 연결 시 Excel 로딩을 GET /api/members 로 교체
 *   - 상태 변경: PATCH /api/members/{id}/approve
 *   - 회원 삭제: DELETE /api/members/{id}
 */

const STATUS_TABS = ["전체", "승인", "대기", "탈퇴"];

const getMemberStatus = (approved, deleted) => {
  if (deleted) return "탈퇴";
  if (approved) return "승인";
  return "대기";
};

const STATUS_CLASS = { "승인": "approved", "대기": "pending", "탈퇴": "withdrawn" };

const AdminMemberList = () => {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [roleFilter, setRoleFilter] = useState("전체");
  const [sortOrder, setSortOrder] = useState("번호순");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(loginDataFile);
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        const parsed = rows.map((row, idx) => {
          const approved = row["is_approved"] === true || row["is_approved"] === "true";
          const deleted = row["is_deleted"] === true || row["is_deleted"] === "true";
          return {
            no: idx + 1,
            id: (row["id"] ?? row["member_id"])?.toString() || "",
            role: normalizeRole(row["role"] || ""),
            name: row["name"]?.toString() || "",
            dept: row["dept"]?.toString() || "",
            phone: row["phone"]?.toString() || "",
            status: getMemberStatus(approved, deleted),
            createdAt: row["created_at"] || "",
            lastLogin: row["last_login_at"] || "",
          };
        });

        setMembers(parsed);
      } catch (error) {
        // 로드 실패
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let result = members.filter((m) => {
      if (statusFilter !== "전체") {
        if (m.status !== statusFilter) return false;
      }
      if (roleFilter !== "전체" && m.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !m.id.toLowerCase().includes(q) &&
          !m.name.toLowerCase().includes(q) &&
          !m.dept.toLowerCase().includes(q)
        ) return false;
      }
      if (startDate || endDate) {
        const created = m.createdAt ? new Date(m.createdAt) : null;
        if (!created || isNaN(created.getTime())) return false;
        if (startDate && created < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59);
          if (created > end) return false;
        }
      }
      return true;
    });

    switch (sortOrder) {
      case "번호순": result.sort((a, b) => a.no - b.no); break;
      case "최신순": result.sort((a, b) => b.no - a.no); break;
      default: result.sort((a, b) => a.no - b.no);
    }
    return result;
  }, [members, statusFilter, roleFilter, searchQuery, sortOrder, startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map((r) => ({
      "번호": r.no, "아이디": r.id, "이름": r.name,
      "부서": r.dept, "권한": r.role,
      "상태": r.status,
      "가입일자": r.createdAt, "마지막 로그인": r.lastLogin,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "회원목록");
    XLSX.writeFile(wb, "회원목록.xlsx");
  };

  return (
    <div className="admin-page">
      <div className="admin-mobile-header">
        <h1 className="admin-page-title">회원 관리</h1>
        <Search onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} placeholder="이름을 입력하세요" />
      </div>

      <div className="admin-status-tabs">
        {STATUS_TABS.map((tab) => (
          <button key={tab} className={`admin-status-tab ${statusFilter === tab ? "active" : ""}`} onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}>
            {tab}
          </button>
        ))}
      </div>

      <h1 className="admin-page-title">회원 관리</h1>

      {/* 필터 영역 */}
      <div className="admin-filters">
        <div className="admin-filters-left">
          <div className="admin-tabs">
            {STATUS_TABS.map((tab) => (
              <label key={tab} className={statusFilter === tab ? "active" : ""}>
                <input type="radio" name="memberStatus" value={tab} checked={statusFilter === tab} onChange={() => { setStatusFilter(tab); setCurrentPage(1); }} />
                {tab}
              </label>
            ))}
          </div>


          <input type="text" className="admin-search" placeholder="검색어" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} autoComplete="off" />
        </div>

        <div className="admin-filters-right">
          <select className="admin-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
            <option value="상태순">상태순</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="admin-table-wrapper">
        <table className="admin-table member-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>아이디</th>
              <th className="member-col-dept">부서</th>
              <th className="member-col-name">이름</th>
              <th>권한</th>
              <th>상태</th>
              <th>가입일자</th>
              <th>마지막 로그인</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.no} onClick={(e) => { e.stopPropagation(); setSelectedMember(row); }} style={{ cursor: "pointer" }}>
                <td>{row.no}</td>
                <td>{row.id}</td>
                <td className="member-col-dept">{row.dept}</td>
                <td className="member-col-name">{row.name}</td>
                <td>{row.role}</td>
                <td>
                  <span className={`member-status ${STATUS_CLASS[row.status] || ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="nowrap">{row.createdAt || "-"}</td>
                <td className="nowrap">{row.lastLogin || "-"}</td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr><td colSpan={8} className="admin-empty">회원이 없습니다.</td></tr>
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

      {/* 회원 상세 팝업 */}
      <MemberDetailPopup
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        onUpdate={(updated) => {
          setMembers((prev) => prev.map((m) => m.no === updated.no ? updated : m));
          setSelectedMember(updated);
        }}
      />

      {/* 회원 추가 팝업 */}
      <MemberAddForm
        isOpen={addFormOpen}
        onClose={() => setAddFormOpen(false)}
        onSubmit={(data) => {
          const newMember = {
            no: members.length + 1,
            id: data.id,
            role: data.role === "C" ? "사용자" : data.role === "E" ? "처리자" : data.role,
            name: data.name,
            dept: data.dept,
            phone: data.phone,
            status: "승인",
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt,
            createdAt: data.createdAt,
            lastLogin: "-",
          };
          setMembers((prev) => [...prev, newMember]);
        }}
      />
    </div>
  );
};

export default AdminMemberList;
