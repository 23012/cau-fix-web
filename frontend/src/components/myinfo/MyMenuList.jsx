import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import useCategories from '../../hooks/useCategories';
import './MyMenuList.css';

const MyMenuList = ({ pushEnabled, onTogglePush, onUpdateProfile, onLogout, user }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [phone, setPhone] = useState(user?.phone || '');
  const [dept, setDept] = useState(user?.dept || '');
  const { categories } = useCategories();

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setDept(user.dept || '');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (password && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password && passwordError) {
      alert('비밀번호 정책을 확인해주세요.');
      return;
    }
    if (!password && !phone.trim() && !dept.trim()) {
      alert('수정할 항목을 입력해주세요.');
      return;
    }
    // 부서가 변경된 경우에만 confirm
    const deptChanged = dept && dept !== (user?.dept || '');
    if (deptChanged) {
      if (!window.confirm('소속 부서를 변경하시겠습니까?')) return;
    }
    try {
      await onUpdateProfile?.({ password: password || undefined, phone: phone || undefined, dept: dept || undefined });
      setPassword('');
      setPasswordConfirm('');
      setPasswordError('');
      setPasswordConfirmError('');
      setEditOpen(false);
      alert('회원 정보 수정이 완료되었습니다.');
    } catch (err) {
      // Header에서 이미 alert 처리
    }
  };

  // 비밀번호 검증: 영어 소문자 + 숫자 포함 10자 이상
  const validatePassword = (value) => {
    if (!value.trim()) {
      setPasswordError("");
      return;
    }
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const isLongEnough = value.length >= 10;

    if (!hasLowercase || !hasNumber || !isLongEnough) {
      setPasswordError("영어 소문자 및 숫자를 포함하여 10자 이상이어야 합니다.");
    } else {
      setPasswordError("");
    }
  };

  // 비밀번호 확인 검증
  const validatePasswordConfirm = (value) => {
    if (!value.trim()) {
      setPasswordConfirmError("");
      return;
    }
    if (value !== password) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordConfirmError("");
    }
  };


  return (
    <div className="myinfo-menu-list">
      <button className="myinfo-menu-item" onClick={() => setEditOpen(!editOpen)}>
        <span>회원 정보 수정</span>
        {editOpen ? <ChevronDown size={20} color="#999" /> : <ChevronRight size={20} color="#999" />}
      </button>

      {/* 회원 정보 수정 */}
      {editOpen && (
        <div className="myinfo-edit-section">
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">새 비밀번호</label>
            <input
              type="password"
              className={`myinfo-edit-input ${passwordError ? "input-error" : ""}`}
              placeholder="새 비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => validatePassword(e.target.value)}
            />
            {passwordError ? (
              <p className="myinfo-validation-error">{passwordError}</p>
            ) : (
              <p className="myinfo-policy-text">※ 영어 소문자 및 숫자 포함 10자 이상</p>
            )}
          </div>
          <div className="myinfo-edit-field">
            <label className="myinfo-edit-label">비밀번호 확인</label>
            <input
              type="password"
              className={`myinfo-edit-input ${passwordConfirmError ? "input-error" : ""}`}
              placeholder="비밀번호 다시 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onBlur={(e) => validatePasswordConfirm(e.target.value)}
            />
            {passwordConfirmError && (
              <p className="myinfo-validation-error">{passwordConfirmError}</p>
            )}
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
            {user?.role === "처리자" ? (
              <select
                className="myinfo-edit-input"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              >
                <option value="전체">전체</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="myinfo-edit-input"
                placeholder="부서 입력"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
              />
            )}
          </div>
          <div className="myinfo-edit-actions">
            <button className="myinfo-edit-submit" onClick={handleSubmit}>
              수정
            </button>
          </div>
        </div>
      )}

      {/*알림 설정*/}
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
