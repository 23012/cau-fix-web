import { useState, useEffect } from "react";
import { completeEditRequest } from "../../services/editRequestService";
import { getMembers } from "../../services/memberService";
import useCategories from "../../hooks/useCategories";
import "./EditComplaintForm.css";

/**
 * 승인 후 민원 수정 폼
 * - 담당자 변경: 새 처리자 선택
 * - 기타: 제목/내용/위치/카테고리 수정
 */
const EditComplaintForm = ({ complaintId, editRequest, currentData, onComplete, onCancel }) => {
  const reasonType = editRequest?.reasonType;
  const { categories } = useCategories();

  // 담당자 변경용
  const [processors, setProcessors] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState(null);

  // 기타 수정용
  const [formData, setFormData] = useState({
    title: currentData?.title || "",
    content: currentData?.content || "",
    location: currentData?.location || "",
    category_id: currentData?.category_id || null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 담당자 변경 시 처리자 목록 로드 (민원 카테고리명 === 처리자 dept)
  useEffect(() => {
    if (reasonType === "처리 담당자 변경") {
      getMembers()
        .then((res) => {
          const categoryName = currentData?.category || null;
          const allProcessors = (res.members || res || []).filter(
            (m) => (m.role === "E" || m.role === "처리자") && m.is_approved
          );
          const list = categoryName
            ? allProcessors.filter((m) => m.dept === categoryName)
            : allProcessors;
          setProcessors(list.length > 0 ? list : allProcessors);
        })
        .catch(() => {});
    }
  }, [reasonType, currentData]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const body = {};

      if (reasonType === "처리 담당자 변경") {
        if (!selectedProcessor) {
          setError("새 처리자를 선택해주세요.");
          setLoading(false);
          return;
        }
        body.new_processor_id = selectedProcessor;
      } else if (reasonType === "기타") {
        body.title = formData.title;
        body.content = formData.content;
        body.location = formData.location;
      }

      await completeEditRequest(complaintId, body);
      alert("민원 수정이 완료되었습니다.");
      onComplete?.();
    } catch (err) {
      setError(err.message || "수정 완료 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-complaint-form">
      {reasonType === "처리 담당자 변경" && (
        <div className="edit-complaint-field">
          <select
            className="edit-complaint-select"
            value={selectedProcessor || ""}
            onChange={(e) => setSelectedProcessor(Number(e.target.value))}
          >
            <option value="">처리자를 선택하세요</option>
            {processors.map((p) => (
              <option key={p.member_id} value={p.member_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {reasonType === "기타" && (
        <>
          <div className="edit-complaint-field">
            <label className="edit-complaint-label">제목</label>
            <input
              type="text"
              className="edit-complaint-input"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="edit-complaint-field">
            <label className="edit-complaint-label">장소</label>
            <input
              type="text"
              className="edit-complaint-input"
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
          <div className="edit-complaint-field">
            <label className="edit-complaint-label">카테고리</label>
            <select
              className="edit-complaint-select"
              value={formData.category_id || ""}
              disabled
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
          <div className="edit-complaint-field">
            <label className="edit-complaint-label">내용</label>
            <textarea
              className="edit-complaint-textarea"
              value={formData.content}
              onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
            />
          </div>
          
        </>
      )}

      {error && <p className="edit-complaint-error">{error}</p>}

      <div className="edit-complaint-actions">
        <button className="edit-complaint-btn cancel" onClick={onCancel} disabled={loading}>
          취소
        </button>
        <button className="edit-complaint-btn submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "처리중..." : "완료"}
        </button>
      </div>
    </div>
  );
};

export default EditComplaintForm;
