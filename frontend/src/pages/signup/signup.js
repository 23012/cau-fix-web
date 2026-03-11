import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../../components/common/Background";
import SignupForm from "../../components/form/SignupForm";
import hospitalBg from "../../assests/images/background-img.png";
import "./signup.css";
import "../../styles/global.css";

const Signup = () => {
  const navigate = useNavigate();

  //member 데이터 생성
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    role: "", // "user" or "manager"
    name: "",
    department: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // id duplicate-check state
  const [idChecked, setIdChecked] = useState(false);
  const [idAvailable, setIdAvailable] = useState(null); // null=unchecked, true/false

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
    // DB api 연결 필요
    console.log("중복 확인 요청:", formData.id);
    const exists = false;

    if (exists) {
      alert("사용 불가능한 아이디입니다.");
      setIdChecked(true);
      setIdAvailable(false);
    } else {
      alert("사용 가능한 아이디입니다.");
      setIdChecked(true);
      setIdAvailable(true);
    }
  };

  const handleSubmit = async (e, passwordConfirm) => {
    e.preventDefault();

    // require duplicate check and availability
    if (!idChecked) {
      setError("아이디 중복 확인을 해주세요");
      return;
    }
    if (idAvailable === false) {
      setError("사용 불가능한 아이디입니다");
      return;
    }

    const { id, password, name, department, email, phone } = formData;
    if (
      !id.trim() ||
      !password.trim() ||
      !passwordConfirm.trim() ||
      !name.trim() ||
      !department.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      setError("모든 항목을 입력해주세요");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    setLoading(true);
    try {
      console.log("회원가입 요청:", { ...formData, passwordConfirm });
      // simulate server response – the real implementation would await API
      alert("회원가입 요청이 접수되었습니다. 관리자 승인 후 로그인 가능합니다. (이음톡 확인 바람)");
      navigate("/login");
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
          onSubmit={handleSubmit}    // + 비밀번호 확인 함수 (passwordConfirm) 호출
          onCheckDuplicate={handleCheckDuplicate}
        />
      </div>
    </div>
  );
};

export default Signup;