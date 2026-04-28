import { useState } from "react";
import { ChevronRight } from "lucide-react";
import FormPopup from "../form/FormPopup";
import { DEPARTMENTS } from "../../constants/categories";
import "./MemberAddForm.css";

/**
 * 관리자 회원 추가 폼
 * TODO: 백엔드 연결 시 onSubmit에서 POST /api/members 호출
 */

const formatAMPM = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${y}-${m}-${d} ${String(h).padStart(2, "0")}:${min}${ampm}`;
};

const MemberAddForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    id: "", password: "", passwordConfirm: "",
    role: "C", name: "", dept: "", phone: "",
  });
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [error, setError] = useState("");

  const passwordMismatch = formData.passwordConfirm.length > 0 && formData.password !== formData.passwordConfirm;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = () => {
    if (!formData.id.trim() || !formData.password.trim() || !formData.name.trim() || !formData.dept.trim()) return;

    const admin = JSON.parse(localStorage.getItem("user") || "{}");
    const now = formatAMPM(new Date());

    onSubmit?.({
      id: formData.id,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      dept: formData.dept,
      phone: formData.phone,
      approvedBy: admin.name || "-",
      approvedAt: now,
      createdAt: now,
    });

    setFormData({ id: "", password: "", passwordConfirm: "", role: "C", name: "", dept: "", phone: "" });
    setError("");
    onClose();
  };

  const handleClose = () => {
    setFormData({ id: "", password: "", passwordConfirm: "", role: "C", name: "", dept: "", phone: "" });
    setShowDeptDropdown(false);
    setError("");
    onClose();
  };

  return (
    <FormPopup isOpen={isOpen} onClose={handleClose} title="회원 추가" onSubmit={handleSubmit} submitLabel="추가">
      <div className="member-add-form">
      {/* 아이디 */}
      <div className="form-field member-add-id-row">
        <input type="text" className="form-input" placeholder="아이디 (사번)" value={formData.id} onChange={(e) => handleChange("id", e.target.value)} />
        <button type="button" className="member-add-check-btn" onClick={() => {
          // TODO: 백엔드 연결 시 GET /api/auth/check-id?id={formData.id}
          alert("사용 가능한 아이디입니다.");
        }}>
          중복 확인
        </button>
      </div>

      {/* 비밀번호 */}
      <div className="form-field">
        <input type="password" className="form-input" placeholder="비밀번호" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} />
      </div>
      <p className="member-add-hint">※ 사번과 동일하게 입력 바랍니다.</p>

      {/* 권한 */}
      <div className="member-add-role-row">
        <span className="member-add-role-label">권한</span>
        <label className="member-add-radio">
          <input type="radio" name="addRole" value="C" checked={formData.role === "C"} onChange={() => handleChange("role", "C")} />
          <span>사용자</span>
        </label>
        <label className="member-add-radio">
          <input type="radio" name="addRole" value="E" checked={formData.role === "E"} onChange={() => handleChange("role", "E")} />
          <span>처리자</span>
        </label>
      </div>

      {/* 이름 */}
      <div className="form-field">
        <input type="text" className="form-input" placeholder="이름" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
      </div>

      {/* 부서 */}
      {formData.role === "E" ? (
        <div className="form-field form-field-select" onClick={() => setShowDeptDropdown(!showDeptDropdown)}>
          <span className={formData.dept ? "form-field-value" : "form-field-placeholder"}>
            {formData.dept || "구분"}
          </span>
          <ChevronRight size={20} className="form-field-arrow" />
          {showDeptDropdown && (
            <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
              {DEPARTMENTS.filter((d) => d !== "전체").map((dept) => (
                <button key={dept} type="button" className={`form-dropdown-item ${formData.dept === dept ? "active" : ""}`} onClick={() => { handleChange("dept", dept); setShowDeptDropdown(false); }}>
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="form-field">
          <input type="text" className="form-input" placeholder="부서" value={formData.dept} onChange={(e) => handleChange("dept", e.target.value)} />
        </div>
      )}

      {/* 전화번호 */}
      <div className="form-field">
        <input type="tel" className="form-input" placeholder="전화번호" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
      </div>

      </div>
    </FormPopup>
  );
};

export default MemberAddForm;
