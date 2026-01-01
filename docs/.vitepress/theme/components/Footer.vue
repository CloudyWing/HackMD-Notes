<script setup>
import { computed } from 'vue'
import { categoryConfig } from '../../categories.mjs'
import { SITE } from '../constants.ts'

const navigationLinks = computed(() => {
  return Object.entries(categoryConfig).map(([key, config]) => ({
    href: `/${key}/`,
    text: config.name
  }))
})

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-main">
        <div class="footer-section footer-about">
          <h3 class="footer-title">{{ SITE.navTitle }}</h3>
          <p class="footer-description">{{ SITE.summary }}</p>
        </div>
        
        <div class="footer-section footer-links-wrapper">
          <div class="footer-links-group">
            <h4 class="section-title">快速導航</h4>
            <ul class="footer-links">
              <li v-for="link in navigationLinks" :key="link.href">
                <a :href="link.href">{{ link.text }}</a>
              </li>
            </ul>
          </div>
          
          <div class="footer-links-group">
            <h4 class="section-title">聯絡方式</h4>
            <ul class="footer-links">
              <li><a :href="SITE.repo" target="_blank" rel="noopener"><i class="fab fa-github"></i> GitHub</a></li>
              <li><a href="mailto:yearningwing@gmail.com"><i class="fas fa-envelope"></i> Email</a></li>
              <li><a href="/feed.xml"><i class="fas fa-rss"></i> RSS</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p class="copyright">{{ SITE.copyright() }}</p>
      </div>
    </div>
    
    <button class="back-to-top" @click="scrollToTop" aria-label="回到頂部">
      <i class="fa-solid fa-arrow-up"></i>
    </button>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  margin-top: 4rem;
  padding: 3rem 2rem 2rem;
  background: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  z-index: 30;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-main {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 3rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.footer-section {
  min-width: 0;
}

.footer-about {
  grid-column: 1;
}

.footer-links-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
}

.footer-links-group {
  min-width: 0;
}

.footer-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--vp-home-hero-name-background);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.5rem 0;
}

.footer-description {
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.footer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.footer-tag {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;
  font-size: 0.8rem;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin: 0 0 1rem 0;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 1rem;
}

.footer-links-group:first-child .footer-links {
  grid-template-columns: repeat(2, 1fr);
}

.footer-links-group:last-child .footer-links {
  grid-template-columns: 1fr;
}

.footer-links li {
  margin-bottom: 0;
}

.footer-links a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color var(--transition-standard);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.footer-links a:hover {
  color: var(--vp-c-brand-1);
}

.footer-bottom {
  text-align: center;
  padding-top: 1rem;
}

.copyright {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  margin: 0;
}

.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: var(--shadow-brand-md);
  transition: var(--transition-standard);
  z-index: 50;
}

.back-to-top:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-4px);
  box-shadow: var(--shadow-brand-lg);
}

@media (max-width: 960px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-about {
    grid-column: 1;
  }
  
  .footer-links-wrapper {
    grid-template-columns: 1fr 1fr;
  }
  
  .footer-links-group:first-child .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .site-footer {
    padding: 2rem 1rem 1.5rem;
  }

  .footer-main {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-about {
    grid-column: 1;
  }
  
  .footer-links-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
  }
  
  .footer-links-group:first-child .footer-links,
  .footer-links-group:last-child .footer-links {
    grid-template-columns: 1fr;
  }
  
  .footer-title {
    font-size: 1.3rem;
  }
  
  .back-to-top {
    bottom: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
  }
}
</style>
