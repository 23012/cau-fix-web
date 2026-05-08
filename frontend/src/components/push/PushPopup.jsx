import { useState } from "react";
import { Bell } from "lucide-react";
import usePush from "../../hooks/usePush";
import PushItem from "./PushItem";
import PushComplainView from "./PushComplainView";
import { getComplaintDetail } from "../../services/complainService";
import { normalizeStatus } from "../../constants/status";
import "./PushPopup.css";

const PushPopup = ({ onClose }) => {
  const { recentPush, todayPush, earlierPush, unreadCount, handleMarkAsRead, handleMarkAllAsRead } = usePush();
  const [selectedComplain, setSelectedComplain] = useState(null);

  const handlePushClick = async (push) => {
    if (!push.read) handleMarkAsRead(push.id);
    if (!push.complainId) return;
    try {
      const result = await getComplaintDetail(push.complainId);
      const complain = {
        ...result.complain,
        status: normalizeStatus(result.complain.status),
      };
      setSelectedComplain(complain);
    } catch {
      // 조회 실패 시 무시
    }
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
        {unreadCount > 0 && (
          <button className="push-popup-read-all" onClick={handleMarkAllAsRead}>전체 읽음</button>
        )}
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
