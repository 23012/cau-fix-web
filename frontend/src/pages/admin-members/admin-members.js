import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import AdminMemberList from '../../components/admin/AdminMemberList';
import '../complain-dashboard/complain-dashboard.css';
import '../../styles/global.css';

const AdminMembers = () => {
  return (
    <div className="page-container">
      <div className="dashboard-container">
        <div className="dashboard-header-wrapper">
          <div className="dashboard-header">
            <TopBar />
            <div className="dashboard-header-menubar">
              <MenuBar />
            </div>
          </div>
        </div>
        <MenuBar />
        <div className="dashboard-content">
          <AdminMemberList />
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;
