import "./complain.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen } from "lucide-react";
import useComplainData from "../../hooks/useComplainData";
import useComplainFilter from "../../hooks/useComplainFilter";
import { createComplaint, uploadComplainImages, getComplaints } from "../../services/complainService";
import { normalizeStatus } from "../../constants/status";
import Search from "../common/search";
import ComplainForm from "../form/ComplainForm";
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
  const { tableData, setTableData } = useComplainData();
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
          {user?.role === "처리자" && user?.dept && (
            <span className="mobile-dept-badge">{user.dept}</span>
          )}
        </div>
        <Search onSearchChange={handleSearchChange} />
      </div>

      <div className="main">
        <ChartSection
          data={chartBaseData}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          onFavoriteClick={() => handleStatusTabChange("즐겨찾기")}
          onDateRangeChange={(start, end) => {
            handleFilterApply({
              statuses: [],
              category: "",
              startDate: start ? { year: start.slice(0,4), month: start.slice(5,7), day: start.slice(8,10) } : { year: "", month: "", day: "" },
              endDate: end ? { year: end.slice(0,4), month: end.slice(5,7), day: end.slice(8,10) } : { year: "", month: "", day: "" },
            });
          }}
        />

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
        {user?.role === "처리자" ? (
          <button className="fab-btn" onClick={() => setMyStorageOpen(true)}><FolderOpen /></button>
        ) : (
          <button className="fab-btn" onClick={() => setComplainFormOpen(true)}><Plus /></button>
        )}
      </div>

      <ComplainForm isOpen={complainFormOpen} onClose={() => setComplainFormOpen(false)} onSubmit={async (formData) => {
        try {
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
          alert("민원이 등록되었습니다.");
          setComplainFormOpen(false);
          window.location.reload();
        } catch (err) {
          alert(err.message || "민원 등록 중 오류가 발생했습니다.");
        }
      }} />

      <MyStorage
        isOpen={myStorageOpen}
        onClose={() => setMyStorageOpen(false)}
        data={tableData.filter((row) => String(row.resultPersonId) === String(user?.id))}
        onSelect={(row) => { setFromStorage(true); setSelectedComplain(row); }}
      />

      <Detail
        isOpen={!!selectedComplain}
        onClose={() => setSelectedComplain(null)}
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
