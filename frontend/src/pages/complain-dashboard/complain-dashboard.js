import React from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import Complain from '../../components/dashboard/complain.jsx';
import './complain-dashboard.css';
import "../../styles/global.css";

const ComplainDashboard = () => {
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
          <Complain />
        </div>
      </div>
    </div>
  );
};

export default ComplainDashboard;
