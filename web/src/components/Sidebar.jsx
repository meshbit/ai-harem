import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: 'fa-home', label: '首页' },
  { to: '/ai-draw', icon: 'fa-palette', label: 'AI绘画' },
  { to: '/account', icon: 'fa-user', label: '个人中心' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" className="sidebar-logo" onClick={onClose}>
          <div className="logo-icon">
            <i className="fa-solid fa-crown" />
          </div>
          <div className="logo-text">
            <span className="logo-title gradient-text">AI后宫</span>
            <span className="logo-subtitle">AI Character Chat</span>
          </div>
        </NavLink>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className={`fa-solid ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-auth">
          <NavLink to="/login" className="nav-item" onClick={onClose}>
            <i className="fa-solid fa-right-to-bracket" />
            <span>登录</span>
          </NavLink>
          <NavLink to="/register" className="nav-item" onClick={onClose}>
            <i className="fa-solid fa-user-plus" />
            <span>注册</span>
          </NavLink>
        </div>
        <div className="sidebar-footer">
          <p>© 2025 AI后宫</p>
          <p>AI角色聊天平台</p>
        </div>
      </aside>
    </>
  );
}
