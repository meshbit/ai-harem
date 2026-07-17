import { useState } from 'react';
import './AIDrawPage.css';

export default function AIDrawPage() {
  const [mode, setMode] = useState('text2img');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);

  const modes = [
    { key: 'text2img', icon: 'fa-font', label: '文生图' },
    { key: 'img2img', icon: 'fa-image', label: '图生图' },
    { key: 'style', icon: 'fa-wand-magic-sparkles', label: '风格迁移' },
  ];

  const handleGenerate = () => {
    // Mock: show placeholder
    setImage('https://placehold.co/512x512/1a1b23/e7e7e2?text=AI+Generated');
  };

  return (
    <div className="draw-page fade-in">
      <h1 className="draw-title"><i className="fa-solid fa-palette" /> AI 绘图</h1>

      <div className="mode-tabs">
        {modes.map((m) => (
          <button key={m.key} className={`mode-tab ${mode === m.key ? 'active' : ''}`} onClick={() => setMode(m.key)}>
            <i className={`fa-solid ${m.icon}`} /><span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="draw-content glass-card">
        <div className="prompt-area">
          <textarea
            className="prompt-input"
            placeholder="描述你想要的画面..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <button className="gradient-btn generate-btn" onClick={handleGenerate}>
            <i className="fa-solid fa-wand-magic-sparkles" /> 生成图片
          </button>
        </div>

        <div className="result-area">
          {image ? (
            <img src={image} alt="Generated" className="result-img" />
          ) : (
            <div className="result-empty">
              <i className="fa-solid fa-image" />
              <p>输入提示词开始创作</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
