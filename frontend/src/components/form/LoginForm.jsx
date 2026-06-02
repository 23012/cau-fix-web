import "./Form.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 로그인 폼
 */
const LoginForm = ({ formData, error, loading, onChange, onSubmit }) => {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  // 컴포넌트 마운트 시 저장된 아이디 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem("rememberedId");
    if (savedId) {
      setRememberMe(true);
      onChange({ target: { name: "id", value: savedId } });
    }
  }, []);

  // 아이디 기억하기 체크 상태 변경 시 처리
  const handleRememberMe = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem("rememberedId");
    }
  };

  // 폼 제출 시 아이디 저장/삭제 처리
  const handleSubmit = (e) => {
    if (rememberMe) {
      localStorage.setItem("rememberedId", formData.id);
    } else {
      localStorage.removeItem("rememberedId");
    }
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="list-form">
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
            onChange={handleRememberMe}
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
