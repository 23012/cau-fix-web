import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/common/topbar";
import MenuBar from "../../components/common/menubar";
import ComplainForm from "../../components/form/ComplainForm";
import "./complain-write.css";
import "../../styles/global.css";

const ComplainWrite = () => {
  const navigate = useNavigate();
  const [formOpen] = useState(true);

  const handleSubmit = (data) => {
    // TODO: 실제 API 연동 시 서버로 전송
    alert("민원이 접수되었습니다.");
    navigate("/complain-dashboard");
  };

  return (
    <div className="page-container">
      <div className="write-container">
        <div className="write-header">
          <TopBar />
          <div className="write-header-menubar">
            <MenuBar />
          </div>
        </div>
        <MenuBar />
        <ComplainForm
          isOpen={formOpen}
          onClose={() => navigate("/complain-dashboard")}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default ComplainWrite;
