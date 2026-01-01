<script setup>
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { data as posts } from '../../../posts.data.ts'
import { useUrlUtils } from '../composables/useUrlUtils.ts'
import ArticleCard from './ArticleCard.vue'

/**
 * 相關文章推薦策略：
 * 1. 系列文章 (標題前綴相同)
 * 2. 共同標籤 (Tags)
 * 3. 同分類 + 最新發布
 */

const { normalizeUrl, getCategoryFromUrl } = useUrlUtils()

const { frontmatter } = useData()
const route = useRoute()

// Only show related articles on actual article pages (pages with a date)
const shouldShowRelatedArticles = computed(() => {
  return !!frontmatter.value.date
})

// Extract series name from title (first segment before " - ")
const getSeriesName = (title) => {
  if (!title) return null
  const parts = title.split('-')
  if (parts.length < 2) return null
  return parts[0].trim()
}

const relatedArticles = computed(() => {
  const currentUrlNormalized = normalizeUrl(route.path)
  const currentTitle = frontmatter.value.title
  const currentSeriesName = getSeriesName(currentTitle)
  const currentCategory = getCategoryFromUrl(route.path)
  // Convert Proxy(Array) to plain array for proper comparison
  const currentTags = Array.isArray(frontmatter.value.tags) ? [...frontmatter.value.tags] : []
  
  // Filter out current article
  const otherArticles = posts.filter(post => {
    const postUrlNormalized = normalizeUrl(post.url)
    return postUrlNormalized !== currentUrlNormalized
  })
  
  // Find series articles
  const seriesArticles = currentSeriesName 
    ? otherArticles
        .filter(post => getSeriesName(post.title) === currentSeriesName)
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending (newest first)
    : []
  
  // If series has 4+ articles, show only series
  if (seriesArticles.length >= 4) {
    return seriesArticles
  }
  
  // Otherwise fill with other related articles
  const remainingSlots = 4 - seriesArticles.length
  const seriesUrls = new Set(seriesArticles.map(a => normalizeUrl(a.url)))
  
  // Score non-series articles
  const scoredArticles = otherArticles
    .filter(post => !seriesUrls.has(normalizeUrl(post.url)))
    .map(post => {
      let score = 0
      
      // Common tags count (highest priority)
      if (post.tags && currentTags.length > 0) {
        const commonTags = post.tags.filter(tag => currentTags.includes(tag))
        score += commonTags.length * 100
      }
      
      // Same category + recency
      if (getCategoryFromUrl(post.url) === currentCategory) {
        score += 10
        // Bonus for newer articles (max 5 points)
        const daysSincePublish = (new Date() - new Date(post.date)) / (1000 * 60 * 60 * 24)
        const recencyScore = Math.max(0, 5 - (daysSincePublish / 365))
        score += recencyScore
      }
      
      return { ...post, relevanceScore: score }
    })
    .filter(post => post.relevanceScore > 0)  // Filter out different-category articles with no common tags
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      return new Date(b.date) - new Date(a.date)
    })
    .slice(0, remainingSlots)
  
  const result = [...seriesArticles, ...scoredArticles]
  
  // Only hide if no related articles at all
  return result
})
</script>

<template>
  <div v-if="shouldShowRelatedArticles && relatedArticles.length > 0" class="related-articles">
    <h2 class="section-title">
      <i class="fa-solid fa-compass"></i> 相關文章
    </h2>
    
    <div class="articles-grid">
      <ArticleCard
        v-for="article in relatedArticles"
        :key="article.url"
        :post="article"
        compact
      />
    </div>
  </div>
</template>

<style scoped>
.related-articles {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 2px solid var(--vp-c-divider);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  font-size: 1.5rem;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 960px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .related-articles {
    margin-top: 3rem;
  }
}
</style>
