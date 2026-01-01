<script setup>
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <div v-if="frontmatter.tags && frontmatter.tags.length > 0" class="article-tags-section">
    <h3 class="tags-title">
      <i class="fas fa-tags"></i> 文章標籤
    </h3>
    <div class="tags-list">
      <a
        v-for="tag in frontmatter.tags"
        :key="tag"
        :href="`/tags?search=${encodeURIComponent(tag)}`"
        class="tag-link tag-base tag-md"
      >
        <i class="fas fa-tag"></i> {{ tag }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.article-tags-section {
  margin-top: var(--spacing-3xl);
  padding-top: var(--spacing-xl);
  border-top: 2px solid var(--vp-c-divider);
}

.tags-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

/* 標籤樣式繼承 tag-base tag-md，僅定義文章內特殊樣式 */
.tag-link {
  gap: 0.4rem;
}

.tag-link i {
  font-size: 0.8rem;
}
</style>
