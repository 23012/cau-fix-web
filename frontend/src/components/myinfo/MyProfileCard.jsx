import { ChevronDown } from 'lucide-react';
import logo from '../../assets/images/app.png';
import './MyProfileCard.css';

const MyProfileCard = ({ name, dept, onClick }) => {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`myinfo-profile-card ${clickable ? 'myinfo-profile-card--clickable' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="myinfo-avatar">
        <img src={logo} alt="프로필" />
      </div>
      <div className="myinfo-name-area">
        <div className="myinfo-name-row">
          <span className="myinfo-name">{name || "-"}</span>
          <span className="myinfo-suffix">님</span>
        </div>
        <div className="myinfo-dept-badge">{dept || "-"}</div>
      </div>
      {clickable && (
        <ChevronDown className="myinfo-profile-caret" size={22} />
      )}
    </div>
  );
};

export default MyProfileCard;
