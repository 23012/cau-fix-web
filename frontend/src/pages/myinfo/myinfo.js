import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/common/topbar';
import MenuBar from '../../components/common/menubar';
import MyProfileCard from '../../components/myinfo/MyProfileCard';
import MyMenuList from '../../components/myinfo/MyMenuList';
import './myinfo.css';
import '../../styles/global.css';

const MyInfo = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('pushEnabled') !== 'false';
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleTogglePush = () => {
    const next = !pushEnabled;
    setPushEnabled(next);
    localStorage.setItem('pushEnabled', next.toString());
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

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
          <div className="myinfo-page">
            <MyProfileCard name={user?.name} department={user?.department} />
            <MyMenuList
              pushEnabled={pushEnabled}
              onTogglePush={handleTogglePush}
              onUpdateProfile={(updates) => console.log("프로필 수정:", updates)}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyInfo;
