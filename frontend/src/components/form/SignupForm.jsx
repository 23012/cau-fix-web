import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "./Form.css";
import "../form/FormPopup.css";
import useCategories from "../../hooks/useCategories";

const SignupForm = ({ formData, error, loading, onChange, onSubmit, onCheckDuplicate }) => {
  const navigate = useNavigate();
  const { categories } = useCategories(true);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // 인라인 유효성 검사 상태
  const [idError, setIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");

  // 아이디 검증: 숫자(사번)만 허용
  const validateId = (value) => {
    if (!value.trim()) {
      setIdError("");
      return;
    }
    if (!/^\d+$/.test(value)) {
      setIdError("사번은 숫자만 입력 가능합니다.");
    } else {
      setIdError("");
    }
  };

  // 비밀번호 검증: 영어 소문자 + 숫자 포함 10자 이상
  const validatePassword = (value) => {
    if (!value.trim()) {
      setPasswordError("");
      return;
    }
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const isLongEnough = value.length >= 10;

    if (!hasLowercase || !hasNumber || !isLongEnough) {
      setPasswordError("영어 소문자 및 숫자를 포함하여 10자 이상이어야 합니다.");
    } else {
      setPasswordError("");
    }
  };

  // 비밀번호 확인 검증
  const validatePasswordConfirm = (value) => {
    if (!value.trim()) {
      setPasswordConfirmError("");
      return;
    }
    if (value !== formData.password) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordConfirmError("");
    }
  };

  const handleSubmit = (e) => {
    onSubmit(e, passwordConfirm);
  };

  return (
    <form onSubmit={handleSubmit} className="list-form">
      {/*아이디*/}
      <div className="signup-field-row">
        <input
          type="text"
          name="id"
          placeholder="아이디"
          value={formData.id}
          onChange={onChange}
          onBlur={(e) => validateId(e.target.value)}
          disabled={loading}
          className={`input ${idError ? "input-error" : ""}`}
        />
        <button type="button" className="signup-check-btn" onClick={onCheckDuplicate} disabled={loading}>
          중복 확인
        </button>
      </div>
      {idError ? (
        <p className="signup-validation-error">{idError}</p>
      ) : (
        <p className="signup-policy-text">※ 사번 입력</p>
      )}

      <input
        type="password"
        name="password"
        placeholder="비밀번호"
        value={formData.password}
        onChange={onChange}
        onBlur={(e) => validatePassword(e.target.value)}
        disabled={loading}
        className={`input ${passwordError ? "input-error" : ""}`}
      />
      {passwordError ? (
        <p className="signup-validation-error">{passwordError}</p>
      ) : (
        <p className="signup-policy-text">※ 영어 소문자 및 숫자 포함 10자 이상</p>
      )}

      {/*비밀번호*/}
      <input
        type="password"
        name="passwordConfirm"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        onBlur={(e) => validatePasswordConfirm(e.target.value)}
        disabled={loading}
        className={`input ${passwordConfirmError ? "input-error" : ""}`}
      />
      {passwordConfirmError && (
        <p className="signup-validation-error">{passwordConfirmError}</p>
      )}

      {/*권한*/}
      <div className="signup-role-row">
        <span className="signup-role-label">권한</span>
        <label className="signup-radio">
          <input type="radio" name="role" value="C" checked={formData.role === "C"} onChange={onChange} disabled={loading} />
          <span>사용자</span>
        </label>
        <label className="signup-radio">
          <input type="radio" name="role" value="E" checked={formData.role === "E"} onChange={onChange} disabled={loading} />
          <span>처리자</span>
        </label>
      </div>

      <input type="text" name="name" placeholder="이름" value={formData.name} onChange={onChange} disabled={loading} className="input" />
      {formData.role === "E" ? (
        <div className="form-field-select signup-dept-select" onClick={() => setShowDeptDropdown(!showDeptDropdown)}>
          <span>
            {formData.dept || "구분"}
          </span>
          <ChevronRight size={20} className="form-field-arrow" />
          {showDeptDropdown && (
            <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  type="button"
                  className={`form-dropdown-item ${formData.dept === cat.category_name ? "active" : ""}`}
                  onClick={() => {
                    onChange({ target: { name: "dept", value: cat.category_name } });
                    setShowDeptDropdown(false);
                  }}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <input type="text" name="dept" placeholder="부서" value={formData.dept} onChange={onChange} disabled={loading} className="input" />
      )}
      <input type="tel" name="phone" placeholder="내선번호" value={formData.phone} onChange={onChange} disabled={loading} className="input" />

      {error && <p className="signup-error-message">{error}</p>}

      {/*회원가입 버튼*/}
      <button type="submit" className="signup-btn" disabled={loading}>
        {loading ? "가입 중..." : "회원가입"}
      </button>

      <button type="button" className="login-link-btn" onClick={() => navigate("/")}>
        로그인으로 돌아가기
      </button>
    </form>
  );
};

export default SignupForm;
