<script setup>
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'


const { frontmatter } = useData()
const route = useRoute()

// 只在文章頁面顯示（有 frontmatter.title 且不是首頁或特殊頁面）
const isArticlePage = computed(() => {
  const specialPages = ['/', '/tags', '/about']
  const isSpecial = specialPages.includes(route.path) || route.path.endsWith('/index')
  return frontmatter.value.title && !isSpecial
})

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
</script>

<template>
  <div v-if="isArticlePage && canShare" class="article-footer-meta">
    <!-- 完整分享按鈕（圖標+文字） - 僅行動版 -->
    <button 
      class="footer-share-button share-button-elegant"
      @click="shareArticle"
      aria-label="分享文章"
    >
      <i class="fas fa-share-alt"></i>
      分享
    </button>
  </div>
</template>

<style scoped>
/* 所有尺寸都顯示分享按鈕（內嵌式，非懸浮） */
.article-footer-meta {
  display: flex;
  justify-content: stretch;
  padding: 1rem 0;
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
}

/* 行動版：全寬按鈕 + 額外間距 */
@media (max-width: 959px) {
  .article-footer-meta {
    padding: 1rem;
    border-top: 2px solid var(--vp-c-divider);
    margin: 0 -1.5rem 1rem;
  }
  
  .footer-share-button {
    width: 100%;
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
  
  .footer-share-button i {
    font-size: 1.1rem;
  }
}
</style>
