import { useState, useEffect, useMemo, useCallback } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "../services/notificationService";
import useComplainData from "./useComplainData";

/**
 * 푸시 알림 데이터를 API에서 로딩하는 훅
 */
const usePush = () => {
  const [pushList, setPushList] = useState([]);
  const { tableData: complains, refetch: refetchComplains } = useComplainData();

  const loadPush = useCallback(async () => {
    try {
      const result = await getNotifications();
      setPushList((result.notifications || []).map((n) => ({
        id: n.id,
        memberId: null,
        title: n.title || "",
        desc: n.content || "",
        time: new Date(n.time),
        read: n.read,
        complainId: n.complainId || null,
        state: n.state || "",
      })));
    } catch (error) {
      // 로드 실패 시 빈 목록 유지
    }
  }, []);

  useEffect(() => { loadPush(); }, [loadPush]);

  // 페이지 포커스 시 자동 갱신
  useEffect(() => {
    const handleFocus = () => {
      loadPush();
      refetchComplains?.();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadPush, refetchComplains]);

  const recentPush = pushList;
  const todayPush = recentPush.filter((a) => a.time.toDateString() === new Date().toDateString());
  const earlierPush = recentPush.filter((a) => a.time.toDateString() !== new Date().toDateString());
  const unreadCount = recentPush.filter((a) => !a.read).length;

  const getComplainForPush = (push) => {
    if (!push.complainId) return null;
    return complains.find((c) => c.id === push.complainId) || null;
  };

  const handleMarkAsRead = async (pushId) => {
    try {
      await markAsRead(pushId);
      setPushList((prev) => prev.map((p) => p.id === pushId ? { ...p, read: true } : p));
    } catch (e) { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setPushList((prev) => prev.map((p) => ({ ...p, read: true })));
    } catch (e) { /* ignore */ }
  };

  return { recentPush, todayPush, earlierPush, unreadCount, complains, getComplainForPush, handleMarkAsRead, handleMarkAllAsRead, refetch: loadPush };
};

export default usePush;
