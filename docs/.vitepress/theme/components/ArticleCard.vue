<script setup>
import { computed } from 'vue'
import { useFormatters } from '../composables/useFormatters.ts'
import { useUrlUtils } from '../composables/useUrlUtils.ts'
import { getCategoryIcon, getCategoryClass, getCategoryDisplayName } from '../../categories.mts'
import ViewCount from './ViewCount.vue'
import ShareButton from './ShareButton.vue'
import { APP_CONFIG } from '../constants.ts'


const { formatDate } = useFormatters()
const { getCategoryFromUrl } = useUrlUtils()

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const getArticleId = (url) => {
  const segments = url.split('/').filter(Boolean)
  return segments[segments.length - 1] || ''
}

const categoryIcon = computed(() => {
  const category = getCategoryFromUrl(props.post.url)
  return getCategoryIcon(category)
})

const categoryClass = computed(() => {
  const category = getCategoryFromUrl(props.post.url)
  const baseClass = getCategoryClass(category)
  return baseClass ? baseClass.replace('cat-', 'cat-bg-') : ''
})
</script>

<template>
  <div class="article-card" :class="{ compact }">
    <div class="card-content">
      <div class="card-header">
        <span class="category-icon" :class="categoryClass" :title="getCategoryDisplayName(getCategoryFromUrl(post.url))">
          <i :class="categoryIcon"></i>
        </span>
        <span v-if="post.isNew" class="new-badge animate-pulse-glow" :title="`最近 ${APP_CONFIG.NEW_POST_DAYS} 天內發布`">
          <i class="fa-solid fa-fire"></i> NEW
        </span>
      </div>
      
      <a :href="post.url" class="card-title-link">
        <h3 class="card-title">{{ post.title }}</h3>
      </a>
      
      <div class="card-meta">
        <div class="card-meta-row">
          <span class="card-date">
            <i class="far fa-calendar"></i> {{ formatDate(post.date) }}
          </span>
          <span class="card-updated" :class="{ 'is-hidden': !post.lastmod || post.lastmod === post.date }">
            <i class="far fa-clock"></i> {{ formatDate(post.lastmod || post.date) }}
          </span>
          
          <!-- 瀏覽次數 -->
          <span class="card-view-count">
            <i class="far fa-eye"></i> 
            <ViewCount :article-id="getArticleId(post.url)" :is-current="false" /> 次
            <ShareButton :title="post.title" :url="post.url" mode="icon" />
          </span>
        </div>
        
        <!-- 標籤移到第二行 -->
        <div v-if="post.tags && post.tags.length > 0" class="card-tags">
          <a 
            v-for="tag in post.tags.slice(0, 3)" 
            :key="tag" 
            :href="`/tags?search=${encodeURIComponent(tag)}`"
            class="tag tag-base tag-sm"
            @click.stop
          >
            {{ tag }}
          </a>
        </div>
      </div>
    </div>
    
    <a :href="post.url" class="card-arrow">
      <i class="fa-solid fa-arrow-right-long"></i>
    </a>
  </div>
</template>

<style scoped>
.article-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-md);
  color: inherit;
  gap: 1rem;
  transition: all 0.3s ease;
}

.article-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.15);
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title-link {
  text-decoration: none;
  color: inherit;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.category-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  /* Removed default background and color - let .cat-bg-* classes control these */
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

/* 動畫已移至共用樣式 components.css */

.new-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 12px;
  letter-spacing: 0.05em;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  transition: color 0.3s ease;
}

.card-title-link:hover .card-title {
  color: var(--vp-c-brand-1);
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: center;
}

.card-date,
.card-updated,
.card-view-count {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.card-date i,
.card-updated i,
.card-view-count i {
  font-size: 0.85rem;
}

.card-updated {
  opacity: 0.8;
}

.card-updated.is-hidden {
  visibility: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* 當沒有更新日期時，讓瀏覽次數靠右對齊 */

/* 標籤樣式繼承 tag-base tag-sm，僅定義卡片內特殊樣式 */

.card-arrow {
  font-size: 1.2rem;
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
  transition: transform 0.3s ease;
  text-decoration: none;
}

.article-card:hover .card-arrow {
  transform: translateX(6px);
}

/* Compact mode for smaller grids */
.article-card.compact {
  padding: 1.25rem;
}

.article-card.compact .card-title {
  font-size: 1rem;
  -webkit-line-clamp: 2;
}

.article-card.compact .category-icon {
  width: 28px;
  height: 28px;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .article-card {
    padding: 1.25rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .card-meta {
    gap: 0.4rem;
  }
}
</style>
