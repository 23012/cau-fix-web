import logo from "../../assets/images/logo.svg";
import "./topbar.css";

const TopBar = () => {
  return (
    <div className="topbar_logo">
      <img src={logo} alt="중앙대학교광명병원 로고"/>
    </div>
  );
};

export default TopBar;