import { useState } from "react";
import Background from "../../components/common/Background";
import Logo from "../../components/form/Logo";
import LoginForm from "../../components/form/LoginForm";
import hospitalBg from "../../assests/images/background-img.png";
import "./login.css";
import "../../styles/global.css";

const Login = () => {
  const [formData, setFormData] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      console.log("로그인 요청:", formData);
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다");
      console.error("로그인 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Background image={hospitalBg} />
      <div className="login-container">
        <Logo alt="중앙대학교 광명병원" />
        <LoginForm
          formData={formData}
          error={error}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default Login;
