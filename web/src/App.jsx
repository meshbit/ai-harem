import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import HomePage from './pages/HomePage.jsx';
import CharacterDetail from './pages/CharacterDetail.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AIDrawPage from './pages/AIDrawPage.jsx';
import './App.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          <i className="fa-solid fa-bars" />
        </button>
        <span className="mobile-title gradient-text">AI后宫</span>
        <div className="topbar-spacer" />
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/ai-draw" element={<AIDrawPage />} />
        </Routes>
      </main>
    </div>
  );
}
