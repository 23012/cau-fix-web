import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../../components/common/Background";
import SignupForm from "../../components/form/SignupForm";
import { checkDuplicateId, register } from "../../services/authService";
import hospitalBg from "../../assets/images/background-img.png";
import "./signup.css";
import "../../styles/global.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: "",
    password: "",
    role: "",
    name: "",
    dept: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [idChecked, setIdChecked] = useState(false);
  const [idAvailable, setIdAvailable] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    if (name === "id") {
      setIdChecked(false);
      setIdAvailable(null);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!formData.id.trim()) {
      setError("아이디를 입력해주세요");
      return;
    }
    try {
      const result = await checkDuplicateId(formData.id);
      if (result.available) {
        alert("사용 가능한 아이디입니다.");
        setIdChecked(true);
        setIdAvailable(true);
      } else {
        alert("사용 불가능한 아이디입니다.");
        setIdChecked(true);
        setIdAvailable(false);
      }
    } catch (err) {
      setError("중복 확인 중 오류가 발생했습니다");
    }
  };

  const handleSubmit = async (e, passwordConfirm) => {
    e.preventDefault();

    if (!idChecked) {
      setError("아이디 중복 확인을 해주세요");
      return;
    }
    if (idAvailable === false) {
      setError("사용 불가능한 아이디입니다");
      return;
    }

    const { id, password, name, dept, phone } = formData;
    if (
      !id.trim() ||
      !password.trim() ||
      !passwordConfirm.trim() ||
      !name.trim() ||
      !dept.trim() ||
      !phone.trim()
    ) {
      setError("모든 항목을 입력해주세요");
      return;
    }

    // 아이디 검증: 숫자(사번)만 허용
    if (!/^\d+$/.test(id)) {
      setError("사번은 숫자만 입력 가능합니다.");
      return;
    }

    // 비밀번호 정책: 영어 소문자 및 숫자 포함 10자 이상
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length >= 10;

    if (!hasLowercase || !hasNumber || !isLongEnough) {
      setError("비밀번호는 영어 소문자 및 숫자를 포함하여 10자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      alert(result.message);
      navigate("/login");
    } catch (err) {
      if (err.status === 409) {
        setError("이미 사용 중인 아이디입니다");
        setIdChecked(false);
        setIdAvailable(null);
      } else {
        setError(err.message || "회원가입 중 오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-center">
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
