import Header from '../../components/common/Header';
import AdminComplainList from '../../components/admin/AdminComplainList';
import '../../styles/global.css';

const AdminComplains = () => {
  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <AdminComplainList />
      </div>
    </div>
  );
};

export default AdminComplains;
