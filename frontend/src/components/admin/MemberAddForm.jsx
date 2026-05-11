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
  const [idError, setIdError] = useState("");
  const [pwError, setPwError] = useState("");

  const passwordMismatch = formData.passwordConfirm.length > 0 && formData.password !== formData.passwordConfirm;

  // 아이디(사번) 유효성: 숫자만 허용
  const validateId = (value) => {
    if (value && !/^\d+$/.test(value)) {
      setIdError("사번은 숫자만 입력 가능합니다.");
    } else {
      setIdError("");
    }
  };

  // 비밀번호 유효성: 영어 소문자 + 숫자 포함, 10자 이상
  const validatePassword = (value) => {
    if (!value) { setPwError(""); return; }
    if (value.length < 10) {
      setPwError("비밀번호는 10자 이상이어야 합니다.");
    } else if (!/[a-z]/.test(value)) {
      setPwError("비밀번호에 영어 소문자를 포함해야 합니다.");
    } else if (!/[0-9]/.test(value)) {
      setPwError("비밀번호에 숫자를 포함해야 합니다.");
    } else {
      setPwError("");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    if (field === "id") validateId(value);
    if (field === "password") validatePassword(value);
  };

  const handleSubmit = async () => {
    if (!formData.id.trim() || !formData.password.trim() || !formData.name.trim() || !formData.dept.trim()) {
      alert("필수 항목을 입력해주세요.");
      return;
    }
    if (!/^\d+$/.test(formData.id)) {
      alert("사번은 숫자만 입력 가능합니다.");
      return;
    }
    if (formData.password.length < 10 || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      alert("비밀번호는 영어 소문자, 숫자를 포함하여 10자 이상이어야 합니다.");
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
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
    setIdError("");
    setPwError("");
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
          if (!/^\d+$/.test(formData.id)) { alert("사번은 숫자만 입력 가능합니다."); return; }
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
      {idError && <p className="member-add-error">{idError}</p>}

      {/* 비밀번호 */}
      <div className="form-field">
        <input type="password" className="form-input" placeholder="비밀번호" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} />
      </div>
      {pwError && <p className="member-add-error">{pwError}</p>}
      <p className="member-add-hint">※ 영어 소문자, 숫자 포함 10자 이상</p>

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
