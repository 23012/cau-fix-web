import apiClient from '../services/apiClient';

/**
 * 푸시 알림 구독 등록
 * 로그인 후 호출하여 브라우저 푸시를 활성화합니다.
 */
export async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
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
