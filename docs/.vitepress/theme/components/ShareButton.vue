<script setup>
import { ref, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter } = useData()
const route = useRoute()

// 只在文章頁面顯示（有 frontmatter.title 且不是首頁或特殊頁面）
const isArticlePage = computed(() => {
  const specialPages = ['/', '/tags', '/about']
  const isSpecial = specialPages.includes(route.path) || route.path.endsWith('/index')
  return frontmatter.value.title && !isSpecial
})

const canShare = ref(false)

if (typeof window !== 'undefined') {
  canShare.value = !!navigator.share
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
</script>

<template>
  <button
    v-if="canShare && isArticlePage"
    class="share-button share-button-elegant"
    @click="shareArticle"
    aria-label="分享文章"
    title="透過系統原生分享功能分享此文章"
  >
    <i class="fas fa-share-alt"></i> 分享
  </button>
</template>

<style scoped>
/* 桌面版和中等螢幕：顯示 */
@media (min-width: 960px) {
  .share-button {
    display: inline-flex !important;
  }
}

/* 行動版：隱藏（使用 ArticleFooterMeta） */
@media (max-width: 959px) {
  .share-button {
    display: none !important;
  }
}
</style>
