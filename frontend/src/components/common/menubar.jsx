import { useState } from "react";
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
  { name: "내 민원", icon: homeIcon, activeIcon: homeClickIcon, order: 2 },
  { name: "공지사항", icon: noticeIcon, activeIcon: noticeClickIcon, order: 1 },
  { name: "알림", icon: alarmIcon, activeIcon: alarmClickIcon, order: 3 },
  { name: "내 정보", icon: profileIcon, activeIcon: profileClickIcon, order: 4 }
];

const MenuBar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
                onClick={() => setActiveIndex(index)}
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
