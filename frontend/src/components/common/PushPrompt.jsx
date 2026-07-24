import { useState, useEffect } from 'react';
import { subscribePush } from '../../utils/pushSubscription';

/**
 * 알림 켜기 안내 배너.
 *
 * 로그인 상태이고, 브라우저가 푸시를 지원하며, 알림 권한이 아직 '미결정(default)'일 때만
 * 노출된다. 사용자가 "알림 켜기"를 직접 탭하면 그때 권한을 요청하고 구독한다.
 * (iOS는 사용자 제스처 안에서만 권한 요청이 되므로, 자동 팝업이 아니라 이 탭 방식이 필요하다.)
 *
 * - 이미 허용(granted)한 사용자는 앱 로드 시 자동 구독되므로 배너를 띄우지 않는다.
 * - 거부(denied)한 사용자는 브라우저/OS 설정에서만 바꿀 수 있어 배너로 해결 불가 → 띄우지 않는다.
 */

const DISMISS_KEY = 'pushPromptDismissed';

const isSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export default function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = () => {
      const loggedIn = !!localStorage.getItem('user');
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
      setVisible(
        loggedIn && isSupported() && Notification.permission === 'default' && !dismissed
      );
    };
    check();
    // 로그인 후/탭 복귀 시 상태가 바뀔 수 있으므로 다시 확인
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      await subscribePush({ interactive: true });
    } catch (e) {
      /* 실패해도 배너는 닫는다 (권한 상태가 default를 벗어남) */
    }
    setBusy(false);
    setVisible(false);
  };

  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.wrap} role="dialog" aria-label="알림 켜기 안내">
      <span style={styles.icon} aria-hidden="true">🔔</span>
      <span style={styles.text}>알림을 켜면 민원 처리 상황을 실시간으로 받아볼 수 있어요.</span>
      <button type="button" style={styles.enable} onClick={handleEnable} disabled={busy}>
        {busy ? '설정 중…' : '알림 켜기'}
      </button>
      <button type="button" style={styles.close} onClick={handleClose} aria-label="닫기">✕</button>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'fixed',
    left: '50%',
    bottom: '84px',
    transform: 'translateX(-50%)',
    zIndex: 9998,
    width: 'calc(100% - 32px)',
    maxWidth: '440px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    background: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    boxSizing: 'border-box',
  },
  icon: { fontSize: '20px', flexShrink: 0 },
  text: { flex: 1, fontSize: '14px', color: '#333', lineHeight: 1.4 },
  enable: {
    flexShrink: 0,
    padding: '8px 14px',
    background: 'var(--main-color, #006EB7)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  close: {
    flexShrink: 0,
    width: '28px',
    height: '28px',
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '16px',
    cursor: 'pointer',
    lineHeight: 1,
  },
};
