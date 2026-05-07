import { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import NoticeList from '../../components/notice/NoticeList';
import NoticeDetail from '../../components/notice/NoticeDetail';
import AdminNoticeList from '../../components/admin/AdminNoticeList';
import NoticeForm from '../../components/admin/NoticeForm';
import { updateNotice, deleteNotice } from '../../services/noticeService';
import { normalizeRole } from '../../constants/roles';
import './notice.css';
import '../../styles/global.css';

const CATEGORY_LABEL_TO_CODE = { "공지": "G", "업데이트": "U", "점검": "F" };

const Notice = () => {
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [updatedNotice, setUpdatedNotice] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");
  const userName = user?.name || "";

  const handleEdit = (notice) => {
    setEditData(notice);
    setEditFormOpen(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      // 새 이미지를 base64로 변환
      const imagePromises = (formData.images || []).map((img) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(img.file);
        });
      });
      const newImages = await Promise.all(imagePromises);
      // 기존 이미지(삭제되지 않은 것) + 새 이미지 합침
      const notice_images = [...(formData.existingImages || []), ...newImages];

      await updateNotice(editData.id, {
        notice_title: formData.title,
        notice_category: CATEGORY_LABEL_TO_CODE[formData.category] || "G",
        notice_content: formData.content,
        notice_images,
      });
      const updated = { ...editData, title: formData.title, category: formData.category, content: formData.content, images: notice_images };
      setEditFormOpen(false);
      setEditData(null);
      setSelectedNotice(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message || "수정 중 오류가 발생했습니다.");
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
      return <AdminNoticeList key={refreshKey} onSelect={(notice) => setSelectedNotice(notice)} updatedNotice={updatedNotice} />;
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
        isOpen={editFormOpen}
        onClose={() => { setEditFormOpen(false); setEditData(null); }}
        onSubmit={handleEditSubmit}
        editData={editData}
      />
    </div>
  );
};

export default Notice;
