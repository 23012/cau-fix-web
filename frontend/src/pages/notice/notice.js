import React from 'react';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import './notice.css';
import "../../styles/global.css";

const Notice = () => {
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
          <div className="notice-page">
            <h1>공지사항</h1>
            <p>공지사항 페이지입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notice;
