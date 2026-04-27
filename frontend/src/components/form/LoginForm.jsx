import "./Form.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 로그인 폼
 * TODO: 백엔드 연결 시 onSubmit에서 POST /api/auth/login { id, password } 호출
 */
const LoginForm = ({ formData, error, loading, onChange, onSubmit }) => {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form onSubmit={onSubmit} className="list-form">
      <input
        type="text"
        name="id"
        placeholder="아이디"
        value={formData.id}
        onChange={onChange}
        disabled={loading}
        className="input"
      />
      <input
        type="password"
        name="password"
        placeholder="비밀번호"
        value={formData.password}
        onChange={onChange}
        disabled={loading}
        className="input"
      />
      
      <div className="remember-me">
        <label className="remember-me-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="remember-me-checkbox"
          />
          <span>아이디 기억하기</span>
        </label>
      </div>

      {error && <p className="error-message">{error}</p>}
      <button type="submit" className="btn" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <div className="login-divider">
      <span>또는</span>
      </div>
      <button
        type="button"
        className="signup-btn"
        onClick={() => navigate("/signup")}
      >
        회원 가입
      </button>
      <div className="login-divider">
      <span>
        대표문의 : 9331</span>
      </div>
    </form>
  );
};

export default LoginForm;
