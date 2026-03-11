import "./Form.css";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ formData, error, loading, onChange, onSubmit }) => {
  const navigate = useNavigate();

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
        비밀번호 재설정 문의 : 시설팀</span>
      </div>
    </form>
  );
};

export default LoginForm;
