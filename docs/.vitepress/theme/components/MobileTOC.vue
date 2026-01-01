<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vitepress'


const route = useRoute()
const isOpen = ref(false)
const headings = ref([])

// 只在文章頁面顯示（有側邊欄的技術分類頁面）
const showTocButton = ref(false)

onMounted(() => {
  checkIfArticlePage()
  extractHeadings()
  
  // 監聽路由變化
  window.addEventListener('hashchange', updateActiveHeading)
  updateActiveHeading()
})

onUnmounted(() => {
  window.removeEventListener('hashchange', updateActiveHeading)
})

const checkIfArticlePage = () => {
  const categoryPaths = ['/backend/', '/frontend/', '/data/', '/devops/', '/ai/']
  showTocButton.value = categoryPaths.some(path => route.path.startsWith(path)) && !route.path.endsWith('/index')
}

const extractHeadings = () => {
  // 提取頁面中的所有標題
  const contentElement = document.querySelector('.VPDoc .vp-doc')
  if (!contentElement) return
  
  const h2Elements = contentElement.querySelectorAll('h2, h3')
  headings.value = Array.from(h2Elements).map((heading, index) => ({
    id: heading.id,
    text: heading.textContent.replace(/^#\s*/, ''),
    level: parseInt(heading.tagName.substring(1)),
    index
  }))
}

const updateActiveHeading = () => {
  // 更新當前活動的標題（基於 scroll position）
  const hash = window.location.hash.substring(1)
  if (hash) {
    const activeHeading = headings.value.find(h => h.id === hash)
    if (activeHeading) {
      activeHeading.active = true
    }
  }
}

const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    isOpen.value = false
  }
}

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const closeDrawer = () => {
  isOpen.value = false
}
</script>

<template>
  <!-- 移動端目錄按鈕 -->
  <button 
    v-if="showTocButton"
    class="mobile-toc-button" 
    @click="toggleDrawer"
    aria-label="開啟目錄"
  >
    <i class="fas fa-list"></i>
    <span class="button-text">目錄</span>
  </button>

  <!-- 目錄抽屜 -->
  <Teleport to="body">
    <div v-if="isOpen" class="toc-overlay" @click="closeDrawer"></div>
    <div class="toc-drawer" :class="{ open: isOpen }">
      <div class="drawer-header">
        <h3><i class="fas fa-list"></i> 文章目錄</h3>
        <button class="close-button" @click="closeDrawer" aria-label="關閉目錄">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <nav class="drawer-content">
        <ul v-if="headings.length > 0" class="toc-list">
          <li 
            v-for="heading in headings" 
            :key="heading.index"
            :class="['toc-item', `level-${heading.level}`]"
          >
            <a 
              :href="`#${heading.id}`" 
              @click.prevent="scrollToHeading(heading.id)"
              class="toc-link"
            >
              {{ heading.text }}
            </a>
          </li>
        </ul>
        <p v-else class="no-headings">本文章沒有標題</p>
      </nav>
    </div>
  </Teleport>
</template>

<style scoped>
/* 移動端目錄按鈕 - 只在小螢幕顯示 */
.mobile-toc-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 40;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.mobile-toc-button:hover {
  background: var(--vp-c-brand-2);
  transform: scale(1.1);
}

.mobile-toc-button i {
  font-size: 1.2rem;
}

.button-text {
  font-size: 0.65rem;
  font-weight: 600;
}

/* 只在移動端顯示按鈕 */
@media (max-width: 959px) {
  .mobile-toc-button {
    display: flex;
  }
}

/* 遮罩層 */
.toc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 抽屜 */
.toc-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 320px;
  background: var(--vp-c-bg);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
}

.toc-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.close-button:hover {
  color: var(--vp-c-brand-1);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin: 0;
}

.toc-link {
  display: block;
  padding: 0.5rem 0.75rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  line-height: 1.4;
}

.toc-link:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.toc-item.level-2 .toc-link {
  font-weight: 600;
}

.toc-item.level-3 .toc-link {
  padding-left: 1.5rem;
  font-size: 0.85rem;
}

.no-headings {
  color: var(--vp-c-text-2);
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
}

/* 桌面版不顯示移動端組件 */
@media (min-width: 960px) {
  .mobile-toc-button,
  .toc-overlay,
  .toc-drawer {
    display: none !important;
  }
}
</style>
