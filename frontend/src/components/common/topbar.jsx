import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, LogOut } from "lucide-react";
import logo from "../../assets/images/logo.svg";
import "./topbar.css";

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="topbar">
      <div className="topbar_logo">
        <img src={logo} alt="중앙대학교광명병원 로고" />
      </div>
      <div className="topbar_actions">
        <button
          className={`topbar_action-btn ${location.pathname === "/alarm-list" ? "topbar_action-btn--active" : ""}`}
          onClick={() => navigate("/alarm-list")}
          title="알림"
        >
          <Bell size={22} />
        </button>
        <button
          className={`topbar_action-btn ${location.pathname === "/myinfo" ? "topbar_action-btn--active" : ""}`}
          onClick={() => navigate("/myinfo")}
          title="내 정보"
        >
          <User size={22} />
        </button>
        <button
          className="topbar_action-btn topbar_action-btn--logout"
          onClick={handleLogout}
          title="로그아웃"
        >
          <LogOut size={22} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
