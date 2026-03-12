import logo from "../../assests/images/logo.svg";
import "./topbar.css";

const topbar = () => {
  return (
    <div className="flex items-center justify-center py-4 border-b border-border bg-background">
      <img src={logo} alt="중앙대학교광명병원 로고" className="h-10" />
    </div>
  );
};

export default topbar;