import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import NoticeList from '../../components/notice/NoticeList';
import './notice.css';
import '../../styles/global.css';

const Notice = () => {
  const handleSelect = (notice) => {
    // TODO: 공지사항 상세 페이지 이동
  };

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
          <NoticeList onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
};

export default Notice;
