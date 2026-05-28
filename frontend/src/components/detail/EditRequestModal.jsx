import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getCategories } from "../../services/categoryService";
import { submitEditRequest } from "../../services/editRequestService";
import {
  isEditRequestFormValid,
  filterCategories,
  resetDetailOnReasonChange,
} from "../../utils/editRequestUtils";
import "./EditRequestModal.css";

/**
 * 수정 요청 사유 입력 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 콜백
 * @param {number} complaintId - 민원 ID
 * @param {string} currentCategory - 현재 민원 카테고리 (제외 대상)
 * @param {function} onSuccess - 제출 성공 콜백
 */
const EditRequestModal = ({ isOpen, onClose, complaintId, currentCategory, onSuccess }) => {
  const [reasonType, setReasonType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 카테고리 관련 상태
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // 분류 항목 변경 선택 시 카테고리 목록 조회
  useEffect(() => {
    if (reasonType === "분류 항목 변경") {
      setCategoriesLoading(true);
      setCategoriesError(null);
      getCategories()
        .then((res) => {
          setCategories(res.categories || []);
        })
        .catch(() => {
          setCategoriesError("카테고리 목록을 불러올 수 없습니다.");
        })
        .finally(() => {
          setCategoriesLoading(false);
        });
    }
  }, [reasonType]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setReasonType(null);
      setSelectedCategory(null);
      setOtherReason("");
      setSubmitting(false);
      setError(null);
      setCategories([]);
      setCategoriesLoading(false);
      setCategoriesError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReasonChange = (newReasonType) => {
    const resetState = resetDetailOnReasonChange(reasonType, newReasonType, {
      selectedCategory,
      otherReason,
    });
    setSelectedCategory(resetState.selectedCategory);
    setOtherReason(resetState.otherReason);
    setReasonType(newReasonType);
    setError(null);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    let detail = "";
    if (reasonType === "분류 항목 변경") {
      detail = selectedCategory?.category_name || "";
    } else if (reasonType === "기타") {
      detail = otherReason.trim();
    } else if (reasonType === "처리 담당자 변경") {
      detail = "처리 담당자 변경";
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitEditRequest(complaintId, { reasonType, detail });
      onSuccess?.();
    } catch (err) {
      setError(err.message || "수정 요청 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = isEditRequestFormValid(reasonType, selectedCategory, otherReason);
  const filteredCategories = filterCategories(categories, currentCategory);

  return (
    <div className="edit-request-overlay" onClick={onClose}>
      <div className="edit-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-request-header">
          <h3 className="edit-request-title">수정 요청 사유</h3>
          <button className="edit-request-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="edit-request-body">
          <div className="edit-request-radio-group">
            {/* 처리 담당자 변경 */}
            <div className="edit-request-radio-row">
              <label className="edit-request-radio-item">
                <input
                  type="radio"
                  name="reasonType"
                  value="처리 담당자 변경"
                  checked={reasonType === "처리 담당자 변경"}
                  onChange={() => handleReasonChange("처리 담당자 변경")}
                />
                <span className="edit-request-radio-label">처리 담당자 변경</span>
              </label>
            </div>

            {/* 분류 항목 변경 + 드롭다운 인라인 */}
            <div className="edit-request-radio-row">
              <label className="edit-request-radio-item">
                <input
                  type="radio"
                  name="reasonType"
                  value="분류 항목 변경"
                  checked={reasonType === "분류 항목 변경"}
                  onChange={() => handleReasonChange("분류 항목 변경")}
                />
                <span className="edit-request-radio-label">분류 항목 변경</span>
              </label>
              {reasonType === "분류 항목 변경" && (
                <div className="edit-request-inline-field">
                  {categoriesLoading ? (
                    <span className="edit-request-loading-inline">로딩 중...</span>
                  ) : categoriesError ? (
                    <span className="edit-request-error-inline">{categoriesError}</span>
                  ) : (
                    <select
                      className="edit-request-select-inline"
                      value={selectedCategory?.category_id || ""}
                      onChange={(e) => {
                        const catId = Number(e.target.value);
                        const cat = filteredCategories.find((c) => c.category_id === catId);
                        setSelectedCategory(cat || null);
                      }}
                    >
                      <option value="">선택</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* 기타 + 입력창 인라인 */}
            <div className="edit-request-radio-row">
              <label className="edit-request-radio-item">
                <input
                  type="radio"
                  name="reasonType"
                  value="기타"
                  checked={reasonType === "기타"}
                  onChange={() => handleReasonChange("기타")}
                />
                <span className="edit-request-radio-label">기타</span>
              </label>
              {reasonType === "기타" && (
                <div className="edit-request-inline-field edit-request-inline-field--text">
                  <input
                    type="text"
                    className="edit-request-input-inline"
                    placeholder="사유 입력 (최대 50자)"
                    value={otherReason}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setOtherReason(e.target.value);
                      }
                    }}
                    maxLength={50}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="edit-request-error">{error}</p>}
        </div>

        <div className="edit-request-footer">
          <button
            className="edit-request-submit-btn"
            disabled={!isFormValid || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "제출 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRequestModal;
