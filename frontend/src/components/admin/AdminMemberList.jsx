import "./AdminTable.css";
import { useState, useEffect, useMemo } from "react";
import { getMembers } from "../../services/memberService";
import { normalizeRole } from "../../constants/roles";
import { formatDateTime } from "../../utils/formatDate";
import MemberDetailPopup from "./MemberDetailPopup";
import Search from "../common/search";

/**
 * 관리자 회원 관리 리스트
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
  const [sortOrder, setSortOrder] = useState("번호순");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const itemsPerPage = 15;

  const loadData = async () => {
    try {
      const result = await getMembers();
      const parsed = (result.members || []).map((row, idx) => ({
        no: idx + 1,
        member_id: row.member_id,
        id: row.login_id || "",
        role: normalizeRole(row.role || ""),
        name: row.name || "",
        dept: row.dept || "",
        phone: row.phone || "",
        status: getMemberStatus(row.is_approved, false),
        createdAt: row.created_at || "",
        lastLogin: row.last_login_at || "",
      }));
      setMembers(parsed);
    } catch (error) {
      // 로드 실패
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    let result = members.filter((m) => {
      if (statusFilter !== "전체") {
        if (m.status !== statusFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !m.id.toLowerCase().includes(q) &&
          !m.name.toLowerCase().includes(q) &&
          !m.dept.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });

    switch (sortOrder) {
      case "번호순": result.sort((a, b) => a.no - b.no); break;
      case "최신순": result.sort((a, b) => b.no - a.no); break;
      default: result.sort((a, b) => a.no - b.no);
    }
    return result;
  }, [members, statusFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-page">
      <div className="admin-mobile-header">
        <h1 className="admin-page-title">회원 관리</h1>
        <Search onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} placeholder="이름을 입력하세요" />
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
        </div>

        <div className="admin-filters-right">
          <Search
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            placeholder="이름을 입력하세요"
            className = "search-container search-pc"
          />
      </div>
    </div>
    
     {/*정렬*/}
        <div className="admin-filters-row">
          <select className="admin-select" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}>
            <option value="번호순">번호순</option>
            <option value="최신순">최신순</option>
            <option value="오래된순">오래된순</option>
            <option value="상태순">상태순</option>
          </select>
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
              <tr key={row.no} onClick={(e) => { e.stopPropagation(); setSelectedMember(row); }}>
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
                <td className="nowrap">{formatDateTime(row.createdAt)}</td>
                <td className="nowrap">{formatDateTime(row.lastLogin)}</td>
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
          setMembers((prev) => prev.map((m) => m.member_id === updated.member_id ? { ...m, ...updated } : m));
          setSelectedMember((prev) => prev ? { ...prev, ...updated } : prev);
        }}
        onRefresh={async () => {
          await loadData();
          // loadData 후 selectedMember도 최신 데이터로 갱신
          if (selectedMember) {
            const result = await getMembers();
            const fresh = (result.members || []).find((m) => m.member_id === selectedMember.member_id);
            if (fresh) {
              setSelectedMember((prev) => ({
                ...prev,
                role: normalizeRole(fresh.role || ""),
                dept: fresh.dept || "",
                status: getMemberStatus(fresh.is_approved, false),
              }));
            }
          }
        }}
      />
    </div>
  );
};

export default AdminMemberList;
