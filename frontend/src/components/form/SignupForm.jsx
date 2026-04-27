import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "./Form.css";
import "../form/FormPopup.css";
import { DEPARTMENTS } from "../../constants/categories";


/**
 * 회원가입 폼
 * TODO: 백엔드 연결 시
 *   - 중복확인: GET /api/auth/check-id?id={id}
 *   - 회원가입: POST /api/auth/signup { id, password, name, role, dept, phone }
 */
const SignupForm = ({ formData, error, loading, onChange, onSubmit, onCheckDuplicate }) => {
  const navigate = useNavigate();
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const handleSubmit = (e) => {
    onSubmit(e, passwordConfirm);
  };

  return (
    <form onSubmit={handleSubmit} className="list-form">
      <div className="signup-field-row">
        <input
          type="text"
          name="id"
          placeholder="아이디"
          value={formData.id}
          onChange={onChange}
          disabled={loading}
          className="input"
        />
        <button type="button" className="signup-check-btn" onClick={onCheckDuplicate} disabled={loading}>
          중복 확인
        </button>
      </div>
      <p className="signup-policy-text">
        ※ 사번 입력
      </p>

      <input type="password" name="password" placeholder="비밀번호" value={formData.password} onChange={onChange} disabled={loading} className="input" />
      <p className="signup-policy-text">
        ※ 영어 소문자 및 숫자 포함 10자 이상
      </p>
      <input
        type="password"
        name="passwordConfirm"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        disabled={loading}
        className="input"
      />

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
        <div className="form-field-select" onClick={() => setShowDeptDropdown(!showDeptDropdown)} style={{ padding: "12px 16px", border: "1px solid var(--back-color)", borderRadius: "8px", position: "relative", boxSizing: "border-box", fontSize: "1rem", lineHeight: "normal", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <span style={formData.dept ? { fontSize: "1rem", color: "var(--back-color-2)", fontWeight: 400 } : { fontSize: "1rem", color: "var(--back-color-2)", fontWeight: 400 }}>
            {formData.dept || "구분"}
          </span>
          <ChevronRight size={20} className="form-field-arrow" />
          {showDeptDropdown && (
            <div className="form-dropdown" onClick={(e) => e.stopPropagation()}>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`form-dropdown-item ${formData.dept === dept ? "active" : ""}`}
                  onClick={() => {
                    onChange({ target: { name: "dept", value: dept } });
                    setShowDeptDropdown(false);
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <input type="text" name="dept" placeholder="부서" value={formData.dept} onChange={onChange} disabled={loading} className="input" />
      )}
      <input type="tel" name="phone" placeholder="전화번호" value={formData.phone} onChange={onChange} disabled={loading} className="input" />

      {error && <p className="signup-error-message">{error}</p>}

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
