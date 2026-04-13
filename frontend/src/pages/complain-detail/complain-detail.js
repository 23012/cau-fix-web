import { useLocation, useNavigate } from "react-router-dom";
import Detail from "../../components/detail/detail";
import "./complain-detail.css";

const ComplainDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const complainData = location.state?.data;
  const showProgress = location.state?.showProgress || false;

  const handleClose = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  return (
    <div className="complain-detail-page">
      <Detail 
        isOpen={true} 
        onClose={handleClose} 
        data={complainData}
        showProgress={showProgress}
      />
    </div>
  );
};

export default ComplainDetail;
