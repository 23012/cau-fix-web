import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import alarmDataFile from "../assets/files/alarm-data.xlsx";
import sampleFile from "../assets/files/sample.xlsx";
import loginDataFile from "../assets/files/logindata.xlsx";
import { normalizeStatus } from "../constants/status";
import { normalizeCategory } from "../constants/categories";

const parseExcelTime = (value) => {
  if (typeof value === "string") {
    return new Date(value.trim());
  }
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + value * 86400000);
};

const useAlarms = () => {
  const [alarms, setAlarms] = useState([]);
  const [complains, setComplains] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [alarmRes, sampleRes, loginRes] = await Promise.all([
          fetch(alarmDataFile),
          fetch(sampleFile),
          fetch(loginDataFile),
        ]);

        // 알림 데이터
        const alarmBuffer = await alarmRes.arrayBuffer();
        const alarmWb = XLSX.read(alarmBuffer, { type: "array" });
        const alarmSheet = alarmWb.Sheets[alarmWb.SheetNames[0]];
        const alarmRows = XLSX.utils.sheet_to_json(alarmSheet);

        const parsedAlarms = alarmRows.map((row) => ({
          id: row["push_id"],
          memberId: row["member_id"] || null,
          title: row["push_content"] || "",
          desc: `${row["push_content"] || ""} 민원이 ${normalizeStatus(row["state"])} 처리되었습니다.`,
          time: parseExcelTime(row["push_at"]),
          read: row["is_read"] === true || row["is_read"] === "true",
          complainId: row["complain_id"] || null,
          state: normalizeStatus(row["state"]) || "",
        }));
        setAlarms(parsedAlarms);

        // 민원 + 처리 데이터
        const sampleBuffer = await sampleRes.arrayBuffer();
        const sampleWb = XLSX.read(sampleBuffer, { type: "array" });

        const loginBuffer = await loginRes.arrayBuffer();
        const loginWb = XLSX.read(loginBuffer, { type: "array" });
        const loginSheet = loginWb.Sheets[loginWb.SheetNames[0]];
        const loginRows = XLSX.utils.sheet_to_json(loginSheet);
        const memberMap = {};
        const memberByIdMap = {};
        loginRows.forEach((row) => {
          const name = row["name"]?.toString();
          const memberId = row["member_id"];
          if (name) {
            memberMap[name] = {
              department: row["dept"]?.toString() || null,
              phone: row["phone"]?.toString() || null,
            };
          }
          if (memberId != null) {
            memberByIdMap[String(memberId)] = {
              name: name || null,
              department: row["dept"]?.toString() || null,
              phone: row["phone"]?.toString() || null,
            };
          }
        });

        const complainSheet = sampleWb.Sheets["민원"];
        const complainRows = XLSX.utils.sheet_to_json(complainSheet);
        const resultSheet = sampleWb.Sheets["처리"];
        const resultRows = XLSX.utils.sheet_to_json(resultSheet);

        const resultMap = {};
        resultRows.forEach((row) => {
          resultMap[row["complain_id"]] = {
            resultContent: row["process_content"],
            resultPersonId: row["process_by"],
            resultPerson: memberByIdMap[String(row["process_by"])]?.name || null,
            resultDate: row["process_at"],
          };
        });

        const parsedComplains = complainRows.map((row) => ({
          id: row["complain_id"],
          complainBy: row["complain_by"] || null,
          reporterName: memberByIdMap[String(row["complain_by"])]?.name || null,
          reporterPhone: memberByIdMap[String(row["complain_by"])]?.phone || null,
          dept: memberByIdMap[String(row["complain_by"])]?.department || null,
          category: normalizeCategory(row["category_id"]),
          title: row["complain_title"],
          content: row["complain_content"],
          result: resultMap[row["complain_id"]]?.resultContent || null,
          resultPerson: resultMap[row["complain_id"]]?.resultPerson || null,
          resultDate: resultMap[row["complain_id"]]?.resultDate || null,
          resultDept: memberByIdMap[String(resultMap[row["complain_id"]]?.resultPersonId)]?.department || null,
          resultPhone: memberByIdMap[String(resultMap[row["complain_id"]]?.resultPersonId)]?.phone || null,
          location: row["location"],
          status: normalizeStatus(row["state"]),
          date: row["complain_at"],
        }));
        setComplains(parsedComplains);
      } catch (error) {
        // 데이터 로드 실패 시 빈 목록 유지
      }
    };
    loadData();
  }, []);

  const user = useMemo(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const recentAlarms = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    return alarms
      .filter((a) => a.time >= sevenDaysAgo)
      .filter((a) => !user || String(a.memberId) === String(user.id));
  }, [alarms, user]);

  const todayAlarms = recentAlarms.filter((a) => a.time.toDateString() === new Date().toDateString());
  const earlierAlarms = recentAlarms.filter((a) => a.time.toDateString() !== new Date().toDateString());
  const unreadCount = recentAlarms.filter((a) => !a.read).length;

  // 알림의 번호로 연결된 민원 찾기
  const getComplainForAlarm = (alarm) => {
    if (!alarm.complainId) return null;
    return complains.find((c) => c.id === alarm.complainId) || null;
  };

  return { recentAlarms, todayAlarms, earlierAlarms, unreadCount, complains, getComplainForAlarm };
};

export default useAlarms;
