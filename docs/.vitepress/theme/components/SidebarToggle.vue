<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
const isCollapsed = ref(false)
const toggleButton = ref(null)

// 只在技術分類頁面顯示（有側邊欄的頁面）
const showToggle = computed(() => {
  const categoryPaths = ['/backend/', '/frontend/', '/data/', '/devops/', '/ai/']
  return categoryPaths.some(path => route.path.startsWith(path)) && !route.path.endsWith('/index')
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  const sidebar = document.querySelector('.VPSidebar')
  const content = document.querySelector('.VPDoc .container')
  
  if (sidebar) {
    sidebar.classList.toggle('sidebar-collapsed')
  }
  
  // 調整切換按鈕位置
  if (toggleButton.value) {
    if (isCollapsed.value) {
      toggleButton.value.style.left = '10px'
    } else {
      toggleButton.value.style.left = '240px' // Inside sidebar
    }
  }
  
  // 調整內容區域 padding
  if (content) {
    if (isCollapsed.value) {
      content.style.paddingLeft = '32px'
    } else {
      content.style.paddingLeft = ''
    }
  }
}

// 在大螢幕自動展開側邊欄
const handleResize = () => {
  if (window.innerWidth > 1280 && isCollapsed.value) {
    isCollapsed.value = false
    const sidebar = document.querySelector('.VPSidebar')
    const content = document.querySelector('.VPDoc .container')
    
    if (sidebar) {
      sidebar.classList.remove('sidebar-collapsed')
    }
    
    if (toggleButton.value) {
      toggleButton.value.style.left = '240px'
    }
    
    if (content) {
      content.style.paddingLeft = ''
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // 初始檢查
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <button 
    v-if="showToggle"
    ref="toggleButton"
    class="sidebar-toggle" 
    @click="toggleSidebar"
    :class="{ collapsed: isCollapsed }"
    :aria-label="isCollapsed ? '展開側邊欄' : '收縮側邊欄'"
  >
    <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
  </button>
</template>

<style scoped>
.sidebar-toggle {
  position: fixed;
  left: 240px; /* Inside sidebar edge */
  top: 80px;
  z-index: 35;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px; /* Rounded square */
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.sidebar-toggle:hover {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.sidebar-toggle i {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

/* 大螢幕：隱藏切換（> 1280px）*/
@media (min-width: 1281px) {
  .sidebar-toggle {
    display: none !important;
  }
}

/* 中等螢幕：顯示切換（1024-1280px）*/
@media (min-width: 1024px) and (max-width: 1280px) {
  .sidebar-toggle {
    display: flex !important;
  }
}

/* 行動版：隱藏切換（< 1024px）*/
@media (max-width: 1023px) {
  .sidebar-toggle {
    display: none !important;
  }
}
</style>

<style>
/* 全局樣式 - 側邊欄收縮效果 */
@media (min-width: 960px) {
  .VPSidebar.sidebar-collapsed {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .VPSidebar.sidebar-collapsed ~ .VPContent {
    padding-left: 0 !important;
    transition: padding-left 0.3s ease;
  }
}
</style>
