import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert('两次密码不一致');
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">登录</Link>
          <Link to="/register" className="auth-tab active">注册</Link>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><i className="fa-solid fa-user" /> 用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-envelope" /> 邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-lock" /> 密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required />
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-lock" /> 确认密码</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="请再次输入密码" required />
          </div>
          <button type="submit" className="gradient-btn auth-submit">注册</button>
        </form>
        <p className="auth-footer">注册即送 <strong>8 电量</strong>，立即开启 AI 对话</p>
      </div>
    </div>
  );
}
