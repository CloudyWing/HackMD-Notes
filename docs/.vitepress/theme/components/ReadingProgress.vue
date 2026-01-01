<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrollProgress = ref(0)

// 計算閱讀進度百分比: 已滾動距離 / 可滾動總距離
const updateProgress = () => {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const scrolled = window.scrollY
  scrollProgress.value = (scrolled / (documentHeight - windowHeight)) * 100
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress)
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>

<template>
  <div class="reading-progress" :style="{ width: scrollProgress + '%' }"></div>
</template>

<style scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  z-index: 100;
  transition: width 0.2s ease;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
}
</style>
