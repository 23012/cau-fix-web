import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./menubar.css";
import homeIcon from "../../assests/icons/home.png";
import homeClickIcon from "../../assests/icons/home-click.png";
import noticeIcon from "../../assests/icons/notice.png";
import noticeClickIcon from "../../assests/icons/notice-click.png";
import alarmIcon from "../../assests/icons/alarm.png";
import alarmClickIcon from "../../assests/icons/alarm-click.png";
import profileIcon from "../../assests/icons/profile.png";
import profileClickIcon from "../../assests/icons/profile-click.png";

const menuItems = [
  { name: "내 민원", icon: homeIcon, activeIcon: homeClickIcon, order: 2, path: "/complain-dashboard" },
  { name: "공지사항", icon: noticeIcon, activeIcon: noticeClickIcon, order: 1, path: "/notice" },
  { name: "알림", icon: alarmIcon, activeIcon: alarmClickIcon, order: 3, path: "/alarm-list" },
  { name: "내 정보", icon: profileIcon, activeIcon: profileClickIcon, order: 4, path: "/myinfo" }
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
                <img 
                  src={showActiveIcon ? item.activeIcon : item.icon} 
                  alt={item.name}
                  className="menubar__icon"
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
