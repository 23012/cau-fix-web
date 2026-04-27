import { useState, useEffect } from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import AdminComplainList from '../../components/admin/AdminComplainList';
import '../complain-dashboard/complain-dashboard.css';
import '../../styles/global.css';

const AdminComplains = () => {
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
          <AdminComplainList />
        </div>
      </div>
    </div>
  );
};

export default AdminComplains;
