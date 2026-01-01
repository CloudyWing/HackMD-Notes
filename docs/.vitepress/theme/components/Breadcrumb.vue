<script setup>
import { useRoute, useData } from 'vitepress'
import { computed } from 'vue'
import { getCategoryDisplayName, getCategoryClass } from '../../categories.mjs'


const route = useRoute()
const { page } = useData()

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(p => p)
  const items = [{ text: '首頁', link: '/' }]
  
  // 只在文章頁面顯示麵包屑 (不在首頁和分類索引頁)
  if (parts.length > 0 && !route.path.endsWith('/')) {
    // 第一層是分類
    const category = parts[0]
    items.push({
      text: getCategoryDisplayName(category),
      link: `/${category}/`,
      className: getCategoryClass(category)
    })
    
    // 如果有文章標題
    if (page.value.title) {
      items.push({
        text: page.value.title,
        link: route.path,
        current: true
      })
    }
  }
  
  return items
})

// 只在有多個層級時顯示，且排除特殊頁面（如關於我）
const shouldShow = computed(() => {
  const excludedPaths = ['/about', '/tags']
  const isExcluded = excludedPaths.some(path => route.path.startsWith(path))
  return breadcrumbs.value.length > 2 && !isExcluded
})
</script>

<template>
  <nav class="breadcrumb" aria-label="麵包屑導航" v-if="shouldShow">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in breadcrumbs" :key="item.link" class="breadcrumb-item">
        <a v-if="!item.current" :href="item.link" class="breadcrumb-link" :class="item.className">
          {{ item.text }}
        </a>
        <span v-else class="breadcrumb-current">{{ item.text }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-divider">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.breadcrumb-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--vp-c-brand-1);
}

.breadcrumb-current {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.breadcrumb-divider {
  color: var(--vp-c-text-3);
  user-select: none;
}
</style>
