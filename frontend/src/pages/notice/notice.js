import { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import NoticeList from '../../components/notice/NoticeList';
import NoticeDetail from '../../components/notice/NoticeDetail';
import AdminNoticeList from '../../components/admin/AdminNoticeList';
import NoticeForm from '../../components/admin/NoticeForm';
import { createNotice, updateNotice, deleteNotice } from '../../services/noticeService';
import { normalizeRole } from '../../constants/roles';
import './notice.css';
import '../../styles/global.css';

const CATEGORY_LABEL_TO_CODE = { "공지": "G", "업데이트": "U", "점검": "F" };

const Notice = () => {
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");
  const userName = user?.name || "";

  // 작성 버튼 클릭
  const handleWrite = () => {
    setEditData(null);
    setFormOpen(true);
  };

  // 수정 버튼 클릭
  const handleEdit = (notice) => {
    setEditData(notice);
    setFormOpen(true);
  };

  // 작성/수정 제출 통합
  const handleFormSubmit = async (formData) => {
    try {
      if (editData) {
        // 수정
        const result = await updateNotice(editData.id, {
          notice_title: formData.title,
          notice_category: CATEGORY_LABEL_TO_CODE[formData.category] || "G",
          notice_content: formData.content,
        });
        const updated = {
          ...editData,
          title: formData.title,
          category: formData.category,
          content: formData.content,
          date: result.notice?.date || new Date().toISOString(),
        };
        setFormOpen(false);
        setEditData(null);
        setSelectedNotice(updated);
        setRefreshKey((k) => k + 1);
        alert("수정이 완료되었습니다.");
      } else {
        // 작성
        await createNotice({
          notice_title: formData.title,
          notice_category: CATEGORY_LABEL_TO_CODE[formData.category] || "G",
          notice_content: formData.content,
        });
        setFormOpen(false);
        setRefreshKey((k) => k + 1);
        alert("공지사항이 등록되었습니다.");
      }
    } catch (err) {
      alert(err.message || "처리 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (noticeId) => {
    try {
      await deleteNotice(noticeId);
      alert("공지사항이 삭제되었습니다.");
      setSelectedNotice(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const renderContent = () => {
    if (selectedNotice) {
      return (
        <NoticeDetail
          data={selectedNotice}
          onBack={() => setSelectedNotice(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUser={userName}
        />
      );
    }
    if (role === "관리자") {
      return <AdminNoticeList key={refreshKey} onSelect={(notice) => setSelectedNotice(notice)} onWrite={handleWrite} />;
    }
    return <NoticeList key={refreshKey} onSelect={(notice) => setSelectedNotice(notice)} />;
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        {renderContent()}
      </div>

      <NoticeForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSubmit={handleFormSubmit}
        editData={editData}
      />
    </div>
  );
};

export default Notice;
