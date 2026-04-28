import { useState } from "react";
import { ChevronRight } from "lucide-react";
import FormPopup from "../form/FormPopup";
import { DEPARTMENTS } from "../../constants/categories";
import "./MemberAddForm.css";

/**
 * 관리자 회원 추가 폼
 * TODO: 백엔드 연결 시 onSubmit에서 POST /api/members 호출
 */
const MemberAddForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    id: "", password: "", passwordConfirm: "",
    role: "C", name: "", dept: "", phone: "",
  });
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = () => {
    if (!formData.id.trim()) { setError("아이디를 입력해주세요."); return; }
    if (!formData.password.trim()) { setError("비밀번호를 입력해주세요."); return; }
    if (formData.password !== formData.passwordConfirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    if (!formData.name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!formData.dept.trim()) { setError("부서를 입력해주세요."); return; }

    onSubmit?.({
      id: formData.id,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      dept: formData.dept,
      phone: formData.phone,
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
      <div className="member-add-form" style={{ color: "#828282" }}>
      {/* 아이디 */}
      <div className="form-field">
        <input type="text" className="form-input" placeholder="아이디 (사번)" value={formData.id} onChange={(e) => handleChange("id", e.target.value)} style={{ color: "#828282" }} />
      </div>

      {/* 비밀번호 */}
      <div className="form-field">
        <input type="password" className="form-input" placeholder="비밀번호" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} />
      </div>
      <div className="form-field">
        <input type="password" className="form-input" placeholder="비밀번호 확인" value={formData.passwordConfirm} onChange={(e) => handleChange("passwordConfirm", e.target.value)} />
      </div>

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


      {error && <p className="member-add-error">{error}</p>}
      </div>
    </FormPopup>
  );
};

export default MemberAddForm;
