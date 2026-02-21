<template>
  <div class="notes-view container py-4">
    <div class="mb-4">
      <h2 class="fw-bold mb-2">筆記管理</h2>
      <p class="text-secondary">
        管理您的所有學習筆記，支援全文搜尋與 AI 輔助功能。
      </p>
    </div>

    <NoteList />
  </div>
</template>

<script setup>
import NoteList from '../components/notes/NoteList.vue'
</script>

<style scoped>
.notes-view {
  max-width: 1200px;
}
</style>
