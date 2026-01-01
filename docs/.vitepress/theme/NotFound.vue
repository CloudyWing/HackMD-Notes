<template>
  <div class="NotFound">
    <div class="content">
      <h1 class="error-code">404</h1>
      <p class="error-message">糟糕！您訪問的頁面不存在</p>
      <p class="error-description">
        該頁面可能已被移動或刪除，或者 URL 輸入錯誤
      </p>

      <div class="actions">
        <button class="home-btn" @click="goHome">
          <i class="fas fa-home"></i> 回到首頁
        </button>
      </div>

      <div v-if="recommendedPosts.length > 0" class="suggestions">
        <h3>或許您會對這些文章感興趣：</h3>
        <div class="suggestion-list">
          <a
            v-for="post in recommendedPosts"
            :key="post.url"
            :href="post.url"
            class="suggestion-item"
          >
            <h4>{{ post.title }}</h4>
            <div class="post-meta">
              <span class="date">
                <i class="far fa-calendar"></i> {{ formatDate(post.date) }}
              </span>
              <span v-if="post.readingTime" class="reading-time">
                <i class="far fa-clock"></i> {{ post.readingTime }} 分鐘
              </span>
            </div>
            <div v-if="post.tags && post.tags.length > 0" class="tags">
              <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vitepress'
import { data as posts } from '../../posts.data.ts'
import { computed } from 'vue'

const router = useRouter()

const goHome = () => {
  router.go('/')
}

// 隨機推薦 3 篇最新文章
const recommendedPosts = computed(() => {
  return posts
    .slice(0, 10)  // 取最新 10 篇
    .sort(() => Math.random() - 0.5)  // 隨機排序
    .slice(0, 3)  // 取 3 篇
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}
</script>

<style scoped>
.NotFound {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--vp-c-bg);
}

.content {
  max-width: 600px;
  text-align: center;
}

.title {
  font-size: 6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  line-height: 1;
}

.quote {
  font-size: 1.25rem;
  color: var(--vp-c-brand-1);
  font-style: italic;
  margin-bottom: 1rem;
}

.description {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 2rem;
}

.actions {
  margin-bottom: 3rem;
}

.action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #dc2626, #ea580c);
  color: white !important;
  text-decoration: none !important;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
}

.icon {
  font-size: 1.5rem;
}

.categories {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.categories h2 {
  font-size: 1.25rem;
  color: var(--vp-c-text-1);
  margin-bottom: 1.5rem;
}

.category-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.category-link {
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1) !important;
  text-decoration: none !important;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.category-link:hover {
  background: var(--vp-c-brand-soft-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.suggestions {
  margin-top: var(--spacing-3xl);
}

.suggestions h3 {
  font-size: 1.3rem;
  color: var(--vp-c-text-1);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.suggestion-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.suggestion-item {
  display: block;
  padding: var(--spacing-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition-standard);
}

.suggestion-item:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--shadow-brand-sm);
}

.suggestion-item h4 {
  font-size: 1.1rem;
  color: var(--vp-c-brand-1);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.post-meta .date,
.post-meta .reading-time {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.tag {
  padding: 0.2rem 0.6rem;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .title {
    font-size: 4rem;
  }
  
  .quote {
    font-size: 1rem;
  }
  
  .action {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .error-code {
    font-size: 6rem;
  }

  .error-message {
    font-size: 1.3rem;
  }
  
  .suggestion-list {
    grid-template-columns: 1fr;
  }
}
</style>
```
