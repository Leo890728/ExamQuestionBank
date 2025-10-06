<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: '練習模式', path: '/practice', key: 'practice' },
  { name: '快閃卡', path: '/flashcard', key: 'flashcard' },
  { name: '學習追蹤', path: '/analytics', key: 'analytics' },
  { name: '題庫管理', path: '/admin', key: 'admin' }
]

const activeTab = ref(route.path.split('/')[1] || 'practice')

const switchTab = (path, key) => {
  activeTab.value = key
  router.push(path)
}
</script>

<template>
  <div class="app-container">
    <!-- Header -->
    <header>
      <h1>司律考題練習題庫系統</h1>
      <p>整合歷屆司法官／律師考題，提供智慧複習、學習追蹤與快閃卡管理</p>
    </header>

    <!-- Navigation -->
    <nav>
      <div class="nav-container">
        <a
          v-for="tab in tabs"
          :key="tab.key"
          href="#"
          :class="{ active: activeTab === tab.key }"
          @click.prevent="switchTab(tab.path, tab.key)"
        >
          {{ tab.name }}
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Header */
header {
  background: white;
  padding: 40px 0;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}

header p {
  font-size: 16px;
  color: #7f8c8d;
}

/* Navigation */
nav {
  background: white;
  border-bottom: 2px solid #e0e0e0;
  padding: 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 0;
}

nav a {
  padding: 16px 32px;
  text-decoration: none;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

nav a:hover {
  color: #007bff;
}

nav a.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

/* Main */
main {
  padding: 40px 0;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
