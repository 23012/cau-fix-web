import FormPopup from "../form/FormPopup";
import { useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import useCategories from "../../hooks/useCategories";
import { approveMember, updateMemberRole, updateMemberDept, deleteMember } from "../../services/memberService";
import { formatDateTime, getNow } from "../../utils/formatDate";
import "./MemberDetailPopup.css";

/**
 * 회원 상세 정보 팝업
 */
const MemberDetailPopup = ({ isOpen, onClose, member, onUpdate, onRefresh }) => {
  const { categories } = useCategories();
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

  if (!isOpen || !member) return null;

  const currentRole = selectedRole ?? member.role;
  const roleChanged = selectedRole !== null && selectedRole !== member.role;

  const getAdmin = () => JSON.parse(localStorage.getItem("user") || "{}");

  const handleApprove = async () => {
    try {
      await approveMember(member.member_id);
      const admin = getAdmin();
      alert("승인이 완료되었습니다.");
      onUpdate?.({ ...member, status: "승인", approvedBy: admin.name || "-", approvedAt: getNow() });
      onRefresh?.();
    } catch (err) {
      alert(err.message || "승인 중 오류가 발생했습니다.");
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleRoleConfirm = () => {
    if (!selectedRole || selectedRole === member.role) return;
    const admin = getAdmin();
    onUpdate?.({ ...member, role: selectedRole, roleChangedBy: admin.name || "-", roleChangedAt: getNow() });
    setSelectedRole(null);
  };

  const handleDelete = async () => {
    if (!deletePassword.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    if (window.confirm("정말 탈퇴 처리하시겠습니까?")) {
      try {
        await deleteMember(member.member_id);
        const admin = getAdmin();
        alert("탈퇴 처리가 완료되었습니다.");
        setDeletePassword("");
        onUpdate?.({ ...member, status: "탈퇴", deletedBy: admin.name || "-", deletedAt: getNow() });
        onRefresh?.();
        onClose();
      } catch (err) {
        alert(err.message || "탈퇴 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    setSelectedDept(null);
    setDeletePassword("");
    onClose();
  };

  return (
    <FormPopup isOpen={true} onClose={handleClose} title="회원 상세 정보" hideSubmit>
      <hr className="member-detail-divider" />
      {/* 기본 정보 */}
      <div className="member-detail-section">
        <div className="member-detail-row">
          <span className="member-detail-label">아이디</span>
          <span className="member-detail-value">{member.id}</span>
          {member.status !== "탈퇴" && (
            <button className="member-detail-reset-pw-btn" onClick={() => {
              if (window.confirm("해당 회원의 아이디로 초기화됩니다. 초기화 하시겠습니까?")) {
                const admin = getAdmin();
                onUpdate?.({ ...member, pwResetBy: admin.name || "-", pwResetAt: getNow() });
                alert("비밀번호가 초기화되었습니다.");
              }
            }}>
              비밀번호 초기화
            </button>
          )}
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">이름</span>
          <span className="member-detail-value">{member.name}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">부서</span>
          <span className="member-detail-value">{member.dept}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">전화번호</span>
          <span className="member-detail-value">{member.phone || "-"}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">가입일자</span>
          <span className="member-detail-value">{formatDateTime(member.createdAt)}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">마지막 로그인</span>
          <span className="member-detail-value">{formatDateTime(member.lastLogin)}</span>
        </div>
        {member.pwResetBy && (
          <div className="member-detail-row">
            <span className="member-detail-sub-info">비밀번호 초기화 | 변경자: {member.pwResetBy} / {member.pwResetAt}</span>
          </div>
        )}
      </div>

      {/* 승인 여부 */}
      <div className="member-detail-section">
        <h3 className="member-detail-section-title">승인 여부</h3>
        {member.status === "승인" && (
          <>
            <div className="member-detail-status-badge approved">
              <CheckCircle size={18} />
              <span>이미 승인된 회원입니다.</span>
            </div>
            <p className="member-detail-sub-info">
              승인자: {member.approvedBy || "-"} / 승인일자: {member.approvedAt || "-"}
            </p>
          </>
        )}
        {member.status === "대기" && (
          <>
            <div className="member-detail-status-badge pending">
              <Clock size={18} />
              <span>승인 대기 중입니다.</span>
            </div>
            <button className="member-detail-approve-btn" onClick={handleApprove}>승인</button>
          </>
        )}
        {member.status === "탈퇴" && (
          <>
            <div className="member-detail-status-badge withdrawn">
              <XCircle size={18} />
              <span>탈퇴된 회원입니다.</span>
            </div>
            <p className="member-detail-sub-info">
              처리자: {member.deletedBy || "-"} / 탈퇴일: {member.deletedAt || "-"}
            </p>
          </>
        )}
      </div>

      {/* 권한 변경 */}
      {member.status !== "탈퇴" && (
        <div className="member-detail-section">
          <h3 className="member-detail-section-title">권한 변경</h3>
          <div className="member-detail-role-radios">
            {["사용자", "처리자"].map((role) => (
              <label key={role} className="member-detail-radio">
                <input
                  type="radio"
                  name="roleChange"
                  value={role}
                  checked={currentRole === role}
                  onChange={() => handleRoleSelect(role)}
                />
                <span>{role}</span>
              </label>
            ))}
            {currentRole === "처리자" && (
              <select
                className="member-detail-dept-select"
                value={selectedDept ?? member.dept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="전체">전체</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                ))}
              </select>
            )}
            {(roleChanged || (selectedDept !== null && selectedDept !== member.dept)) && (
              <button className="member-detail-role-confirm-btn" onClick={async () => {
                try {
                  const roleCode = selectedRole === "처리자" ? "E" : "C";
                  if (roleChanged) {
                    await updateMemberRole(member.member_id, roleCode);
                  }
                  const newDept = selectedDept ?? member.dept;
                  if (roleCode === "E" && (selectedDept !== null && selectedDept !== member.dept)) {
                    await updateMemberDept(member.member_id, newDept);
                  }
                  alert("변경이 완료되었습니다.");
                  const admin = getAdmin();
                  onUpdate?.({ ...member, role: selectedRole || member.role, dept: newDept, roleChangedBy: admin.name || "-", roleChangedAt: getNow() });
                  onRefresh?.();
                  setSelectedRole(null);
                  setSelectedDept(null);
                } catch (err) {
                  alert(err.message || "변경 중 오류가 발생했습니다.");
                }
              }}>변경</button>
            )}
          </div>
          {member.roleChangedBy && (
            <p className="member-detail-sub-info">
              변경자: {member.roleChangedBy} / 변경일: {member.roleChangedAt || "-"}
            </p>
          )}
        </div>
      )}

      {/* 회원 탈퇴 */}
      {member.status !== "탈퇴" && (
        <div className="member-detail-section">
          <h3 className="member-detail-section-title">회원 탈퇴</h3>
          <div className="member-detail-delete-row">
            <input
              type="password"
              className="member-detail-delete-input"
              placeholder="탈퇴 비밀번호 입력"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <button className="member-detail-delete-btn" onClick={handleDelete}>탈퇴</button>
          </div>
        </div>
      )}
    </FormPopup>
  );
};

export default MemberDetailPopup;
