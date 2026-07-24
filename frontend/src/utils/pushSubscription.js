import apiClient from '../services/apiClient';

/**
 * 푸시 알림 구독 등록
 *
 * @param {{ interactive?: boolean }} [opts]
 *   interactive=false(기본): 이미 권한이 'granted'인 경우에만 조용히 구독한다.
 *     자동 호출(앱 로드/로그인 직후)용. iOS는 사용자 제스처 밖의 권한요청을
 *     무시하거나 '거부'로 굳혀버리므로, 자동 호출에서는 requestPermission을 하지 않는다.
 *   interactive=true: 사용자가 '알림 켜기'를 직접 탭했을 때만 사용. 이때만 권한을 요청한다.
 */
export async function subscribePush({ interactive = false } = {}) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      // 미결정 상태: 사용자가 직접 탭한 경우(interactive)에만 권한 요청
      if (!interactive) {
        return false;
      }
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    // VAPID public key 가져오기
    const response = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await response.json();

    // base64 → Uint8Array 변환
    const urlBase64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 서버에 구독 정보 전송
    await apiClient('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 푸시 알림 구독 해제
 */
export async function unsubscribePush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await apiClient('/notifications/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    return false;
  }
}
