import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Bell, User } from "lucide-react";
import "./menubar.css";

const menuItems = [
  { name: "내 민원", Icon: LayoutDashboard, order: 2, path: "/complain-dashboard" },
  { name: "공지사항", Icon: ClipboardList, order: 1, path: "/notice" },
  { name: "알림", Icon: Bell, order: 3, path: "/alarm-list" },
  { name: "내 정보", Icon: User, order: 4, path: "/myinfo" }
];

const MenuBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 현재 경로에 따라 activeIndex 설정
  useEffect(() => {
    const currentIndex = menuItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

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
              className="menubar__item"
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
