import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import MyProfileCard from '../../components/myinfo/MyProfileCard';
import MyMenuList from '../../components/myinfo/MyMenuList';
import { subscribePush, unsubscribePush } from '../../utils/pushSubscription';
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

  const handleTogglePush = async () => {
    const next = !pushEnabled;
    console.log('[Push] 토글:', next);
    setPushEnabled(next);
    localStorage.setItem('pushEnabled', next.toString());
    try {
      if (next) {
        await subscribePush();
      } else {
        await unsubscribePush();
      }
    } catch (err) {
      console.error('[Push] 토글 에러:', err);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="myinfo-page">
          <MyProfileCard name={user?.name} dept={user?.dept} />
          <MyMenuList
            pushEnabled={pushEnabled}
            onTogglePush={handleTogglePush}
            onUpdateProfile={() => {}}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

export default MyInfo;
