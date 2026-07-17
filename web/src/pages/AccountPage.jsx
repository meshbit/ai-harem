import { useState } from 'react';
import './AccountPage.css';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('checkin');
  const tabs = [
    { key: 'checkin', icon: 'fa-calendar-check', label: '签到' },
    { key: 'recharge', icon: 'fa-bolt', label: '充值' },
    { key: 'referral', icon: 'fa-share', label: '推广' },
    { key: 'favorites', icon: 'fa-heart', label: '收藏' },
    { key: 'messages', icon: 'fa-envelope', label: '消息' },
  ];

  return (
    <div className="account-page fade-in">
      <h1 className="account-title"><i className="fa-solid fa-user" /> 个人中心</h1>

      <div className="account-tabs">
        {tabs.map((tab) => (
          <button key={tab.key} className={`account-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            <i className={`fa-solid ${tab.icon}`} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="account-content glass-card">
        {activeTab === 'checkin' && (
          <div className="checkin-section">
            <h2>每日签到</h2>
            <div className="lucky-wheel">
              <div className="wheel-center gradient-text">🎰</div>
              <p>点击转盘抽取电量奖励</p>
              <button className="gradient-btn">签到转盘</button>
            </div>
          </div>
        )}

        {activeTab === 'recharge' && (
          <div className="recharge-section">
            <h2>充值电量</h2>
            <div className="recharge-grid">
              {[{ amount: 10, price: 1 }, { amount: 60, price: 5 }, { amount: 150, price: 10 }, { amount: 500, price: 30 }].map((pkg, i) => (
                <div key={i} className="recharge-card glass-card">
                  <div className="recharge-amount">{pkg.amount} <span>电量</span></div>
                  <div className="recharge-price">¥{pkg.price}</div>
                  <button className="gradient-btn">购买</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="referral-section">
            <h2>推广赚钱</h2>
            <p className="referral-rate">佣金比例：<strong className="gradient-text">38%</strong></p>
            <div className="referral-code">
              <input type="text" readOnly value="https://ai.okva.cc?ref=USER" />
              <button className="gradient-btn">复制链接</button>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="empty-tab"><i className="fa-solid fa-heart" /><p>暂无收藏</p></div>
        )}

        {activeTab === 'messages' && (
          <div className="empty-tab"><i className="fa-solid fa-envelope" /><p>暂无消息</p></div>
        )}
      </div>
    </div>
  );
}
