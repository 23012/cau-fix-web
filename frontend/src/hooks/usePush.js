import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import alarmDataFile from "../assets/files/alarm-data.xlsx";
import useComplainData from "./useComplainData";
import { normalizeStatus } from "../constants/status";

/**
 * 푸시 알림 + 민원 데이터를 로딩하는 훅
 * TODO: 백엔드 연결 시
 *   - 푸시: GET /api/push?userId={userId}&days=7
 *   - 민원: useComplainData 훅이 자동으로 API 호출
 *   - 읽음 처리: PATCH /api/push/{id}/read
 */

const parseExcelTime = (value) => {
  if (typeof value === "string") return new Date(value.trim());
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + value * 86400000);
};

const usePush = () => {
  const [pushList, setPushList] = useState([]);
  const { tableData: complains } = useComplainData();

  useEffect(() => {
    const loadPush = async () => {
      try {
        const res = await fetch(alarmDataFile);
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        setPushList(rows.map((row) => ({
          id: row["push_id"],
          memberId: row["member_id"] || null,
          title: row["push_content"] || "",
          desc: `${row["push_content"] || ""} 민원이 ${normalizeStatus(row["state"])} 처리되었습니다.`,
          time: parseExcelTime(row["push_at"]),
          read: row["is_read"] === true || row["is_read"] === "true",
          complainId: row["complain_id"] || null,
          state: normalizeStatus(row["state"]) || "",
        })));
      } catch (error) {
        // 푸시 로드 실패 시 빈 목록 유지
      }
    };
    loadPush();
  }, []);

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const recentPush = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return pushList
      .filter((a) => a.time >= sevenDaysAgo)
      .filter((a) => !user || String(a.memberId) === String(user.id));
  }, [pushList, user]);

  const todayPush = recentPush.filter((a) => a.time.toDateString() === new Date().toDateString());
  const earlierPush = recentPush.filter((a) => a.time.toDateString() !== new Date().toDateString());
  const unreadCount = recentPush.filter((a) => !a.read).length;

  const getComplainForPush = (push) => {
    if (!push.complainId) return null;
    return complains.find((c) => c.id === push.complainId) || null;
  };

  return { recentPush, todayPush, earlierPush, unreadCount, complains, getComplainForPush };
};

export default usePush;
