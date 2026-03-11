import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Form.css";


const SignupForm = ({ formData, error, loading, onChange, onSubmit, onCheckDuplicate }) => {
  const navigate = useNavigate();
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSubmit = (e) => {
    onSubmit(e, passwordConfirm);
  };

  return (
    <form onSubmit={handleSubmit} className="list-form">
      <div className="signup-field-row">
        <input
          type="text"
          name="id"
          placeholder="아이디 (사번)"
          value={formData.id}
          onChange={onChange}
          disabled={loading}
          className="input"
        />
        <button type="button" className="signup-check-btn" onClick={onCheckDuplicate} disabled={loading}>
          중복 확인
        </button>
      </div>

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
          <input type="radio" name="role" value="user" checked={formData.role === "user"} onChange={onChange} disabled={loading} />
          <span>user</span>
        </label>
        <label className="signup-radio">
          <input type="radio" name="role" value="manager" checked={formData.role === "manager"} onChange={onChange} disabled={loading} />
          <span>manager</span>
        </label>
      </div>

      <input type="text" name="name" placeholder="이름" value={formData.name} onChange={onChange} disabled={loading} className="input" />
      <input type="text" name="department" placeholder="부서" value={formData.department} onChange={onChange} disabled={loading} className="input" />
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
