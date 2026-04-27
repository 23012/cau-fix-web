import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import alarmDataFile from "../assets/files/alarm-data.xlsx";
import useComplainData from "./useComplainData";
import { normalizeStatus } from "../constants/status";

/**
 * 알림 + 민원 데이터를 로딩하는 훅
 * TODO: 백엔드 연결 시
 *   - 알림: GET /api/alarms?userId={userId}&days=7
 *   - 민원: useComplainData 훅이 자동으로 API 호출
 *   - 읽음 처리: PATCH /api/alarms/{id}/read
 */

const parseExcelTime = (value) => {
  if (typeof value === "string") return new Date(value.trim());
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + value * 86400000);
};

const useAlarms = () => {
  const [alarms, setAlarms] = useState([]);
  const { tableData: complains } = useComplainData();

  /* 알림 데이터 로딩 */
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const res = await fetch(alarmDataFile);
        const buffer = await res.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        setAlarms(rows.map((row) => ({
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
        // 알림 로드 실패 시 빈 목록 유지
      }
    };
    loadAlarms();
  }, []);

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  /* 최근 7일 내 알림 (현재 사용자 기준) */
  const recentAlarms = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return alarms
      .filter((a) => a.time >= sevenDaysAgo)
      .filter((a) => !user || String(a.memberId) === String(user.id));
  }, [alarms, user]);

  const todayAlarms = recentAlarms.filter((a) => a.time.toDateString() === new Date().toDateString());
  const earlierAlarms = recentAlarms.filter((a) => a.time.toDateString() !== new Date().toDateString());
  const unreadCount = recentAlarms.filter((a) => !a.read).length;

  /** 알림에 연결된 민원 데이터 조회 */
  const getComplainForAlarm = (alarm) => {
    if (!alarm.complainId) return null;
    return complains.find((c) => c.id === alarm.complainId) || null;
  };

  return { recentAlarms, todayAlarms, earlierAlarms, unreadCount, complains, getComplainForAlarm };
};

export default useAlarms;
