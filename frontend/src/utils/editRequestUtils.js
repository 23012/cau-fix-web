/**
 * 민원 수정 요청 관련 유효성 검증 및 비즈니스 로직 유틸리티 함수
 *
 * 각 함수는 설계 문서의 Correctness Properties에 대응하는 순수 함수로 구현됨.
 */

/**
 * Property 1: 메뉴 항목 표시 규칙
 *
 * 처리자의 수정 요청 메뉴 표시 여부를 결정한다.
 *
 * @param {string} complaintStatus - 민원 상태 ("접수중", "진행중", "완료" 등)
 * @param {string} userRole - 사용자 역할 ("처리자", "관리자" 등)
 * @param {boolean} isInProcessingList - 해당 민원이 처리자의 처리현황 목록에 있는지 여부
 * @returns {{ showEditRequest: boolean, showAddToList: boolean }}
 *   - showEditRequest: "수정 요청" 메뉴 표시 여부
 *   - showAddToList: "내 처리현황에 추가" 메뉴 표시 여부
 */
export function isEditRequestMenuVisible(complaintStatus, userRole, isInProcessingList) {
  const isHandler = userRole === '처리자';
  const isValidStatus = complaintStatus === '접수중' || complaintStatus === '진행중';

  if (isHandler && isInProcessingList && isValidStatus) {
    return { showEditRequest: true, showAddToList: false };
  }

  if (isHandler && !isInProcessingList) {
    return { showEditRequest: false, showAddToList: true };
  }

  return { showEditRequest: false, showAddToList: false };
}

/**
 * Property 2: 수정 요청 폼 유효성 검증
 *
 * 수정 요청 폼의 제출 가능 여부를 판단한다.
 *
 * @param {string|null} reasonType - 선택된 사유 타입 ("처리 담당자 변경", "분류 항목 변경", "기타", null)
 * @param {Object|null} selectedCategory - 선택된 카테고리 객체 (category_id, category_name)
 * @param {string} otherReason - 기타 사유 텍스트
 * @returns {boolean} 폼이 유효하면 true
 */
export function isEditRequestFormValid(reasonType, selectedCategory, otherReason) {
  if (reasonType === null || reasonType === undefined) {
    return false;
  }

  if (reasonType === '분류 항목 변경') {
    return selectedCategory !== null && selectedCategory !== undefined;
  }

  if (reasonType === '기타') {
    const trimmed = (otherReason || '').trim();
    return trimmed.length >= 1 && trimmed.length <= 500;
  }

  if (reasonType === '처리 담당자 변경') {
    return true;
  }

  return false;
}

/**
 * Property 3: 카테고리 필터링
 *
 * 카테고리 변경 요청 시 현재 카테고리를 제외한 카테고리 목록을 반환한다.
 *
 * @param {Array<{ category_id: number, category_name: string }>} allCategories - 전체 카테고리 목록
 * @param {string} currentCategory - 현재 민원의 카테고리명
 * @returns {Array<{ category_id: number, category_name: string }>} 현재 카테고리를 제외한 목록
 */
export function filterCategories(allCategories, currentCategory) {
  if (!Array.isArray(allCategories)) {
    return [];
  }
  return allCategories.filter(
    (category) => category.category_name !== currentCategory
  );
}

/**
 * Property 4: 라디오 옵션 변경 시 상세 내용 초기화
 *
 * 사유 타입이 변경되면 상세 내용을 초기 상태로 리셋한다.
 *
 * @param {string|null} previousReasonType - 이전 선택된 사유 타입
 * @param {string|null} newReasonType - 새로 선택된 사유 타입
 * @param {{ selectedCategory: Object|null, otherReason: string }} currentState - 현재 상세 내용 상태
 * @returns {{ selectedCategory: Object|null, otherReason: string }} 리셋 여부에 따른 상태
 */
export function resetDetailOnReasonChange(previousReasonType, newReasonType, currentState) {
  if (previousReasonType !== newReasonType) {
    return { selectedCategory: null, otherReason: '' };
  }
  return { ...currentState };
}

/**
 * Property 5: API 실패 시 폼 데이터 보존
 *
 * API 호출 실패 시 폼 데이터를 그대로 유지하고 에러 정보를 추가한다.
 *
 * @param {{ reasonType: string|null, selectedCategory: Object|null, otherReason: string }} formState - 현재 폼 상태
 * @param {string} error - 에러 메시지
 * @returns {{ reasonType: string|null, selectedCategory: Object|null, otherReason: string, error: string, modalOpen: boolean }}
 *   폼 데이터가 보존된 상태 + 에러 정보 + 모달 열림 상태
 */
export function preserveFormOnError(formState, error) {
  return {
    ...formState,
    error,
    modalOpen: true,
  };
}

/**
 * Property 6: 수정 요청 섹션 표시 규칙
 *
 * 수정 요청 섹션의 표시 여부와 버튼 표시 여부를 결정한다.
 *
 * @param {Object|null} editRequest - 수정 요청 데이터
 * @param {string} userRole - 사용자 역할 ("관리자", "처리자" 등)
 * @returns {{ showSection: boolean, showButtons: boolean }}
 *   - showSection: 섹션 표시 여부
 *   - showButtons: 승인/거절 버튼 표시 여부
 */
export function getEditRequestSectionVisibility(editRequest, userRole) {
  if (editRequest === null || editRequest === undefined) {
    return { showSection: false, showButtons: false };
  }

  const isAdmin = userRole === '관리자';
  // PENDING 상태일 때만 승인/거절 버튼 표시
  const isPending = editRequest.status === 'P';

  return {
    showSection: true,
    showButtons: isAdmin && isPending,
  };
}

/**
 * Property 7: 거절 사유 유효성 검증
 *
 * 거절 사유 텍스트의 유효성을 판단한다.
 *
 * @param {string} reason - 거절 사유 텍스트
 * @returns {boolean} 유효하면 true (trim 후 1~500자)
 */
export function isRejectionReasonValid(reason) {
  if (typeof reason !== 'string') {
    return false;
  }
  const trimmed = reason.trim();
  return trimmed.length >= 1 && trimmed.length <= 500;
}
