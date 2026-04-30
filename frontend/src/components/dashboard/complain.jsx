import "./complain.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen } from "lucide-react";
import useComplainData from "../../hooks/useComplainData";
import useComplainFilter from "../../hooks/useComplainFilter";
import Search from "../common/search";
import ComplainForm from "../form/ComplainForm";
import Detail from "../detail/detail";
import MyStorage from "./MyStorage";
import ChartSection from "./ChartSection";
import ComplainTable from "./ComplainTable";

/**
 * 민원 대시보드 (사용자/처리자 메인 화면)
 * TODO: 백엔드 연결 시
 *   - useComplainData 훅 내부가 API 호출로 교체됨
 *   - 즐겨찾기: POST/DELETE /api/favorites/{complainId}
 *   - 민원 접수: POST /api/complains
 */
const Complain = () => {
  const navigate = useNavigate();
  const { tableData, setTableData } = useComplainData();
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

      <ComplainForm isOpen={complainFormOpen} onClose={() => setComplainFormOpen(false)} onSubmit={() => setComplainFormOpen(false)} />

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
        onUpdate={(updated) => {
          setTableData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setSelectedComplain(updated);
        }}
      />
    </div>
  );
};

export default Complain;
