<script setup>
import { data } from '../../../posts.data.mjs'
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: String,
    required: true
  }
})

const posts = computed(() => {
  return data.filter(post => {
    // Check if the post path starts with /category/
    return post.url.startsWith('/' + props.category + '/') && !post.url.endsWith('index.html')
  })
})
</script>

<template>
  <ul v-if="posts.length">
    <li v-for="post in posts" :key="post.url">
      <a :href="post.url">{{ post.title }}</a>
    </li>
  </ul>
  <p v-else>No articles found for this category.</p>
</template>
