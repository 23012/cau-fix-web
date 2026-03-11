import "./Form.css";

const LoginForm = ({ formData, error, loading, onChange, onSubmit }) => (
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
    <button className="signup-btn">회원 가입</button>
  </form>
);

export default LoginForm;
