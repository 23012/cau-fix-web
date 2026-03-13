import React from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import './alarm-list.css';
import "../../styles/global.css";

const AlarmList = () => {
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
          <div className="alarm-page">
            <h1>알림</h1>
            <p>알림 페이지입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmList;
