import { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import NoticeList from '../../components/notice/NoticeList';
import NoticeDetail from '../../components/notice/NoticeDetail';
import AdminNoticeList from '../../components/admin/AdminNoticeList';
import NoticeForm from '../../components/admin/NoticeForm';
import { normalizeRole } from '../../constants/roles';
import './notice.css';
import '../../styles/global.css';

const Notice = () => {
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [user, setUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [updatedNotice, setUpdatedNotice] = useState(null);

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

  const handleEditSubmit = (formData) => {
    const now = new Date();
    const updatedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
    const updated = { ...editData, ...formData, updatedAt };
    setUpdatedNotice(updated);
    setEditFormOpen(false);
    setEditData(null);
    setSelectedNotice(null);
  };

  const handleDelete = (noticeId) => {
    setSelectedNotice(null);
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
      return <AdminNoticeList onSelect={(notice) => setSelectedNotice(notice)} updatedNotice={updatedNotice} />;
    }
    return <NoticeList onSelect={(notice) => setSelectedNotice(notice)} />;
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
