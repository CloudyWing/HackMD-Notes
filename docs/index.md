---
layout: home

hero:
  name: CloudWing's Log
  text: "雲翼的技術隨筆"
  tagline: "向下探索最新技術文章與學習筆記"
  actions:
    - theme: brand
      text: 開始閱讀
      link: /backend/
---

<script setup>
import { data as posts } from './posts.data.ts'
import { computed } from 'vue'
import ArticleCard from './.vitepress/theme/components/ArticleCard.vue'

const latestPosts = computed(() => posts.slice(0, 8))
</script>

<div class="home-content">
  <div class="latest-articles">
    <h2 class="section-title">
      <span class="icon"><i class="fa-solid fa-bolt-lightning"></i></span>
      最新文章
    </h2>
    <div class="article-grid">
      <ArticleCard
        v-for="post in latestPosts"
        :key="post.url"
        :post="post"
        compact
      />
    </div>
  </div>
</div>

<style scoped>
.home-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 2rem 4rem;
}

.latest-articles {
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title .icon {
  font-size: 2rem;
  color: var(--vp-c-brand-1);
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 960px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-title {
    font-size: 1.5rem;
  }
}
</style>
