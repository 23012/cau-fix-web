import { useState } from "react";
import { ChevronRight } from "lucide-react";
import FormPopup from "../form/FormPopup";
import useCategories from "../../hooks/useCategories";
import { checkLoginId, registerMember } from "../../services/memberService";
import "./MemberAddForm.css";

/**
 * 관리자 회원 추가 폼
 */

const MemberAddForm = ({ isOpen, onClose, onSubmit }) => {
  const { categories: deptCategories } = useCategories(true);
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

  const handleSubmit = async () => {
    if (!formData.id.trim() || !formData.password.trim() || !formData.name.trim() || !formData.dept.trim()) {
      alert("필수 항목을 입력해주세요.");
      return;
    }

    try {
      await registerMember({
        login_id: formData.id,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        dept: formData.dept,
        phone: formData.phone,
      });
      alert("회원이 등록되었습니다.");
      setFormData({ id: "", password: "", passwordConfirm: "", role: "C", name: "", dept: "", phone: "" });
      setError("");
      onSubmit?.();
      onClose();
    } catch (err) {
      alert(err.message || "회원 등록 중 오류가 발생했습니다.");
    }
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
        <button type="button" className="member-add-check-btn" onClick={async () => {
          if (!formData.id.trim()) { alert("아이디를 입력해주세요."); return; }
          try {
            const result = await checkLoginId(formData.id);
            alert(result.available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.");
          } catch (err) {
            alert(err.message || "중복 확인 중 오류가 발생했습니다.");
          }
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
              {deptCategories.filter((d) => d.category_name !== "전체").map((dept) => (
                <button key={dept.category_id} type="button" className={`form-dropdown-item ${formData.dept === dept.category_name ? "active" : ""}`} onClick={() => { handleChange("dept", dept.category_name); setShowDeptDropdown(false); }}>
                  {dept.category_name}
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
