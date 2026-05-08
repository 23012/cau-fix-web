import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import './MyMenuList.css';

const MyMenuList = ({ pushEnabled, onTogglePush, onUpdateProfile, onLogout, user }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dept, setDept] = useState(user?.dept || '');

  const handleSubmit = async () => {
    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await onUpdateProfile?.({ password: password || undefined, phone, dept });
      setPassword('');
      setPasswordConfirm('');
      setEditOpen(false);
      alert('회원 정보 수정이 완료되었습니다.');
    } catch (err) {
      // Header에서 이미 alert 처리
    }
  };

  return (
    <div className="myinfo-menu-list">
      <button className="myinfo-menu-item" onClick={() => setEditOpen(!editOpen)}>
        <span>회원 정보 수정</span>
        {editOpen ? <ChevronDown size={20} color="#999" /> : <ChevronRight size={20} color="#999" />}
      </button>

      {editOpen && (
        <div className="myinfo-edit-section">
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">새 비밀번호</label>
            <input
              type="password"
              className="myinfo-edit-input"
              placeholder="새 비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">비밀번호 확인</label>
            <input
              type="password"
              className="myinfo-edit-input"
              placeholder="비밀번호 다시 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">전화번호</label>
            <input
              type="tel"
              className="myinfo-edit-input"
              placeholder="전화번호 입력"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">부서</label>
            <input
              type="text"
              className="myinfo-edit-input"
              placeholder="부서 입력"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            />
          </div>
          <div className="myinfo-edit-actions">
            <button className="myinfo-edit-submit" onClick={handleSubmit}>
              수정
            </button>
          </div>
        </div>
      )}

      <div className="myinfo-menu-item" onClick={onTogglePush}>
        <span>Push 알림 설정</span>
        <div className={`myinfo-toggle ${pushEnabled ? "on" : ""}`}>
          <div className="myinfo-toggle-knob" />
        </div>
      </div>

      {onLogout && (
        <button className="myinfo-menu-item myinfo-menu-logout" onClick={onLogout}>
          <span>로그아웃</span>
          <ChevronRight size={20} color="#999" />
        </button>
      )}
    </div>
  );
};

export default MyMenuList;
