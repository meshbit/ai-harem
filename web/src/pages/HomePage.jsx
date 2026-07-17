import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import './HomePage.css';

export default function HomePage() {
  const [characters, setCharacters] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 24;

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(1); loadCharacters(1); }, [activeTag]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [charResult, featResult, tagsResult] = await Promise.all([
        api.getCharacters(1, pageSize, 'hot'),
        api.getFeatured(18),
        api.getTags(),
      ]);
      setCharacters(charResult?.data || []);
      setFeatured(featResult?.data || []);
      setTags(tagsResult?.data || []);
      setHasMore((charResult?.data || []).length >= pageSize);
    } catch (err) {
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const loadCharacters = async (pageNum) => {
    try {
      const result = await api.getCharacters(pageNum, pageSize, 'hot');
      const data = result?.data || [];
      if (pageNum === 1) setCharacters(data);
      else setCharacters(prev => [...prev, ...data]);
      setHasMore(data.length >= pageSize);
    } catch (err) {}
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCharacters(nextPage);
  };

  const featuredRef = useRef(null);
  const scrollFeatured = (direction) => {
    if (featuredRef.current) {
      featuredRef.current.scrollBy({
        left: direction === 'left' ? -280 : 280,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="home-page fade-in">
      <section className="hero-section">
        <div className="hero-bg-glow" />
        <h1 className="hero-title">探索你的<span className="gradient-text"> AI 伴侣</span></h1>
        <p className="hero-subtitle">与海量 AI 角色畅聊，解锁无限想象</p>
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input type="text" className="search-input" placeholder="搜索你喜欢的角色..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button className="gradient-btn search-btn"><i className="fa-solid fa-magnifying-glass" /><span>搜索</span></button>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><i className="fa-solid fa-fire" style={{ color: 'var(--pink)' }} /> 精选推荐</h2>
            <div className="section-actions">
              <button className="scroll-btn" onClick={() => scrollFeatured('left')}><i className="fa-solid fa-chevron-left" /></button>
              <button className="scroll-btn" onClick={() => scrollFeatured('right')}><i className="fa-solid fa-chevron-right" /></button>
            </div>
          </div>
          <div className="featured-scroll" ref={featuredRef}>
            {featured.map((char, i) => (
              <Link to={`/character/${char.id}`} key={char.id} className="featured-card glass-card">
                <div className="featured-rank"><span className={`rank-badge rank-${i + 1}`}>{i + 1}</span></div>
                <div className="featured-img-wrapper">
                  <img src={char.avatar} alt={char.name} className="featured-img" loading="lazy" />
                </div>
                <div className="featured-info">
                  <h3 className="featured-name">{char.name}</h3>
                  <div className="featured-meta">
                    <span className="meta-item"><i className="fa-solid fa-heart" style={{ color: 'var(--pink)' }} />{char.likes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="content-grid-layout">
        <section className="section main-grid-section">
          <div className="section-header">
            <h2 className="section-title"><i className="fa-solid fa-users" style={{ color: 'var(--cyan)' }} /> 角色大厅</h2>
            <div className="tag-filters">
              <button className={`tag ${activeTag === 'all' ? 'active' : ''}`} onClick={() => setActiveTag('all')}>全部</button>
              {tags.slice(0, 8).map((tag) => (
                <button key={tag.name} className={`tag ${activeTag === tag.name ? 'active' : ''}`} onClick={() => setActiveTag(tag.name)}>{tag.name}</button>
              ))}
            </div>
          </div>

          {loading && characters.length === 0 ? (
            <div className="character-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="character-card-skeleton">
                  <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="empty-state"><i className="fa-solid fa-triangle-exclamation empty-icon" /><p>{error}</p><button className="gradient-btn" onClick={loadData}>重试</button></div>
          ) : characters.length === 0 ? (
            <div className="empty-state"><i className="fa-solid fa-ghost empty-icon" /><p>暂无角色</p></div>
          ) : (
            <>
              <div className="character-grid">
                {characters.map((char) => (
                  <Link to={`/character/${char.id}`} key={char.id} className="character-card glass-card">
                    <div className="char-img-wrapper">
                      <img src={char.avatar} alt={char.name} className="char-img" loading="lazy" />
                    </div>
                    <div className="char-info">
                      <h3 className="char-name">{char.name}</h3>
                      <p className="char-desc">{char.creatorNotes?.slice(0, 50) || '神秘角色等待探索...'}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <button className="load-more-btn" onClick={loadMore}><i className="fa-solid fa-arrow-down" /> 加载更多</button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="comments-sidebar">
          <div className="sidebar-card glass-card">
            <h3 className="sidebar-card-title"><i className="fa-solid fa-fire" style={{ color: 'var(--yellow)' }} /> 热门评论</h3>
            <p className="sidebar-empty">暂无评论</p>
          </div>
          <div className="sidebar-card glass-card">
            <h3 className="sidebar-card-title"><i className="fa-solid fa-chart-line" style={{ color: 'var(--green)' }} /> 关于我们</h3>
            <p className="sidebar-about">AI后宫是一个创新的 AI 角色聊天平台，提供沉浸式角色扮演体验。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
