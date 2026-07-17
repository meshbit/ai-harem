import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login - redirect to home
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">登录</Link>
          <Link to="/register" className="auth-tab">注册</Link>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><i className="fa-solid fa-envelope" /> 邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-lock" /> 密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required />
          </div>
          <button type="submit" className="gradient-btn auth-submit">登录</button>
        </form>
        <div className="auth-social">
          <p>— 社交账号登录 —</p>
          <div className="social-btns">
            <button className="social-btn"><i className="fa-brands fa-google" /></button>
            <button className="social-btn"><i className="fa-brands fa-github" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
