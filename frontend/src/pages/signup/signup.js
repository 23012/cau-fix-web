import { useState } from "react";
import Background from "../../components/common/Background";
import Logo from "../../components/form/Logo";
import SignupForm from "../../components/form/SignupForm";
import hospitalBg from "../../assests/images/background-img.png";
import "./signup.css";
import "../../styles/global.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    passwordConfirm: "",
    role: "user", // "user" or "manager"
    name: "",
    department: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCheckDuplicate = async () => {
    if (!formData.id.trim()) {
      setError("아이디를 입력해주세요");
      return;
    }
    console.log("중복 확인:", formData.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, password, passwordConfirm, name, department, email, phone } = formData;
    if (!id.trim() || !password.trim() || !passwordConfirm.trim() || !name.trim() || !department.trim() || !email.trim() || !phone.trim()) {
      setError("모든 항목을 입력해주세요");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    try {
      console.log("회원가입 요청:", formData);
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다");
      console.error("회원가입 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Background image={hospitalBg} />
      <div className="signup-container">
        <h1 className="signup-title">회원가입</h1>
        <SignupForm
          formData={formData}
          error={error}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCheckDuplicate={handleCheckDuplicate}
        />
      </div>
    </div>
  );
};

export default Signup;