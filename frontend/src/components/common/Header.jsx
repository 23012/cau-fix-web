import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Bell, User, Users, LogOut, MessageSquareWarning } from "lucide-react";
import MyProfileCard from "../myinfo/MyProfileCard";
import MyMenuList from "../myinfo/MyMenuList";
import PushPopup from "../push/PushPopup";
import { normalizeRole } from "../../constants/roles";
import logo from "../../assets/images/logo.svg";
import "./Header.css";

const getMenuItems = (role) => {
  const dashboardName = role === "관리자" ? "대시보드" : "내 민원";
  const items = [
    { name: dashboardName, Icon: LayoutDashboard, order: 1, path: "/complain-dashboard" },
    { name: "공지사항", Icon: ClipboardList, order: 3, path: "/notice" },
    { name: "알림", Icon: Bell, order: 4, path: "/push-list", mobileOnly: true },
    { name: "내 정보", Icon: User, order: 5, path: "/myinfo", mobileOnly: true },
  ];
  if (role === "관리자") {
    items.splice(1, 0, { name: "민원 리스트", Icon: MessageSquareWarning, order: 2, path: "/admin/complains" });
    items.splice(2, 0, { name: "회원 관리", Icon: Users, order: 2.5, path: "/admin/members" });
  }
  return items;
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 팝업 상태
  const [pushOpen, setPushOpen] = useState(false);
  const [myinfoOpen, setMyinfoOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem("pushEnabled") !== "false");

  const popupRef = useRef(null);
  const btnRef = useRef(null);
  const pushPopupRef = useRef(null);
  const pushBtnRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");
  const menuItems = getMenuItems(role);

  useEffect(() => {
    const idx = menuItems.findIndex((item) => item.path === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname, menuItems]);

  // 팝업 바깥 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (myinfoOpen && popupRef.current && !popupRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setMyinfoOpen(false);
      }
      if (pushOpen && pushPopupRef.current && !pushPopupRef.current.contains(e.target) && pushBtnRef.current && !pushBtnRef.current.contains(e.target)) {
        setPushOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [myinfoOpen, pushOpen]);

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

  const handleMenuClick = (index, path) => {
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <>
      {/* PC/태블릿: 한 줄 헤더 */}
      <header className="header">
        <div className="header__inner">
          {/* 로고 */}
          <div className="header__logo" onClick={() => navigate("/complain-dashboard")}>
            <img src={logo} alt="중앙대학교광명병원 로고" />
          </div>

          {/* 메뉴 */}
          <nav className="header__nav">
            {menuItems.filter((item) => !item.mobileOnly).map((item, index) => {
              const realIndex = menuItems.indexOf(item);
              const isActive = activeIndex === realIndex;
              const isHovered = hoveredIndex === realIndex;
              return (
                <button
                  key={item.name}
                  className={`header__nav-btn ${isActive ? "header__nav-btn--active" : ""}`}
                  onClick={() => handleMenuClick(realIndex, item.path)}
                  onMouseEnter={() => setHoveredIndex(realIndex)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* 우측 액션 */}
          <div className="header__actions">
            <div className="header__action-wrapper">
              <button
                ref={pushBtnRef}
                className={`header__action-btn ${pushOpen ? "header__action-btn--active" : ""}`}
                onClick={() => { setPushOpen(!pushOpen); setMyinfoOpen(false); }}
              >
                <Bell size={16} /><span>알림</span>
              </button>
              {pushOpen && (
                <div ref={pushPopupRef}>
                  <PushPopup onClose={() => setPushOpen(false)} />
                </div>
              )}
            </div>
            <div className="header__action-wrapper">
              <button
                ref={btnRef}
                className={`header__action-btn ${myinfoOpen ? "header__action-btn--active" : ""}`}
                onClick={() => { setMyinfoOpen(!myinfoOpen); setPushOpen(false); }}
              >
                <User size={16} /><span>내 정보</span>
              </button>
              {myinfoOpen && (
                <div className="header__myinfo-popup" ref={popupRef}>
                  <MyProfileCard name={user?.name} dept={user?.dept} />
                  <MyMenuList pushEnabled={pushEnabled} onTogglePush={handleTogglePush} onUpdateProfile={() => {}} onLogout={handleLogout} user={user} />
                </div>
              )}
            </div>
            <button className="header__action-btn header__action-btn--logout" onClick={handleLogout}>
              <LogOut size={16} /><span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 모바일: 상단 로고 */}
      <div className="header-mobile-logo" onClick={() => navigate("/complain-dashboard")}>
        <img src={logo} alt="로고" />
      </div>

      {/* 모바일: 하단 고정 메뉴 */}
      <nav className="header-mobile-nav">
        {menuItems.map((item, index) => {
          const isActive = activeIndex === index;
          const isHovered = hoveredIndex === index;
          const showActiveIcon = isActive || isHovered;
          return (
            <button
              key={item.name}
              className={`header-mobile-nav__btn ${isActive ? "header-mobile-nav__btn--active" : ""}`}
              onClick={() => handleMenuClick(index, item.path)}
              style={{ order: item.order }}
            >
              <item.Icon size={24} strokeWidth={showActiveIcon ? 2.5 : 1.5} />
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Header;
