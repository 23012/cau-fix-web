import { useState } from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import NoticeList from '../../components/notice/NoticeList';
import NoticeDetail from '../../components/notice/NoticeDetail';
import './notice.css';
import '../../styles/global.css';

const Notice = () => {
  const [selectedNotice, setSelectedNotice] = useState(null);

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <TopBar />
          <div className="dashboard-header-menubar">
            <MenuBar />
          </div>
        </div>
        <MenuBar />
        <div className="dashboard-content">
          {selectedNotice ? (
            <NoticeDetail
              data={selectedNotice}
              onBack={() => setSelectedNotice(null)}
            />
          ) : (
            <NoticeList onSelect={(notice) => setSelectedNotice(notice)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Notice;
