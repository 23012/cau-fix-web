import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import './MyMenuList.css';

const MyMenuList = ({ pushEnabled, onTogglePush, onUpdateProfile, onLogout, user }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    onUpdateProfile?.({ password: password || undefined, phone });
    setPassword('');
    setPasswordConfirm('');
    setEditOpen(false);
    setShowSuccess(true);
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

      {showSuccess && (
        <div className="myinfo-success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="myinfo-success-popup" onClick={(e) => e.stopPropagation()}>
            <p>회원 정보 수정이 완료되었습니다.</p>
            <button className="myinfo-success-btn" onClick={() => setShowSuccess(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMenuList;
