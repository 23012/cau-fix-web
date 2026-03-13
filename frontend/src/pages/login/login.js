import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../../components/common/Background";
import Logo from "../../components/form/Logo";
import LoginForm from "../../components/form/LoginForm";
import hospitalBg from "../../assets/images/background-img.png";
import * as XLSX from "xlsx";
import loginDataFile from "../../assets/files/logindata.xlsx";
import "./login.css";
import "../../styles/global.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ id: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState([]);

  // 로그인 데이터 로드
  useEffect(() => {
    const loadLoginData = async () => {
      try {
        const res = await fetch(loginDataFile);
        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const parsed = rows.map((row) => ({
          id: row["id"]?.toString() || "",
          password: row["pw"]?.toString() || "",
        }));

        setLoginData(parsed);
      } catch (err) {
        console.error("로그인 데이터 로드 실패:", err);
      }
    };

    loadLoginData();
  }, []);

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
      // 로그인 데이터에서 일치하는 계정 찾기
      const user = loginData.find(
        (data) => data.id === formData.id && data.password === formData.password
      );

      if (user) {
        // 로그인 성공
        console.log("로그인 성공:", formData.id);
        navigate("/complain-dashboard");
      } else {
        // 로그인 실패
        alert("잘못된 아이디 또는 비밀번호입니다.\n다시 입력해주세요.");
        setFormData({ id: "", password: "" });
        setError("");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다");
      console.error("로그인 에러:", err);
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
