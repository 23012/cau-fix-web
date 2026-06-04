import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../../components/common/Background";
import Logo from "../../components/form/Logo";
import LoginForm from "../../components/form/LoginForm";
import { login } from "../../services/authService";
import { normalizeRole } from "../../constants/roles";
import { subscribePush } from "../../utils/pushSubscription";
import { useComplainDataContext } from "../../context/ComplainDataContext";
import hospitalBg from "../../assets/images/background-img.png";
import "./login.css";
import "../../styles/global.css";

const Login = () => {
  const navigate = useNavigate();
  const { refetch } = useComplainDataContext();
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
      const result = await login(formData.id, formData.password);
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify({
        ...result.member,
        role: normalizeRole(result.member.role),
      }));
      // 로그인 버튼 클릭(사용자 제스처) 안에서 푸시 구독 등록
      subscribePush().catch(() => {});

      // 새 토큰으로 민원 데이터 재로드
      await refetch();

      // 비밀번호 초기화 상태인 경우 경고 후 내 정보 페이지로 이동
      if (result.member.password_reset) {
        alert("관리자에 의해 비밀번호가 사번으로 초기화 되었습니다. 개인 정보 보호를 위해 비밀번호를 재설정 해주세요.");
        navigate("/myinfo");
      } else {
        navigate("/complain-dashboard");
      }
    } catch (err) {
      if (err.status === 403) {
        alert("관리자 승인 대기 중입니다.");
      } else if (err.status === 401) {
        alert("잘못된 아이디 또는 비밀번호입니다.\n다시 입력해주세요.");
      } else {
        setError(err.message || "로그인 중 오류가 발생했습니다");
      }
      setFormData({ id: "", password: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-center">
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
