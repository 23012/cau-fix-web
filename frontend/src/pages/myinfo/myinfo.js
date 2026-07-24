import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import MyProfileCard from '../../components/myinfo/MyProfileCard';
import MyMenuList from '../../components/myinfo/MyMenuList';
import { updateMyProfile } from '../../services/memberService';
import { logout } from '../../services/authService';
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
    setPushEnabled(next);
    localStorage.setItem('pushEnabled', next.toString());
    try {
      if (next) {
        await subscribePush({ interactive: true });
      } else {
        await unsubscribePush();
      }
    } catch (err) {
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) {
      return;
    }

    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed, clearing local state anyway.', err);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('autoLogin');
    navigate('/login');
  };

  return (
    <div className="page-container">
      <Header />
      <div className="page-content">
        <div className="myinfo-page">
          {/* 상단 회원 정보 카드 */}
          <MyProfileCard name={user?.name} dept={user?.dept} />
          {/* 회원 정보 수정 & push 알림 설정 */}
          <MyMenuList
            pushEnabled={pushEnabled}
            onTogglePush={handleTogglePush}
            onUpdateProfile={async ({ password, phone, dept }) => {
              try {
                await updateMyProfile({ password, phone, dept });
                const updated = { ...user, phone, dept };
                localStorage.setItem("user", JSON.stringify(updated));
                setUser(updated);
              } catch (err) {
                alert(err.message || "정보 수정 중 오류가 발생했습니다.");
                throw err;
              }
            }}
            onLogout={handleLogout}
            user={user}
          />
        </div>
      </div>
    </div>
  );
};

export default MyInfo;
