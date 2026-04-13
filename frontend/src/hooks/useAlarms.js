import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import alarmDataFile from "../assets/files/alarm-data.xlsx";
import sampleFile from "../assets/files/sample.xlsx";
import loginDataFile from "../assets/files/logindata.xlsx";

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
          id: row["id"],
          title: row["title"] || "",
          desc: row["desc"] || "",
          time: parseExcelTime(row["time"]),
          read: row["read"] === true || row["read"] === "true",
          complainId: row["번호"] || null,
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
        loginRows.forEach((row) => {
          const name = row["name"]?.toString();
          if (name) {
            memberMap[name] = {
              department: row["department"]?.toString() || null,
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
          resultMap[row["번호"]] = {
            resultContent: row["처리 내용"],
            resultPerson: row["처리자"],
            resultDate: row["처리시간"],
          };
        });

        const parsedComplains = complainRows.map((row) => ({
          id: row["번호"],
          dept: row["부서"],
          category: row["분류"],
          title: row["제목"],
          content: row["민원 내용"],
          result: resultMap[row["번호"]]?.resultContent || null,
          resultPerson: resultMap[row["번호"]]?.resultPerson || null,
          resultDate: resultMap[row["번호"]]?.resultDate || null,
          resultDept: memberMap[resultMap[row["번호"]]?.resultPerson]?.department || null,
          resultPhone: memberMap[resultMap[row["번호"]]?.resultPerson]?.phone || null,
          location: row["장소"],
          status: row["상태"],
          date: row["접수시간"],
          image: row["사진"],
        }));
        setComplains(parsedComplains);
      } catch (error) {
        // 데이터 로드 실패 시 빈 목록 유지
      }
    };
    loadData();
  }, []);

  const recentAlarms = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    return alarms.filter((a) => a.time >= sevenDaysAgo);
  }, [alarms]);

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
