import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Bell, User } from "lucide-react";
import { normalizeRole } from "../../constants/roles";
import "./menubar.css";

const getMenuItems = (role) => {
  const dashboardName = role === "관리자" ? "대시보드" : "내 민원";
  const items = [
    { name: dashboardName, Icon: LayoutDashboard, order: 1, path: "/complain-dashboard" },
    { name: "공지사항", Icon: ClipboardList, order: 3, path: "/notice" },
    { name: "알림", Icon: Bell, order: 4, path: "/alarm-list", mobileOnly: true },
    { name: "내 정보", Icon: User, order: 5, path: "/myinfo", mobileOnly: true }
  ];
  if (role === "관리자") {
    items.splice(1, 0, { name: "민원 리스트", Icon: ClipboardList, order: 2, path: "/admin/complains" });
  }
  return items;
};

const MenuBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");
  const menuItems = getMenuItems(role);

  useEffect(() => {
    const currentIndex = menuItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, menuItems]);

  const handleMenuClick = (index, path) => {
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <nav className="menubar">
      <ul className="menubar__list">
        {menuItems.map((item, index) => {
          const isActive = activeIndex === index;
          const isHovered = hoveredIndex === index;
          const showActiveIcon = isActive || isHovered;

          return (
            <li 
              key={item.name} 
              className={`menubar__item ${item.mobileOnly ? "menubar__item--mobile-only" : ""}`}
              style={{ order: item.order }}
            >
              <button
                className={`menubar__button ${isActive ? "menubar__button--active" : ""}`}
                onClick={() => handleMenuClick(index, item.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <item.Icon 
                  size={24}
                  className="menubar__icon"
                  strokeWidth={showActiveIcon ? 2.5 : 1.5}
                />
                <span className="menubar__text">{item.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MenuBar;
