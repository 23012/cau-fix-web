// Service Worker for PWA
const CACHE_NAME = 'facility-report-v2';

// Install event - 하드코딩된 캐시 목록 제거 (빌드 해시와 불일치 방지)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Fetch event - Network First 전략 (네트워크 우선, 실패 시 캐시)
self.addEventListener('fetch', (event) => {
  // navigation 요청(HTML)은 항상 네트워크 우선
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 그 외 리소스도 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답은 캐시에 저장
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Activate event - 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - 푸시 알림 수신
self.addEventListener('push', (event) => {
  let data = { title: '알림', body: '새로운 알림이 있습니다.' };
  try {
    data = event.data.json();
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  const options = {
    body: data.body,
    icon: '/app-icon-192.png',
    badge: '/app-icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [{ action: 'open', title: '확인' }],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
