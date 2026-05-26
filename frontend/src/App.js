import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import './styles/responsive.css';
import './styles/variables.css';
import { subscribePush } from './utils/pushSubscription';
import Main from "./pages/main/main";
import Login from "./pages/login/login";
import Signup from "./pages/signup/signup";
import ComplainDashboard from "./pages/complain-dashboard/complain-dashboard";
import AdminComplains from "./pages/admin-complains/admin-complains";
import AdminMembers from "./pages/admin-members/admin-members";
import ComplainDetail from "./pages/complain-detail/complain-detail";
import Notice from "./pages/notice/notice";
import PushList from "./pages/push-list/push-list";
import MyInfo from "./pages/myinfo/myinfo";
import ComplainWrite from "./pages/complain-write/complain-write";

function App() {
  // 이미 알림 권한이 granted인 경우 자동 구독 (재방문 시)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && 'Notification' in window && Notification.permission === 'granted') {
      subscribePush().catch(() => {});
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complain-dashboard" element={<ComplainDashboard />} />
        <Route path="/admin/complains" element={<AdminComplains />} />
        <Route path="/admin/members" element={<AdminMembers />} />
        <Route path="/complain-write" element={<ComplainWrite />} />
        <Route path="/complain-detail" element={<ComplainDetail />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/push-list" element={<PushList />} />
        <Route path="/myinfo" element={<MyInfo />} />
      </Routes>
    </Router>
  );
}

export default App;