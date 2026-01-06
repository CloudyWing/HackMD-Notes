<script setup>
import { data as posts } from '../../../posts.data.ts'
import { computed, ref, onMounted } from 'vue'
import ArticleIndex from './ArticleIndex.vue'
import { APP_CONFIG } from '../constants.ts'


// 選中的標籤（改為陣列支援多選）
const selectedTags = ref([])

// 標籤顯示控制
const showAllTags = ref(false)
const TAG_DISPLAY_LIMIT = APP_CONFIG.TAG_DISPLAY_LIMIT

// 從 URL 參數讀取初始標籤
onMounted(() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const searchTag = params.get('search')
    if (searchTag && allTags.value.includes(searchTag)) {
      selectedTags.value = [searchTag]
      // 滾動到文章列表
      setTimeout(() => {
        const resultsSection = document.querySelector('.filtered-articles')
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }
})

// Extract all unique tags and sort by popularity (article count)
const allTags = computed(() => {
  const tagSet = new Set()
  posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagSet.add(tag))
    }
  })
  // Sort by article count (descending), then alphabetically for ties
  return Array.from(tagSet).sort((a, b) => {
    const countDiff = tagCounts.value[b] - tagCounts.value[a]
    return countDiff !== 0 ? countDiff : a.localeCompare(b)
  })
})

// 顯示的標籤（可收合）
const visibleTags = computed(() => {
  if (showAllTags.value) {
    return allTags.value
  }
  return allTags.value.slice(0, TAG_DISPLAY_LIMIT)
})

// 隱藏的標籤數量
const hiddenTagsCount = computed(() => {
  return Math.max(0, allTags.value.length - TAG_DISPLAY_LIMIT)
})

const tagCounts = computed(() => {
  const counts = {}
  posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    }
  })
  return counts
})

// 根據選中的標籤篩選文章（支援多選 - AND 邏輯）
const filteredPosts = computed(() => {
  if (selectedTags.value.length === 0) return []
  return posts.filter(post => {
    if (!post.tags) return false
    return selectedTags.value.every(tag => post.tags.includes(tag))
  }).sort((a, b) => new Date(b.date) - new Date(a.date))
})

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  // 移除自動跳轉功能
}

const clearSelection = () => {
  selectedTags.value = []
}

const isTagSelected = (tag) => {
  return selectedTags.value.includes(tag)
}

const toggleShowAllTags = () => {
  showAllTags.value = !showAllTags.value
}
</script>

<template>
  <div class="tags-page">
    <h1><i class="fas fa-tags"></i> 標籤列表</h1>
    
    <!-- 已篩選標籤區（移到頂部） -->
    <div v-if="selectedTags.length > 0" class="selected-filter-section">
      <div class="filter-content">
        <div class="filter-label">
          <i class="fas fa-filter"></i>
          <span>已篩選:</span>
        </div>
        <div class="selected-tags-chips">
          <span 
            v-for="tag in selectedTags" 
            :key="tag" 
            class="selected-tag-chip tag-base"
            @click="toggleTag(tag)"
          >
            {{ tag }}
            <i class="fas fa-times"></i>
          </span>
        </div>
        <button class="clear-all-btn btn-base" @click="clearSelection">
          清除全部
        </button>
      </div>
    </div>
    
    <div class="tags-info info-box">
      <i class="fas fa-info-circle"></i>
      點擊標籤進行篩選（多選時將顯示同時包含的文章）
    </div>
    
    <div class="tag-selector-section">
      <h2 class="section-title">
        <i class="fas fa-tag"></i>
        選擇標籤
      </h2>
      
      <div class="tags-cloud">
        <button
          v-for="tag in visibleTags"
          :key="tag"
          class="tag-item tag-base tag-md"
          :class="{ active: isTagSelected(tag) }"
          @click="toggleTag(tag)"
          @keydown.enter="toggleTag(tag)"
          @keydown.space.prevent="toggleTag(tag)"
          :aria-pressed="isTagSelected(tag)"
          :aria-label="`${tag} 標籤,${tagCounts[tag]} 篇文章`"
        >
          <span class="tag-name">{{ tag }}</span>
          <span class="tag-count">{{ tagCounts[tag] }}</span>
        </button>
      </div>
      
      <!-- 顯示更多/較少按鈕 -->
      <div v-if="allTags.length > TAG_DISPLAY_LIMIT" class="show-more-section">
        <button class="show-more-btn btn-base" @click="toggleShowAllTags">
          <i :class="showAllTags ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          <span v-if="!showAllTags">顯示更多 (還有 {{ hiddenTagsCount }} 個)</span>
          <span v-else>顯示較少</span>
        </button>
      </div>
    </div>

    <!-- 篩選後的文章列表標題 -->
    <div v-if="selectedTags.length > 0" class="articles-header">
      <h2>
        <i class="fas fa-file-alt"></i>
        文章列表
        <span class="article-count">(共 {{ filteredPosts.length }} 篇)</span>
      </h2>
    </div>
    
    <!-- 文章列表組件 -->
    <ArticleIndex v-if="selectedTags.length > 0" :tags="selectedTags" :showCategory="false" />
  </div>
</template>

<style scoped>

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

h1 i {
  font-size: 2.2rem;
}

/* 已篩選標籤區（頂部） */
.selected-filter-section {
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-brand-1);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.filter-label i {
  font-size: 1rem;
}

.selected-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
}

/* 已選標籤樣式繼承 tag-base，僅定義特殊樣式 */
.selected-tag-chip {
  background: var(--vp-c-brand-1);
  color: white;
}

.selected-tag-chip:hover {
  background: var(--vp-c-brand-2);
  transform: scale(1.05);
}

.selected-tag-chip i {
  font-size: 0.7rem;
  opacity: 0.9;
}

/* 清除按鈕繼承 btn-base */
.clear-all-btn {
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.clear-all-btn:hover {
  background: var(--vp-c-brand-1);
  color: white;
}

/* 資訊框繼承 info-box */

/* 標籤選擇區 */
.tag-selector-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.section-title i {
  color: var(--vp-c-brand-1);
  font-size: 1.3rem;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

/* 標籤項目繼承 tag-base tag-md，僅定義特殊狀態 */
.tag-item {
  gap: 0.4rem;
}

.tag-item:hover,
.tag-item.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: translateY(-2px);
  box-shadow: var(--shadow-brand-sm);
}

.tag-item.active {
  background: var(--vp-c-brand-1);
}

.tag-item.active .tag-name {
  color: white;
}

.tag-item.active .tag-count {
  background: white;
  color: var(--vp-c-brand-1);
}

.tag-name {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.tag-count {
  background: var(--vp-c-brand-1);
  color: white;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-xl);
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

/* 顯示更多按鈕 */
.show-more-section {
  display: flex;
  justify-content: center;
  padding-top: 0.25rem;
}

/* 顯示更多按鈕繼承 btn-base，無需額外樣式 */

/* 文章列表標題區 */
.articles-header {
  margin-top: 3rem;
  padding-top: 2rem;
  margin-bottom: 2rem;
  /* Removed border-top to avoid double border with tag selector section */
}

.articles-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
}

.articles-header h2 i {
  font-size: 1.5rem;
}

.article-count {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  font-weight: 400;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }
  
  h1 i {
    font-size: 1.8rem;
  }
  
  .selected-filter-section {
    padding: 0.75rem 1rem;
  }
  
  .filter-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .clear-all-btn {
    width: 100%;
    justify-content: center;
  }
  
  .tags-cloud {
    gap: 0.75rem;
  }
  
  .tag-item {
    font-size: 0.85rem;
    padding: 0.45rem 0.9rem;
  }

  .articles-header h2 {
    font-size: 1.5rem;
  }
  
  .articles-header h2 i {
    font-size: 1.3rem;
  }
}
</style>
