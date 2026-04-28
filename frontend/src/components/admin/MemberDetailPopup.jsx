import FormPopup from "../form/FormPopup";
import { useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import "./MemberDetailPopup.css";

/**
 * 회원 상세 정보 팝업
 * TODO: 백엔드 연결 시
 *   - 승인/반려: PATCH /api/members/{id}/approve { approved: true/false }
 *   - 권한 변경: PATCH /api/members/{id}/role { role }
 *   - 회원 탈퇴: DELETE /api/members/{id} (비밀번호 확인)
 */
const MemberDetailPopup = ({ isOpen, onClose, member, onUpdate }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

  if (!isOpen || !member) return null;

  const currentRole = selectedRole ?? member.role;

  const handleApprove = () => {
    onUpdate?.({ ...member, status: "승인" });
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    onUpdate?.({ ...member, role });
  };

  const handleDelete = () => {
    if (!deletePassword.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    if (window.confirm("정말 탈퇴 처리하시겠습니까?")) {
      onUpdate?.({ ...member, status: "탈퇴" });
      setDeletePassword("");
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRole(null);
    setDeletePassword("");
    onClose();
  };

  return (
    <FormPopup isOpen={true} onClose={handleClose} title="회원 상세 정보" hideSubmit>
      {/* 기본 정보 */}
      <div className="member-detail-section">
        <div className="member-detail-row">
          <span className="member-detail-label">아이디:</span>
          <span className="member-detail-value">{member.id}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">이름:</span>
          <span className="member-detail-value">{member.name}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">부서:</span>
          <span className="member-detail-value">{member.dept}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">전화번호:</span>
          <span className="member-detail-value">{member.phone || "-"}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">가입일자:</span>
          <span className="member-detail-value">{member.createdAt || "-"}</span>
        </div>
        <div className="member-detail-row">
          <span className="member-detail-label">마지막 로그인:</span>
          <span className="member-detail-value">{member.lastLogin || "-"}</span>
        </div>
      </div>

      {/* 승인 여부 */}
      <div className="member-detail-section">
        <h3 className="member-detail-section-title">승인 여부</h3>
        {member.status === "승인" && (
          <div className="member-detail-status-badge approved">
            <CheckCircle size={18} />
            <span>이미 승인된 회원입니다.</span>
          </div>
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
          <div className="member-detail-status-badge withdrawn">
            <XCircle size={18} />
            <span>탈퇴된 회원입니다.</span>
          </div>
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
                  onChange={() => handleRoleChange(role)}
                />
                <span>{role}</span>
              </label>
            ))}
          </div>
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
