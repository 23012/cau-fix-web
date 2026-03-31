import logo from '../../assets/images/app.png';
import './MyProfileCard.css';

const MyProfileCard = ({ name, department }) => {
  return (
    <div className="myinfo-profile-card">
      <div className="myinfo-avatar">
        <img src={logo} alt="프로필" />
      </div>
      <div className="myinfo-name-area">
        <div className="myinfo-name-row">
          <span className="myinfo-name">{name || "-"}</span>
          <span className="myinfo-suffix">님</span>
        </div>
        <div className="myinfo-dept-badge">{department || "-"}</div>
      </div>
    </div>
  );
};

export default MyProfileCard;
