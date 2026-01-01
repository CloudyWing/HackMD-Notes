<!--
目前每個分類 index.md 都用相同程式碼引用 CategoryPage.vue 原因：
* SEO 更好：手寫物理路徑對搜尋引擎最友善，網址結構一目了然。
* 構建穩定：不玩動態路由的複雜配置，構建時「所見即所得」，出錯率最低。
* 靈活度高：.md 只是入口，邏輯交給組件，還能針對特定分類單獨改 Frontmatter。
-->

<script setup>
import { useRoute, useData } from 'vitepress'
import { computed, watchEffect } from 'vue'
import ArticleIndex from './ArticleIndex.vue'
import { getCategoryDisplayName } from '../../categories.mjs'

const route = useRoute()
const { frontmatter } = useData()

const category = computed(() => {
  const parts = route.path.split('/')
  return parts[1]
})

const categoryLabel = computed(() => {
  return getCategoryDisplayName(category.value)
})

watchEffect(() => {
  if (typeof window !== 'undefined') {
    document.title = `${categoryLabel.value} | CloudWing's Log`
  }
})
</script>

<template>
  <div class="category-page">
    <h1>{{ categoryLabel }}</h1>
    
    <ArticleIndex :category="category" />
  </div>
</template>

<style scoped>
.category-description {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin-bottom: 2rem;
  font-weight: 400;
}
</style>
