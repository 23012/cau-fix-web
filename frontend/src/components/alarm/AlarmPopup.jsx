import { useState } from "react";
import { Bell } from "lucide-react";
import useAlarms from "../../hooks/useAlarms";
import AlarmItem from "./AlarmItem";
import AlarmComplainView from "./AlarmComplainView";
import "./AlarmPopup.css";

const AlarmPopup = ({ onClose }) => {
  const { recentAlarms, todayAlarms, earlierAlarms, unreadCount, getComplainForAlarm } = useAlarms();
  const [selectedComplain, setSelectedComplain] = useState(null);

  const handleAlarmClick = (alarm) => {
    const complain = getComplainForAlarm(alarm);
    if (complain) setSelectedComplain(complain);
  };

  // 민원 상세 뷰
  if (selectedComplain) {
    return (
      <div className="alarm-popup">
        <AlarmComplainView
          data={selectedComplain}
          onBack={() => setSelectedComplain(null)}
        />
      </div>
    );
  }

  // 알림 목록 뷰
  return (
    <div className="alarm-popup">
      <div className="alarm-popup-header">
        <Bell size={18} />
        <span>알림</span>
        {unreadCount > 0 && <span className="alarm-popup-badge">{unreadCount}</span>}
      </div>

      <div className="alarm-popup-body">
        {recentAlarms.length === 0 ? (
          <div className="alarm-popup-empty">최근 7일간 알림이 없습니다.</div>
        ) : (
          <>
            {todayAlarms.length > 0 && (
              <>
                <div className="alarm-popup-section-title">오늘</div>
                {todayAlarms.map((alarm) => (
                  <AlarmItem
                    key={alarm.id}
                    alarm={alarm}
                    onClick={alarm.complainId ? () => handleAlarmClick(alarm) : undefined}
                  />
                ))}
              </>
            )}
            {earlierAlarms.length > 0 && (
              <>
                <div className="alarm-popup-section-title">이번 주</div>
                {earlierAlarms.map((alarm) => (
                  <AlarmItem
                    key={alarm.id}
                    alarm={alarm}
                    onClick={alarm.complainId ? () => handleAlarmClick(alarm) : undefined}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlarmPopup;
