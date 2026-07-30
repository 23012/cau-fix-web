import "./complain.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, RefreshCw } from "lucide-react";
import useComplainData from "../../hooks/useComplainData";
import useComplainFilter from "../../hooks/useComplainFilter";
import { createComplaint, uploadComplainImages, getComplaints } from "../../services/complainService";
import { normalizeStatus } from "../../constants/status";
import Search from "../common/search";
import ComplainForm from "../form/ComplainForm";
import ConfirmPopup from "../detail/ConfirmPopup";
import Detail from "../detail/detail";
import MyStorage from "./MyStorage";
import ChartSection from "./ChartSection";
import ComplainTable from "./ComplainTable";

import useCategories from "../../hooks/useCategories";

/**
 * 민원 대시보드 (사용자/처리자 메인 화면)
 */
const Complain = () => {
  const navigate = useNavigate();
  const { tableData, setTableData, refetch } = useComplainData();
  const { categories } = useCategories();
  const {
    user, sortOrder, setSortOrder,
    selectedYear, selectedMonth,
    activeStatusTab, currentPage, setCurrentPage,
    favorites, totalPages, currentData,
    chartBaseData,
    handleSearchChange, handleYearChange, handleMonthChange,
    handleFilterApply, handleStatusTabChange, toggleFavorite,
  } = useComplainFilter(tableData);

  const [complainFormOpen, setComplainFormOpen] = useState(false);
  const [myStorageOpen, setMyStorageOpen] = useState(false);
  const [selectedComplain, setSelectedComplain] = useState(null);
  const [fromStorage, setFromStorage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  //새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  //민원 테이블에서 행 클릭 시 상세 페이지로 이동
  const handleRowClick = (row) => {
    if (window.innerWidth <= 768) {
      navigate("/complain-detail", { state: { data: row } });
    } else {
      setFromStorage(false);
      setSelectedComplain(row);
    }
  };

  return (
    <div className="dashboard">
      <div className="mobile-header">
        <div className="mobile-title-row">
          <h1 className="mobile-title">내 민원</h1>
          {/*처리자 부서 표시*/}
          {user?.role === "처리자" && user?.dept && (
            <span className="mobile-dept-badge">{user.dept}</span>
          )}
          {user?.role !== "관리자" && (
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing} aria-label="새로고침">
              <RefreshCw size={20} className={refreshing ? "refresh-spin" : ""} />
            </button>
          )}
        </div>
        <Search onSearchChange={handleSearchChange} />
      </div>

      <div className="main">
        {/*원그래프*/}
        <ChartSection
          data={chartBaseData}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          onFavoriteClick={() => handleStatusTabChange("즐겨찾기")}
          activeStatusTab={activeStatusTab}
          onDateRangeChange={(start, end) => {
            handleFilterApply({
              statuses: [],
              category: "",
              startDate: start ? { year: start.slice(0,4), month: start.slice(5,7), day: start.slice(8,10) } : { year: "", month: "", day: "" },
              endDate: end ? { year: end.slice(0,4), month: end.slice(5,7), day: end.slice(8,10) } : { year: "", month: "", day: "" },
            });
          }}
        />
        {/*테이블*/}
        <ComplainTable
          user={user}
          currentData={currentData}
          favorites={favorites}
          activeStatusTab={activeStatusTab}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          onSearchChange={handleSearchChange}
          onStatusTabChange={handleStatusTabChange}
          onFilterApply={handleFilterApply}
          onToggleFavorite={toggleFavorite}
          onRowClick={handleRowClick}
        />
      </div>
      <div className="fab">
        {/*처리자 - 내 처리함*/}
        {user?.role === "처리자" ? (
          <button className="fab-btn" onClick={() => setMyStorageOpen(true)}><FolderOpen /></button>
        ) : (
          <button className="fab-btn" onClick={() => setComplainFormOpen(true)}><Plus /></button>
        )} {/*사용자 - 민원 등록*/}
      </div>

      {/*사용자 - 민원 등록*/}
      <ComplainForm isOpen={complainFormOpen} onClose={() => setComplainFormOpen(false)} onSubmit={async (formData) => {
        const cat = categories.find((c) => c.category_name === formData.category);
        const result = await createComplaint({
          category_id: cat?.category_id,
          title: formData.title,
          content: formData.content,
          location: formData.location,
        });
        if (formData.images?.length > 0 && result.complain?.id) {
          await uploadComplainImages(result.complain.id, formData.images.map((img) => img.file));
        }
        // native alert + 즉시 reload 조합은 PWA(standalone)에서 알림이 안 뜨고
        // 새로고침만 되어버린다. 목록을 갱신한 뒤 앱 팝업으로 완료를 안내한다.
        await refetch();
        setSubmitSuccess(true);
      }} />

      {/*민원 등록 완료 안내*/}
      <ConfirmPopup
        isOpen={submitSuccess}
        message="민원이 등록되었습니다."
        onConfirm={() => setSubmitSuccess(false)}
      />

      {/*처리자 - 내 처리함*/}
      <MyStorage
        isOpen={myStorageOpen}
        onClose={() => setMyStorageOpen(false)}
        data={tableData.filter((row) => String(row.resultPersonId) === String(user?.member_id))}
        onSelect={(row) => { setFromStorage(true); setSelectedComplain(row); }}
      />

      {/*민원 상세*/}
      <Detail
        isOpen={!!selectedComplain}
        onClose={() => { setSelectedComplain(null); refetch(); }}
        data={selectedComplain}
        fromStorage={fromStorage}
        onUpdate={async (updated) => {
          if (updated._deleted) {
            setTableData((prev) => prev.filter((r) => r.id !== updated.id));
            setSelectedComplain(null);
          } else {
            // 목록 새로고침
            try {
              const result = await getComplaints();
              const parsed = result.complaints.map((row) => ({
                id: row.id, complainBy: row.complainBy || null,
                reporterName: row.memberName || null, reporterPhone: row.memberPhone || null,
                dept: row.memberDept || null, category: row.category,
                title: row.title, content: row.content, location: row.location || null,
                status: normalizeStatus(row.status), date: row.date,
                image: null, result: row.result || null,
                resultPerson: row.resultPerson || null, resultPersonId: row.resultPersonId || null,
                resultDate: row.resultDate || null, resultDept: row.resultDept || null,
                resultPhone: row.resultPhone || null,
              }));
              setTableData(parsed);
              setSelectedComplain(parsed.find((r) => r.id === updated.id) || null);
            } catch (e) {
              setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setSelectedComplain(updated);
            }
          }
        }}
      />
    </div>
  );
};

export default Complain;
