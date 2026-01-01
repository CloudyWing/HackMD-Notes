<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  articleId: {
    type: String,
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  }
})

const viewCount = ref(0)
const isLoading = ref(true)

const workerBaseUrl = 'https://blog-view-counter.yearningwing.workers.dev/'
const fetchedCounts = new Map()

async function fetchViewCount() {
  if (!props.articleId) {
    isLoading.value = false
    return
  }
  
  if (fetchedCounts.has(props.articleId)) {
    viewCount.value = fetchedCounts.get(props.articleId)
    isLoading.value = false
    return
  }
  
  try {
    let targetUrl = workerBaseUrl + '?id=' + encodeURIComponent(props.articleId)
    
    if (!props.isCurrent) {
      targetUrl += '&readOnly=true'
    }
    
    const res = await fetch(targetUrl)
    const data = await res.json()
    const count = data.count || 0
    
    fetchedCounts.set(props.articleId, count)
    viewCount.value = count
  } catch (err) {
    console.error('[ViewCount] Error:', err)
    viewCount.value = 0
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchViewCount()
})
</script>

<template>
  <span class="view-count-value">
    {{ isLoading ? '0' : viewCount }}
  </span>
</template>

<style scoped>
.view-count-value {
  display: inline;
}
</style>
