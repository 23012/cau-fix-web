import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import PushItem from "../../components/push/PushItem";
import usePush from "../../hooks/usePush";
import "./push-list.css";
import "../../styles/global.css";

const PushList = () => {
  const navigate = useNavigate();
  const { recentPush, todayPush, earlierPush, getComplainForPush } = usePush();

  const handlePushClick = (push) => {
    const complain = getComplainForPush(push);
    if (complain) {
      navigate("/complain-detail", { state: { data: complain, showProgress: true } });
    }
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="push-page">

          {recentPush.length === 0 ? (
            <div className="push-empty">최근 7일간 알림이 없습니다.</div>
          ) : (
            <>
              {todayPush.length > 0 && (
                <div className="push-section">
                  <h2 className="push-section-title">오늘</h2>
                  {todayPush.map((push) => (
                    <PushItem
                      key={push.id}
                      push={push}
                      size="large"
                      onClick={push.complainId ? () => handlePushClick(push) : undefined}
                    />
                  ))}
                </div>
              )}
              {earlierPush.length > 0 && (
                <div className="push-section">
                  <h2 className="push-section-title">이번 주</h2>
                  {earlierPush.map((push) => (
                    <PushItem
                      key={push.id}
                      push={push}
                      size="large"
                      onClick={push.complainId ? () => handlePushClick(push) : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PushList;
