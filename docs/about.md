---
layout: doc
title: 關於
lastUpdated: 2026-01-02
outline: false
---

<style scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem; /* 左右留白，頂部由 VitePress 處理 */
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
}

/* 修正頭像容器 */
.avatar-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 1.5rem !important;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #F87171 100%);
  box-shadow: 0 0 30px rgba(220, 38, 38, 0.3);
  overflow: hidden; /* 確保內容不溢出 */
}

.avatar {
  width: 100% !important;
  height: 100% !important;
  border-radius: 50% !important; /* 強制圓形 */
  object-fit: cover !important;
  object-position: center 20% !important; /* 顯示完整頭部 */
  border: 4px solid var(--vp-c-bg) !important;
  background-color: var(--vp-c-bg);
  margin: 0 !important; /* 消除全域 margin */
  box-shadow: none !important; /* 消除全域陰影 */
}

.hero-name {
  font-size: 3rem;
  font-weight: 800;
  background: var(--vp-home-hero-name-background);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.contact-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 2rem;
  background: var(--vp-home-hero-name-background);
  color: white !important;
  border-radius: 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.contact-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 8px 25px rgba(240, 152, 25, 0.4);
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.info-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-5px);
  border-color: var(--vp-c-brand-1);
}

.info-icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  background: var(--vp- c-brand-soft-active);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon { font-size: 1.5rem; color: var(--vp-c-brand-1); }
.info-title { font-weight: 700; color: var(--vp-c-brand-1); margin-bottom: 0.5rem; }

.quote-section {
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 2.5rem;
  border-left: 6px solid var(--vp-c-brand-1);
}

.quote-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  margin-bottom: 1.5rem !important;
}

.quote-content { line-height: 1.8; color: var(--vp-c-text-2); }
.quote-footer { margin-top: 1.5rem; font-style: italic; opacity: 0.7; }

@media (max-width: 640px) {
  .info-cards { grid-template-columns: 1fr; }
  .hero-name { font-size: 2.2rem; }
}
</style>

<div class="about-container">
  <div class="hero-section">
    <div class="avatar-wrapper">
      <img src="/images/avatar.jpg" alt="Wing Chou" class="avatar" />
    </div>
    <div class="hero-name">Wing Chou</div>
    <div class="contact-buttons">
      <a href="mailto:yearningwing@gmail.com" class="contact-btn">
        <i class="fas fa-envelope"></i> Email Me
      </a>
      <a href="https://github.com/CloudyWing" target="_blank" class="contact-btn">
        <i class="fab fa-github"></i> GitHub
      </a>
    </div>
  </div>

  <div class="info-cards">
    <div class="info-card">
      <div class="info-icon-wrapper"><i class="fas fa-feather-pointed info-icon"></i></div>
      <div class="info-title">暱稱</div>
      <div class="info-content">雲翼</div>
    </div>
    <div class="info-card">
      <div class="info-icon-wrapper"><i class="fas fa-code info-icon"></i></div>
      <div class="info-title">職業</div>
      <div class="info-content">什麼都不會的 .NET 工程師</div>
    </div>
    <div class="info-card">
      <div class="info-icon-wrapper"><i class="fas fa-star info-icon"></i></div>
      <div class="info-title">星座</div>
      <div class="info-content">揉合雙魚特質的射手座</div>
    </div>
    <div class="info-card">
      <div class="info-icon-wrapper"><i class="fas fa-lightbulb info-icon"></i></div>
      <div class="info-title">MBTI</div>
      <div class="info-content">系統建構派的 INFP</div>
    </div>
  </div>

  <div class="quote-section">
    <div class="quote-title">寫給未來的操作手冊</div>
    <div class="quote-content">
      <p>技術更新太快，大腦記憶體有限。為了不讓解決問題的經驗隨時間流逝，我建立了這個數位知識庫。</p>
      <p>這裡是我收錄開發筆記、踩坑紀錄與架構思考的地方。讓曾經踩過的坑不再重演。</p>
      <p class="quote-footer">建立本站是為了自我沉澱，如果能剛好解決你的問題，那更好。</p>
    </div>
  </div>
</div>
