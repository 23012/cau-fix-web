import { useComplainDataContext } from "../context/ComplainDataContext";

/**
 * 민원 데이터 공통 훅 (Context 기반)
 * 기존 인터페이스 유지: { tableData, setTableData, loading, refetch }
 * 
 * 이제 어디서 호출하든 동일한 데이터 인스턴스를 참조합니다.
 * refetch()를 호출하면 이 훅을 사용하는 모든 컴포넌트가 동시에 갱신됩니다.
 */
const useComplainData = () => {
  return useComplainDataContext();
};

export default useComplainData;
