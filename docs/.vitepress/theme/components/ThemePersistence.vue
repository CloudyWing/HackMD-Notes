<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 從 localStorage 讀取並應用主題偏好
  const savedTheme = localStorage.getItem('vitepress-theme-appearance')
  if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }
  
  // 監聽主題切換並儲存偏好
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark')
        localStorage.setItem('vitepress-theme-appearance', isDark ? 'dark' : 'light')
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})
</script>

<template>
  <div class="theme-persistence-handler"></div>
</template>

<style scoped>
.theme-persistence-handler {
  display: none;
}
</style>
