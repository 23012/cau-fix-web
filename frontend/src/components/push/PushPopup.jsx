import { useState } from "react";
import { Bell } from "lucide-react";
import usePush from "../../hooks/usePush";
import PushItem from "./PushItem";
import PushComplainView from "./PushComplainView";
import "./PushPopup.css";

const PushPopup = ({ onClose }) => {
  const { recentPush, todayPush, earlierPush, unreadCount, getComplainForPush } = usePush();
  const [selectedComplain, setSelectedComplain] = useState(null);

  const handlePushClick = (push) => {
    const complain = getComplainForPush(push);
    if (complain) setSelectedComplain(complain);
  };

  if (selectedComplain) {
    return (
      <div className="push-popup">
        <PushComplainView
          data={selectedComplain}
          onBack={() => setSelectedComplain(null)}
        />
      </div>
    );
  }

  return (
    <div className="push-popup">
      <div className="push-popup-header">
        <Bell size={18} />
        <span>알림</span>
        {unreadCount > 0 && <span className="push-popup-badge">{unreadCount}</span>}
      </div>

      <div className="push-popup-body">
        {recentPush.length === 0 ? (
          <div className="push-popup-empty">최근 7일간 알림이 없습니다.</div>
        ) : (
          <>
            {todayPush.length > 0 && (
              <>
                <div className="push-popup-section-title">오늘</div>
                {todayPush.map((push) => (
                  <PushItem
                    key={push.id}
                    push={push}
                    onClick={push.complainId ? () => handlePushClick(push) : undefined}
                  />
                ))}
              </>
            )}
            {earlierPush.length > 0 && (
              <>
                <div className="push-popup-section-title">이번 주</div>
                {earlierPush.map((push) => (
                  <PushItem
                    key={push.id}
                    push={push}
                    onClick={push.complainId ? () => handlePushClick(push) : undefined}
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

export default PushPopup;
