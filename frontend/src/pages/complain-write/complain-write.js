import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import ComplainForm from "../../components/form/ComplainForm";
import "./complain-write.css";
import "../../styles/global.css";

const ComplainWrite = () => {
  const navigate = useNavigate();
  const [formOpen] = useState(true);

  const handleSubmit = (data) => {
    alert("민원이 접수되었습니다.");
    navigate("/complain-dashboard");
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
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
