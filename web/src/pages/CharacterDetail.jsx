import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api.js';
import './CharacterDetail.css';

export default function CharacterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadCharacter();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCharacter = async () => {
    try {
      const result = await api.getCharacters(1, 1000);
      const chars = result?.data || [];
      const char = chars.find(c => String(c.id) === String(id));
      setCharacter(char || null);
    } catch (err) {
      console.error('Failed to load character:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const result = await api.sendMessage(Number(id), userMsg.content);
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '（角色暂时无法回应，请稍后再试）' }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!character) {
    return (
      <div className="detail-page">
        <div className="empty-state"><i className="fa-solid fa-spinner fa-spin empty-icon" /><p>加载中...</p></div>
      </div>
    );
  }

  return (
    <div className="detail-page fade-in">
      <Link to="/" className="back-link"><i className="fa-solid fa-arrow-left" /> 返回广场</Link>

      <div className="detail-layout">
        <div className="detail-sidebar">
          <div className="detail-avatar glass-card">
            <img src={character.avatar} alt={character.name} />
          </div>
          <h2 className="detail-name">{character.name}</h2>
          <div className="detail-stats">
            <span><i className="fa-solid fa-heart" style={{ color: 'var(--pink)' }} /> {character.likes}</span>
          </div>
          <div className="detail-tags">
            {(character.tags || []).map((t, i) => <span key={i} className="tag">{typeof t === 'string' ? t : t.name}</span>)}
          </div>
          <div className="detail-notes glass-card">
            <h4><i className="fa-solid fa-book" /> 角色设定</h4>
            <p>{character.creatorNotes || '暂无设定'}</p>
          </div>
        </div>

        <div className="chat-section glass-card">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <i className="fa-solid fa-comments" />
                <p>开始和 {character.name} 对话吧</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? (
                    <img src={character.avatar} alt="" />
                  ) : (
                    <div className="user-avatar"><i className="fa-solid fa-user" /></div>
                  )}
                </div>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder={`对 ${character.name} 说点什么...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button className="chat-send gradient-btn" onClick={sendMessage} disabled={!input.trim() || sending}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
