import { useState, useEffect, useCallback } from "react";
import { UserPlus, AlertCircle, X, Check } from "lucide-react";
import MyProfileCard from "./MyProfileCard";
import { normalizeRole } from "../../constants/roles";
import { listAccounts, addAccount, switchAccount, removeAccount } from "../../services/accountService";
import appLogo from "../../assets/images/app.png";
import "./AccountSwitcher.css";

const isAutoLogin = () => localStorage.getItem("autoLogin") === "true";

// 계정 추가/재등록 모달
const AddAccountModal = ({ prefillId = "", onClose, onAdded }) => {
  const [loginId, setLoginId] = useState(prefillId);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await addAccount(loginId.trim(), password);
      onAdded(result);
    } catch (err) {
      setError(err.message || "계정 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="acct-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="acct-modal">
        <div className="acct-modal__title">{prefillId ? "계정 재등록" : "계정 추가"}</div>
        <p className="acct-modal__desc">
          {prefillId
            ? "비밀번호가 변경되었습니다. 새 비밀번호로 다시 등록해주세요."
            : "전환할 계정의 아이디와 비밀번호를 입력하세요."}
        </p>
        <input
          className="acct-modal__input"
          placeholder="아이디"
          value={loginId}
          onChange={(e) => { setLoginId(e.target.value); setError(""); }}
          readOnly={!!prefillId}
          autoFocus={!prefillId}
        />
        <input
          className="acct-modal__input"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          autoFocus={!!prefillId}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p className="acct-modal__error">{error}</p>}
        <div className="acct-modal__actions">
          <button className="acct-modal__btn acct-modal__btn--cancel" onClick={onClose} disabled={loading}>
            취소
          </button>
          <button className="acct-modal__btn acct-modal__btn--submit" onClick={submit} disabled={loading}>
            {loading ? "확인 중..." : (prefillId ? "재등록" : "추가")}
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSwitcher = ({ currentUser }) => {
  const [accounts, setAccounts] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const currentId = currentUser?.member_id;

  const load = useCallback(async () => {
    try {
      const { accounts } = await listAccounts();
      setAccounts(accounts || []);
    } catch {
      setAccounts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goSwitch = async (acc) => {
    if (switching || acc.member_id === currentId) return;
    // 비밀번호가 바뀌어 무효화된 계정 → 삭제 후 재등록 안내
    if (acc.revoked) {
      alert("비밀번호가 일치하지 않습니다. 기존 계정을 삭제하고 다시 등록해주세요.");
      return;
    }
    try {
      setSwitching(true);
      const { member } = await switchAccount(acc.member_id, isAutoLogin());
      localStorage.setItem("user", JSON.stringify({ ...member, role: normalizeRole(member.role) }));
      // 권한/부서가 바뀌므로 앱 상태를 완전히 리셋 (전체 리로드)
      if (member.password_reset) {
        alert("관리자에 의해 비밀번호가 사번으로 초기화 되었습니다. 개인 정보 보호를 위해 비밀번호를 재설정 해주세요.");
        window.location.href = "/myinfo";
      } else {
        window.location.href = "/complain-dashboard";
      }
    } catch (err) {
      setSwitching(false);
      if (err.code === "PASSWORD_CHANGED") {
        alert("비밀번호가 일치하지 않습니다. 기존 계정을 삭제하고 다시 등록해주세요.");
        load();
      } else if (err.code === "NOT_FOUND") {
        alert("등록되지 않은 계정입니다. 다시 등록해주세요.");
        load();
      } else {
        alert(err.message || "계정 전환 중 오류가 발생했습니다.");
      }
    }
  };

  const handleRemove = async (e, acc) => {
    e.stopPropagation();
    if (!window.confirm(`${acc.name} 계정을 목록에서 제거할까요?`)) return;
    try {
      await removeAccount(acc.member_id);
      load();
    } catch (err) {
      alert(err.message || "제거 중 오류가 발생했습니다.");
    }
  };

  const handleAdded = (result) => {
    setAddOpen(false);
    load();
    if (result?.code === "ALREADY_REGISTERED") {
      alert("이미 등록된 계정입니다.");
    } else if (result?.code === "REACTIVATED") {
      alert("계정이 다시 등록되었습니다.");
    }
  };

  const others = accounts.filter((a) => a.member_id !== currentId);

  return (
    <>
      <MyProfileCard
        name={currentUser?.name}
        dept={currentUser?.dept}
        onClick={() => setSheetOpen(true)}
      />

      {sheetOpen && (
        <div
          className="acct-sheet-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}
        >
          <div className="acct-sheet">
            <div className="acct-sheet__head">
              <span className="acct-sheet__title">계정 전환</span>
              <button className="acct-sheet__close" onClick={() => setSheetOpen(false)} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className="acct-sheet__list">
              {/* 현재 로그인 계정 */}
              <div className="acct-row acct-row--current">
                <div className="acct-avatar"><img src={appLogo} alt="" /></div>
                <div className="acct-info">
                  <div className="acct-name">{currentUser?.name || "-"}</div>
                  <div className="acct-sub">
                    <span className="acct-role-badge">{normalizeRole(currentUser?.role)}</span>
                    <span className="acct-dept">{currentUser?.dept || ""}</span>
                  </div>
                </div>
                <Check size={20} className="acct-check" />
              </div>

              {/* 다른 계정 */}
              {others.map((acc) => (
                <button
                  key={acc.member_id}
                  type="button"
                  className={`acct-row acct-row--switch ${acc.revoked ? "acct-row--revoked" : ""}`}
                  onClick={() => goSwitch(acc)}
                  disabled={switching}
                >
                  <div className="acct-avatar"><img src={appLogo} alt="" /></div>
                  <div className="acct-info">
                    <div className="acct-name">{acc.name}</div>
                    <div className="acct-sub">
                      <span className="acct-role-badge">{normalizeRole(acc.role)}</span>
                      {acc.revoked ? (
                        <span className="acct-revoked-tag"><AlertCircle size={12} /> 재등록 필요</span>
                      ) : (
                        <span className="acct-dept">{acc.dept || ""}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className="acct-remove"
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleRemove(e, acc)}
                    aria-label="계정 제거"
                  >
                    <X size={16} />
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="acct-add-btn"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus size={18} />
              <span>계정 추가하기</span>
            </button>
          </div>
        </div>
      )}

      {addOpen && (
        <AddAccountModal
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
};

export default AccountSwitcher;
