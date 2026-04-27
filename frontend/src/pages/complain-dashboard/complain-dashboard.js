import { useState, useEffect } from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import Complain from '../../components/dashboard/complain.jsx';
import AdminDashboard from '../../components/admin/AdminDashboard.jsx';
import { normalizeRole } from '../../constants/roles';
import './complain-dashboard.css';
import "../../styles/global.css";

const ComplainDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const role = normalizeRole(user?.role || "");

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
          {role === "관리자" ? <AdminDashboard /> : <Complain />}
        </div>
      </div>
    </div>
  );
};

export default ComplainDashboard;
