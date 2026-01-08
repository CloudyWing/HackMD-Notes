<script setup>
import { ref, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'full' // 'full' (icon + text) or 'icon' (icon only)
  }
})

const { frontmatter } = useData()

// 如果沒有傳入 props，則預設使用當前頁面資訊
const targetTitle = computed(() => props.title || frontmatter.value.title || document.title)
const targetUrl = computed(() => {
  if (props.url) {
    // 確保 url 是完整的 (包含 domain)
    if (props.url.startsWith('http')) return props.url
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${props.url}`
    }
  }
  return typeof window !== 'undefined' ? window.location.href : ''
})

const canShare = ref(false)

if (typeof window !== 'undefined') {
  canShare.value = !!navigator.share
}

const shareArticle = async () => {
  if (!navigator.share) return

  try {
    await navigator.share({
      title: targetTitle.value,
      text: `推薦閱讀：${targetTitle.value}`,
      url: targetUrl.value
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
    v-if="canShare"
    class="share-button"
    :class="[`share-button-${mode}`, 'share-button-elegant']"
    aria-label="分享"
    :title="`分享：${targetTitle}`"
    @click.prevent.stop="shareArticle"
  >
    <i class="fas fa-share-alt"></i>
    <span v-if="mode === 'full'" class="share-text">分享</span>
  </button>
</template>

<style scoped>
.share-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  padding: 4px 8px;
  margin-left: 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.share-button:hover {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.share-button-icon {
  padding: 4px;
}

.share-button-icon .share-text {
  display: none;
}
</style>
