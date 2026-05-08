import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import PushItem from "../../components/push/PushItem";
import usePush from "../../hooks/usePush";
import { getComplaintDetail } from "../../services/complainService";
import { normalizeStatus } from "../../constants/status";
import "./push-list.css";
import "../../styles/global.css";

const PushList = () => {
  const navigate = useNavigate();
  const { recentPush, todayPush, earlierPush, refetch } = usePush();

  // 페이지 진입 시 항상 최신 데이터 로드
  useEffect(() => { refetch(); }, [refetch]);

  const handlePushClick = async (push) => {
    if (!push.complainId) return;
    try {
      const result = await getComplaintDetail(push.complainId);
      const complain = {
        ...result.complain,
        status: normalizeStatus(result.complain.status),
      };
      navigate("/complain-detail", { state: { data: complain, showProgress: true } });
    } catch {
      // 상세 조회 실패 시 ID만으로 이동
      navigate("/complain-detail", { state: { data: { id: push.complainId }, showProgress: true } });
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
