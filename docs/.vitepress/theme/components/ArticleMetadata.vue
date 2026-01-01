<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'
import ViewCount from './ViewCount.vue'

const { frontmatter } = useData()

// 格式化日期：只顯示日期部分（YYYY-MM-DD）
const formattedDate = computed(() => {
  if (!frontmatter.value.date) return ''
  return formatDate(frontmatter.value.date)
})

const formattedLastMod = computed(() => {
  if (!frontmatter.value.lastmod) return frontmatter.value.date
  return frontmatter.value.lastmod
})

const hasUpdatedDate = computed(() => {
  if (!frontmatter.value.lastmod) return false
  const dateStr = formatDate(frontmatter.value.date)
  const lastModStr = formatDate(frontmatter.value.lastmod)
  return dateStr !== lastModStr
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  if (String(dateStr).includes(' ')) {
    return String(dateStr).split(' ')[0]
  }
  if (String(dateStr).includes('T')) {
    return String(dateStr).split('T')[0]
  }
  return String(dateStr)
}

const shareArticle = async () => {
  if (!navigator.share) return
  
  try {
    await navigator.share({
      title: frontmatter.value.title || document.title,
      text: `推薦閱讀：${frontmatter.value.title}`,
      url: window.location.href
    })
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('分享失敗:', err)
    }
  }
}

const canShare = typeof window !== 'undefined' && navigator.share

const getArticleId = () => {
  if (typeof window === 'undefined') return ''
  const segments = window.location.pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1] || ''
  return decodeURIComponent(lastSegment)
}
</script>

<template>
  <div v-if="formattedDate" class="article-metadata">
    <div class="metadata-row">
      <time class="article-date" title="發佈日期">
        <i class="far fa-calendar"></i>
        {{ formattedDate }}
      </time>

      <time v-if="hasUpdatedDate" class="article-date last-mod" title="更新日期">
        <i class="far fa-clock"></i>
        {{ formatDate(formattedLastMod) }}
      </time>
      
      <span class="view-count" title="瀏覽次數">
        <i class="far fa-eye"></i>
        <ViewCount :article-id="getArticleId()" :is-current="true" /> 次瀏覽
      </span>
    </div>
    
    <!-- 行動版：圓形分享圖標（僅圖標） -->
    <button 
      v-if="canShare"
      class="mobile-share-icon" 
      @click="shareArticle"
      aria-label="分享文章"
      title="分享此文章"
    >
      <i class="fas fa-share-alt"></i>
    </button>
  </div>
</template>

<style scoped>
.article-metadata {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 0 2rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.metadata-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.article-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.article-date i {
  font-size: 0.9rem;
  color: var(--vp-c-brand-1);
}

.last-mod {
  font-size: 0.85rem;
  opacity: 0.8;
}

.last-mod.is-hidden {
  visibility: hidden;
}

.last-mod i {
  color: var(--vp-c-text-2);
}

/* 瀏覽次數 */
.view-count {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.view-count i {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

/* 分享圖標（縮小尺寸）*/
.mobile-share-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  color: var(--vp-c-brand-1);
  border: 1.5px solid var(--vp-c-brand-1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.mobile-share-icon:hover {
  background: var(--vp-c-brand-1);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.25);
}

.mobile-share-icon:active {
  transform: scale(0.95);
}

.dark .mobile-share-icon:hover {
  box-shadow: 0 4px 8px rgba(251, 146, 60, 0.3);
}
</style>
