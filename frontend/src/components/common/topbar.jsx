import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut } from "lucide-react";
import MyProfileCard from "../myinfo/MyProfileCard";
import MyMenuList from "../myinfo/MyMenuList";
import AlarmPopup from "../alarm/AlarmPopup";
import logo from "../../assets/images/logo.svg";
import "./topbar.css";

const TopBar = () => {
  const navigate = useNavigate();
  const [myinfoOpen, setMyinfoOpen] = useState(false);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const popupRef = useRef(null);
  const btnRef = useRef(null);
  const alarmPopupRef = useRef(null);
  const alarmBtnRef = useRef(null);

  const [user, setUser] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem("pushEnabled") !== "false";
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // 팝업 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        myinfoOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setMyinfoOpen(false);
      }
      if (
        alarmOpen &&
        alarmPopupRef.current &&
        !alarmPopupRef.current.contains(e.target) &&
        alarmBtnRef.current &&
        !alarmBtnRef.current.contains(e.target)
      ) {
        setAlarmOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [myinfoOpen, alarmOpen]);

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleTogglePush = () => {
    const next = !pushEnabled;
    setPushEnabled(next);
    localStorage.setItem("pushEnabled", next.toString());
  };

  return (
    <div className="topbar">
      <div className="topbar_logo" onClick={() => navigate("/complain-dashboard")} style={{ cursor: "pointer" }}>
        <img src={logo} alt="중앙대학교광명병원 로고" />
      </div>
      {user?.role === "처리자" && user?.dept && (
          <span className="topbar_dept-badge">{user.dept}</span>
        )}
      <div className="topbar_actions">
        <div className="topbar_action-wrapper">
          <button
            ref={alarmBtnRef}
            className={`topbar_action-btn ${alarmOpen ? "topbar_action-btn--active" : ""}`}
            onClick={() => { setAlarmOpen(!alarmOpen); setMyinfoOpen(false); }}
          >
            <Bell size={16} />
            <span>알림</span>
          </button>
          {alarmOpen && (
            <div ref={alarmPopupRef}>
              <AlarmPopup onClose={() => setAlarmOpen(false)} />
            </div>
          )}
        </div>
        <div className="topbar_action-wrapper">
          <button
            ref={btnRef}
            className={`topbar_action-btn ${myinfoOpen ? "topbar_action-btn--active" : ""}`}
            onClick={() => { setMyinfoOpen(!myinfoOpen); setAlarmOpen(false); }}
          >
            <User size={16} />
            <span>내 정보</span>
          </button>
          {myinfoOpen && (
            <div className="topbar_myinfo-popup" ref={popupRef}>
              <MyProfileCard name={user?.name} dept={user?.dept} />
              <MyMenuList
                pushEnabled={pushEnabled}
                onTogglePush={handleTogglePush}
                onUpdateProfile={() => {}}
                onLogout={handleLogout}
                user={user}
              />
            </div>
          )}
        </div>
        <button
          className="topbar_action-btn topbar_action-btn--logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>

    </div>
  );
};

export default TopBar;
