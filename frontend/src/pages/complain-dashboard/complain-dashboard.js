import { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Complain from '../../components/dashboard/complain.jsx';
import AdminDashboard from '../../components/admin/AdminDashboard.jsx';
import { normalizeRole } from '../../constants/roles';
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
      <Header />
      <div className="page-content">
        {role === "관리자" ? <AdminDashboard /> : <Complain />}
      </div>
    </div>
  );
};

export default ComplainDashboard;
