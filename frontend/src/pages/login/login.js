import React from 'react';

function Login() {
  return (
    <div className="page-container flex-center login-container">
      <h1>로그인</h1>
      <form>
        <input type="text" placeholder="아이디" />
        <input type="password" placeholder="비밀번호" />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}

export default Login;