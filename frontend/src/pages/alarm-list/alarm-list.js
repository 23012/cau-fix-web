import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TopBar from "../../components/common/topbar";
import MenuBar from "../../components/common/menubar";
import AlarmItem from "../../components/alarm/AlarmItem";
import useAlarms from "../../hooks/useAlarms";
import "./alarm-list.css";
import "../../styles/global.css";

const AlarmList = () => {
  const navigate = useNavigate();
  const { recentAlarms, todayAlarms, earlierAlarms, getComplainForAlarm } = useAlarms();

  const handleAlarmClick = (alarm) => {
    const complain = getComplainForAlarm(alarm);
    if (complain) {
      navigate("/complain-detail", { state: { data: complain, showProgress: true } });
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <TopBar />
          <div className="dashboard-header-menubar">
            <MenuBar />
          </div>
        </div>
        <MenuBar />
        <div className="dashboard-content">
          <div className="alarm-page">
            <div className="alarm-page-header">
              <button className="alarm-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={22} />
              </button>
              <h1>알림</h1>
            </div>

            {recentAlarms.length === 0 ? (
              <div className="alarm-empty">최근 7일간 알림이 없습니다.</div>
            ) : (
              <>
                {todayAlarms.length > 0 && (
                  <div className="alarm-section">
                    <h2 className="alarm-section-title">오늘</h2>
                    {todayAlarms.map((alarm) => (
                      <AlarmItem
                        key={alarm.id}
                        alarm={alarm}
                        size="large"
                        onClick={alarm.complainId ? () => handleAlarmClick(alarm) : undefined}
                      />
                    ))}
                  </div>
                )}
                {earlierAlarms.length > 0 && (
                  <div className="alarm-section">
                    <h2 className="alarm-section-title">이번 주</h2>
                    {earlierAlarms.map((alarm) => (
                      <AlarmItem
                        key={alarm.id}
                        alarm={alarm}
                        size="large"
                        onClick={alarm.complainId ? () => handleAlarmClick(alarm) : undefined}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmList;
