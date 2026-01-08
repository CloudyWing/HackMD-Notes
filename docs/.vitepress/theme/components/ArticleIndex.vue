<script setup>
import { data as posts } from '../../../posts.data.ts'
import { computed, ref, onMounted, watch } from 'vue'
import { useFormatters } from '../composables/useFormatters.ts'
import { APP_CONFIG } from '../constants.ts'
import ViewCount from './ViewCount.vue'
import ShareButton from './ShareButton.vue'


const { formatDate } = useFormatters()

const props = defineProps({
  category: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  showCategory: {
    type: Boolean,
    default: true
  }
})

const pinnedUrls = ref(new Set())
const sortField = ref('date')  // 'date', 'lastmod', 'title'
const sortOrder = ref('desc')  // 'asc', 'desc'
const currentPage = ref(1)
const itemsPerPage = APP_CONFIG.ITEMS_PER_PAGE

const getArticleId = (url) => {
  const segments = url.split('/').filter(Boolean)
  return segments[segments.length - 1] || ''
}

const sortFieldOptions = [
  { value: 'date', label: '發佈日期' },
  { value: 'lastmod', label: '更新日期' },
  { value: 'title', label: '標題' }
]

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  currentPage.value = 1  // Reset to first page when sort changes
}

onMounted(() => {
  const stored = window.localStorage.getItem('pinnedArticles')
  if (stored) {
    try {
      pinnedUrls.value = new Set(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load pinned articles:', e)
    }
  }
})

const togglePin = (url) => {
  if (pinnedUrls.value.has(url)) {
    pinnedUrls.value.delete(url)
  } else {
    pinnedUrls.value.add(url)
  }
  window.localStorage.setItem('pinnedArticles', JSON.stringify([...pinnedUrls.value]))
}

const getSortFunction = () => {
  const field = sortField.value
  const order = sortOrder.value
  
  let compareFn
  
  switch(field) {
    case 'date':
      compareFn = (a, b) => new Date(a.date) - new Date(b.date)
      break
    case 'lastmod':
      compareFn = (a, b) => new Date(a.lastmod || a.date) - new Date(b.lastmod || b.date)
      break
    case 'title':
      compareFn = (a, b) => a.title.localeCompare(b.title, 'zh-TW')
      break
    default:
      compareFn = (a, b) => new Date(a.date) - new Date(b.date)
  }
  
  return order === 'desc' ? (a, b) => compareFn(b, a) : compareFn
}

const filteredPosts = computed(() => {
  let filtered = posts
  
  if (props.category) {
    filtered = filtered.filter(post => {
      return post.url.startsWith('/' + props.category + '/')
    })
  }
  
  if (props.tags && props.tags.length > 0) {
    filtered = filtered.filter(post => {
      if (!post.tags) return false
      return props.tags.every(tag => post.tags.includes(tag))
    })
  }
  
  // Separate pinned and unpinned
  const pinned = filtered.filter(post => pinnedUrls.value.has(post.url))
  const unpinned = filtered.filter(post => !pinnedUrls.value.has(post.url))
  
  // Sort both groups using selected sort method
  const sortFn = getSortFunction()
  pinned.sort(sortFn)
  unpinned.sort(sortFn)
  
  return [...pinned, ...unpinned]
})

// Total number of pages
const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / itemsPerPage)
})

// Get posts for current page
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPosts.value.slice(start, end)
})

// Reset to page 1 when filters change
const resetPage = () => {
  currentPage.value = 1
}

// Watch for changes in category or tags and reset page
watch(() => [props.category, props.tags], resetPage)
watch(sortField, resetPage)

// Pagination navigation
const scrollToTop = () => {
  document.querySelector('.article-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    scrollToTop()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    scrollToTop()
  }
}
</script>

<template>
  <div class="article-list">
    <div v-if="filteredPosts.length > 0" class="list-controls">
      <div class="sort-control">
        <label for="sort-field-select">
          <i class="fa-solid fa-sort"></i>
          排序
        </label>
        <div class="sort-controls-group">
          <select id="sort-field-select" v-model="sortField" class="sort-select">
            <option v-for="option in sortFieldOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <button 
            class="sort-order-toggle btn-base btn-icon" 
            :aria-label="sortOrder === 'desc' ? '降序排列' : '升序排列'"
            :title="sortOrder === 'desc' ? '點擊切換為升序' : '點擊切換為降序'"
            @click="toggleSortOrder"
          >
            <i :class="sortOrder === 'desc' ? 'fa-solid fa-arrow-down-wide-short' : 'fa-solid fa-arrow-up-short-wide'"></i>
          </button>
        </div>
      </div>
      
      <div class="pin-info info-box">
        📌 釘選紀錄僅儲存於此瀏覽器
      </div>
    </div>
    
    <div
      v-for="post in paginatedPosts"
      :key="post.url"
      class="article-item"
      :class="{ pinned: pinnedUrls.has(post.url) }"
    >
      <button 
        class="pin-button"
        :aria-label="pinnedUrls.has(post.url) ? '取消釘選' : '釘選文章'"
        :title="pinnedUrls.has(post.url) ? '取消釘選' : '釘選文章'"
        @click="togglePin(post.url)"
      >
        <i :class="pinnedUrls.has(post.url) ? 'fa-solid fa-thumbtack' : 'fa-regular fa-thumbtack'"></i>
      </button>
      
      <a :href="post.url" class="article-link">
        <h3 class="article-title">
          {{ post.title }}
          <span v-if="post.isNew" class="new-badge animate-pulse-glow" :title="`最近 ${APP_CONFIG.NEW_POST_DAYS} 天內發布`">
            <i class="fa-solid fa-fire"></i> NEW
          </span>
        </h3>
        <p v-if="post.description" class="article-description">{{ post.description }}</p>
        <div class="article-meta">
          <div class="article-meta-row">
            <span class="article-date">
              <i class="far fa-calendar"></i> {{ formatDate(post.date) }}
            </span>
            <span class="article-updated" :class="{ 'is-hidden': !post.lastmod || post.lastmod === post.date }" title="更新日期">
              <i class="far fa-clock"></i> {{ formatDate(post.lastmod || post.date) }}
            </span>
            
            <!-- 瀏覽次數 -->
            <span class="article-view-count">
              <i class="far fa-eye"></i> 
              <ViewCount :article-id="getArticleId(post.url)" :is-current="false" /> 次
              <ShareButton :title="post.title" :url="post.url" mode="icon" />
            </span>
          </div>
          
          <!-- 標籤移到第二行 -->
          <div v-if="post.tags && post.tags.length > 0" class="article-tags">
            <a 
              v-for="tag in post.tags.slice(0, 3)" 
              :key="tag" 
              :href="`/tags?search=${encodeURIComponent(tag)}`"
              class="tag-base tag-sm"
              @click.stop
            >
              {{ tag }}
            </a>
          </div>
        </div>
      </a>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="pagination-controls">
      <button 
        class="pagination-button btn-base" 
        :disabled="currentPage === 1"
        :aria-label="'上一頁'"
        @click="prevPage" 
      >
        <i class="fa-solid fa-chevron-left"></i>
        <span class="btn-text">上一頁</span>
      </button>
      
      <!-- Desktop Pagination: Numbers -->
      <div class="desktop-pagination">
        <button 
          v-for="page in totalPages" 
          :key="page"
          class="page-number-btn"
          :class="{ active: currentPage === page }"
          @click="currentPage = page; scrollToTop()"
        >
          {{ page }}
        </button>
      </div>

      <!-- Mobile Pagination: Dropdown -->
      <div class="mobile-pagination">
        <div class="pagination-select-wrapper">
          <select 
            v-model="currentPage" 
            class="pagination-select"
            aria-label="選擇頁碼"
            @change="scrollToTop"
          >
            <option v-for="page in totalPages" :key="page" :value="page">
              第 {{ page }} 頁 / 共 {{ totalPages }} 頁
            </option>
          </select>
          <i class="fa-solid fa-chevron-down select-arrow"></i>
        </div>
      </div>
      
      <button 
        class="pagination-button btn-base" 
        :disabled="currentPage === totalPages"
        :aria-label="'下一頁'"
        @click="nextPage" 
      >
        <span class="btn-text">下一頁</span>
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
.article-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sort-control label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.sort-control i {
  color: var(--vp-c-brand-1);
}

.sort-controls-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sort-select {
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 120px;
}

/* 使用共用按鈕樣式的擴展 */

.sort-select:hover {
  border-color: var(--vp-c-brand-1);
}

.sort-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.sort-order-toggle {
  /* 繼承 btn-base 和 btn-icon 的樣式，僅覆蓋特殊部分 */
  color: var(--vp-c-brand-1);
  font-size: 1rem;
}

.pin-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-brand-soft);
  border-left: 3px solid var(--vp-c-brand-1);
  border-radius: var(--radius-sm);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.article-item {
  position: relative;
  display: flex;
  gap: 0.75rem;
  padding: var(--spacing-lg);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-md);
  transition: var(--transition-standard);
}

.article-item.pinned {
  background: color-mix(in srgb, var(--vp-c-brand-1) 5%, var(--vp-c-bg-soft));
  border-color: var(--vp-c-brand-1);
}

.article-item:hover {
  transform: translateX(8px);
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--shadow-brand-sm);
}

.pin-button {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-button:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.article-item.pinned .pin-button {
  color: var(--vp-c-brand-1);
}

.article-link {
  flex: 1;
  text-decoration: none;
  min-width: 0;
}

.article-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 12px;
  letter-spacing: 0.05em;
}

.new-badge.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 動畫已移至共用樣式 components.css */

.article-description {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.article-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.article-meta-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  align-items: center;
}

.article-date,
.article-updated,
.article-view-count {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.article-date i,
.article-updated i,
.article-view-count i {
  font-size: 0.9rem;
}

.article-updated.is-hidden {
  visibility: hidden;
}

/* 標籤樣式已移至共用樣式 components.css */

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.desktop-pagination {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.page-number-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-number-btn:hover:not(.active) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.page-number-btn.active {
  background: var(--vp-c-brand-1);
  color: white;
  border-color: var(--vp-c-brand-1);
}

/* Mobile Dropdown Styles */
.mobile-pagination {
  display: none;
}

.pagination-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.pagination-select {
  appearance: none;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 160px;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  color: var(--vp-c-text-2);
  pointer-events: none;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .list-controls {
    gap: 0.5rem;
  }

  .sort-control {
    width: 100%;
  }

  .sort-controls-group {
    flex: 1;
  }

  .sort-select {
    flex: 1;
    min-width: 0;
  }

  .article-item {
    padding: 1rem;
    gap: 0.5rem;
  }

  .pin-button {
    width: 28px;
    height: 28px;
  }

  .article-title {
    font-size: 1.1rem;
  }
  
  .pin-info {
    font-size: 0.8rem;
    padding: 0.6rem 0.85rem;
  }
  
  /* Pagination Responsive */
  .pagination-controls {
    display: flex !important;
    flex-direction: row !important; /* CRITICAL: Override column layout */
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.5rem;
  }

  .desktop-pagination {
    display: none;
  }

  .mobile-pagination {
    display: block;
    flex: 0 1 auto;
    min-width: 140px;
    max-width: 180px;
  }

  .pagination-select {
    width: 100%;
    text-align: center;
    font-size: 0.85rem;
    padding: 0.5rem 1.5rem 0.5rem 0.75rem;
    min-width: 0;
  }
  
  /* Icon-only square buttons on mobile */
  .pagination-button {
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }
  
  .pagination-button .btn-text {
    display: none;
  }
  
  .pagination-button i {
    margin: 0;
    font-size: 0.9rem;
  }
  
  .select-arrow {
    font-size: 0.7rem;
  }
}
</style>
