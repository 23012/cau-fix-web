//import React from 'react';
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import './styles/responsive.css';
import './styles/variables.css';
import Main from "./pages/main/main";
import Login from "./pages/login/login";

function App() {
  const cursorRef = useRef(null);

  useEffect(() => {
    // 커스텀 커서 요소 생성
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    cursorRef.current = cursor;

    // 마우스 움직임 추적
    const handleMouseMove = (e) => {
      cursor.style.left = e.clientX - 15 + 'px';
      cursor.style.top = e.clientY - 15 + 'px';
    };

    // 마우스 화면 밖으로 나갔을 때
    const handleMouseLeave = () => {
      cursor.style.opacity = '0.3';
    };

    // 마우스 다시 들어왔을 때
    const handleMouseEnter = () => {
      cursor.style.opacity = '1';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (cursorRef.current) {
        document.body.removeChild(cursorRef.current);
      }
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;