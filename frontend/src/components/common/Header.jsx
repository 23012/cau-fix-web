import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Bell, User, Users, LogOut, MessageSquareWarning } from "lucide-react";
import MyProfileCard from "../myinfo/MyProfileCard";
import MyMenuList from "../myinfo/MyMenuList";
import PushPopup from "../push/PushPopup";
import { normalizeRole } from "../../constants/roles";
import { subscribePush, unsubscribePush } from "../../utils/pushSubscription";
import { updateMyProfile } from "../../services/memberService";
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
    items.splice(1, 0, { name: "리스트", Icon: MessageSquareWarning, order: 2, path: "/admin/complains" });
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
  const [mobileDashboardMenuOpen, setMobileDashboardMenuOpen] = useState(false);
  const [mobileDashboardPopupStyle, setMobileDashboardPopupStyle] = useState({ left: "50%", bottom: "66px" });
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem("pushEnabled") !== "false");

  const popupRef = useRef(null);
  const btnRef = useRef(null);
  const pushPopupRef = useRef(null);
  const pushBtnRef = useRef(null);
  const mobileDashboardBtnRef = useRef(null);
  const mobileDashboardPopupRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");
  const menuItems = getMenuItems(role);
  const mobileMenuItems = menuItems.filter((item) => !(role === "관리자" && item.path === "/admin/complains"));
  const mobileDashboardMenuItems = role === "관리자" ? [
    { name: "대시보드", path: "/complain-dashboard" },
    { name: "리스트", path: "/admin/complains" },
  ] : [];
  const isDashboardGroupActive = role === "관리자" && ["/complain-dashboard", "/admin/complains"].includes(location.pathname);

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
      if (mobileDashboardMenuOpen && mobileDashboardPopupRef.current && !mobileDashboardPopupRef.current.contains(e.target) && mobileDashboardBtnRef.current && !mobileDashboardBtnRef.current.contains(e.target)) {
        setMobileDashboardMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [myinfoOpen, pushOpen, mobileDashboardMenuOpen]);

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleTogglePush = async () => {
    const next = !pushEnabled;
    setPushEnabled(next);
    localStorage.setItem("pushEnabled", next.toString());
    try {
      if (next) {
        await subscribePush();
      } else {
        await unsubscribePush();
      }
    } catch (err) {
      // 푸시 토글 실패
    }
  };

  const handleMenuClick = (index, path) => {
    setActiveIndex(index);
    navigate(path);
  };

  const handleMobileNavClick = (item, index) => {
    if (role === "관리자" && item.path === "/complain-dashboard") {
      if (!mobileDashboardMenuOpen && mobileDashboardBtnRef.current) {
        const rect = mobileDashboardBtnRef.current.getBoundingClientRect();
        setMobileDashboardPopupStyle({
          left: `${rect.left + rect.width / 2}px`,
          bottom: `${window.innerHeight - rect.top + 8}px`,
        });
      }
      setMobileDashboardMenuOpen((prev) => !prev);
      return;
    }
    const realIndex = menuItems.findIndex((menuItem) => menuItem.path === item.path);
    if (realIndex !== -1) setActiveIndex(realIndex);
    navigate(item.path);
    setMobileDashboardMenuOpen(false);
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
                  <MyMenuList pushEnabled={pushEnabled} onTogglePush={handleTogglePush} onUpdateProfile={async ({ password, phone, dept }) => {
                    try {
                      await updateMyProfile({ password, phone, dept });
                      const updated = { ...user, phone, dept };
                      localStorage.setItem("user", JSON.stringify(updated));
                      setUser(updated);
                    } catch (err) {
                      alert(err.message || "정보 수정 중 오류가 발생했습니다.");
                      throw err;
                    }
                  }} onLogout={handleLogout} user={user} />
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
        {mobileDashboardMenuOpen && (
          <div className="header-mobile-dashboard-popup" ref={mobileDashboardPopupRef} style={mobileDashboardPopupStyle}>
            {mobileDashboardMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  type="button"
                  className={`header-mobile-dashboard-popup__item ${isActive ? "header-mobile-dashboard-popup__item--active" : ""}`}
                  onClick={() => {
                    navigate(item.path);
                    setActiveIndex(menuItems.findIndex((menuItem) => menuItem.path === item.path));
                    setMobileDashboardMenuOpen(false);
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        )}

        {mobileMenuItems.map((item, index) => {
          const realIndex = menuItems.findIndex((menuItem) => menuItem.path === item.path);
          const isActive = location.pathname === item.path
            || (item.path === "/complain-dashboard" && isDashboardGroupActive);
          const isHovered = hoveredIndex === realIndex;
          const showActiveIcon = isActive || isHovered;
          return (
            <button
              key={item.name}
              ref={item.path === "/complain-dashboard" ? mobileDashboardBtnRef : null}
              className={`header-mobile-nav__btn ${isActive ? "header-mobile-nav__btn--active" : ""}`}
              onClick={() => handleMobileNavClick(item, index)}
              style={{ order: item.order }}
              aria-label={item.name}
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
