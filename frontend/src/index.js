import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/responsive.css';
import './styles/variables.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 서비스 워커 등록 (푸시 알림용)
// index.html 인라인 스크립트는 CSP(script-src 'self')에 막히므로, 번들되는 이 파일에서 등록한다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}