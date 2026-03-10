import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./main.css";
import logo from "../../assests/images/main-logo.svg";

function Main() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000); // 5초 후 login으로 이동

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page-container flex-center main-container animate">
      <img src={logo} alt="logo" className="main-logo" />

      <div className="main-text">
        중앙대학교광명병원 <br />
        시설 고장 신고 앱
      </div>
    </div>
  );
}

export default Main;