import Header from '../../components/common/Header';
import AdminMemberList from '../../components/admin/AdminMemberList';
import '../../styles/global.css';

const AdminMembers = () => {
  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <AdminMemberList />
      </div>
    </div>
  );
};

export default AdminMembers;
