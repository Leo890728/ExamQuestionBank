<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="12" y1="8" x2="12" y2="14"></line>
              <line x1="9" y1="11" x2="15" y2="11"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">從題庫加入題目</h3>
            <p class="modal-subtitle">搜尋並選擇要加入考卷的題目</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- 已排除提示 -->
        <div v-if="excludedCount > 0" class="excluded-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>已排除 <strong>{{ excludedCount }}</strong> 題（這些題目已在考卷中）</span>
        </div>

        <!-- QuestionList Component -->
        <QuestionList ref="questionListRef" mode="modal" :show-header="false" :show-mode-toggle="false"
          :show-toolbar="false" :search-results="searchResults" :search-loading="loading"
          :total-search-count="totalCount" :tags="tagOptions" :exclude-ids="existingQuestionIds"
          @search-questions="handleSearchQuestions" @load-tags="loadTags"
          @update:selected-ids="handleSelectionChange" />
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-info" v-if="selectedCount > 0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>將加入 <strong>{{ selectedCount }}</strong> 題</span>
        </div>
        <div class="footer-actions">
          <button class="footer-btn footer-btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button class="footer-btn footer-btn-primary" :disabled="selectedCount === 0" @click="handleAddFromFooter">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            確認新增
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import questionService from '../services/questionService'
import { useTagStore } from '@/stores/tagStore'
import QuestionList from './QuestionList.vue'

const props = defineProps({
  existingQuestionIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add'])

const questionListRef = ref(null)
const searchResults = ref([])
const loading = ref(false)
const selectedCount = ref(0)
const tagOptions = ref([])
const totalCount = ref(0)
const tagStore = useTagStore()

// 計算被排除的題目數量
const excludedCount = computed(() => {
  return searchResults.value.filter(q => props.existingQuestionIds.includes(q.id)).length
})

const handleSearchQuestions = async (filters, page, pageSize) => {
  loading.value = true
  try {
    const params = {
      page: page,
      page_size: pageSize
    }
    if (filters.search) params.search = filters.search
    if (filters.subject) params.subject = filters.subject
    if (filters.difficulty) params.difficulty = filters.difficulty
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.map(t => t.id).join(',')
      params.tag_mode = filters.tag_mode
    }
    if (filters.source) {
      params.source = filters.source
    }

    const response = await questionService.getQuestions(params)
    const data = response.data

    if (data.results) {
      searchResults.value = data.results
      totalCount.value = data.count || data.results.length
    } else {
      searchResults.value = data
      totalCount.value = data.length
    }
  } catch (error) {
    console.error('載入題目失敗:', error)
  } finally {
    loading.value = false
  }
}

const loadTags = async () => {
  try {
    const res = await tagStore.getTags()
    let items = res.data?.results || res.data
    if (!Array.isArray(items)) items = []
    tagOptions.value = items.filter(t => t != null)
  } catch (err) {
    console.error('載入標籤失敗:', err)
  }
}

const handleSelectionChange = (ids) => {
  selectedCount.value = ids.length
}

const handleAdd = (ids, clearSelectionFn) => {
  if (ids.length === 0) return
  emit('add', ids, 1) // Default points = 1
  if (clearSelectionFn) clearSelectionFn()
}

const handleAddFromFooter = () => {
  if (!questionListRef.value) return
  const ids = questionListRef.value.selectedIds
  if (ids.length === 0) return
  emit('add', [...ids], 1) // Default points = 1
  questionListRef.value.clearSelection()
}

onMounted(() => {
  // Initial search
  handleSearchQuestions({ subject: '', difficulty: '', search: '', tags: [], tag_mode: 'or', source: 'all' }, 1, 20)
  loadTags()
})
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Container */
.modal-container {
  width: 90%;
  max-width: 1100px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 90vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--border, #CBD5E1);
}

.header-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex: 1;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary, #476996);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

/* Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Excluded Hint */
.excluded-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #FEF3C7;
  border: 1px solid #FCD34D;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #92400E;
}

.excluded-hint svg {
  flex-shrink: 0;
  color: #D97706;
}

.excluded-hint strong {
  font-weight: 600;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid var(--border, #CBD5E1);
  background: var(--bg-page, #F8FAFC);
  border-radius: 0 0 16px 16px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

.footer-info strong {
  color: var(--primary, #476996);
  font-weight: 600;
}

.footer-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.footer-btn-secondary {
  background: white;
  color: var(--text-primary, #1E293B);
  border: 2px solid var(--border, #CBD5E1);
}

.footer-btn-secondary:hover {
  border-color: var(--text-secondary, #64748B);
  background: var(--bg-page, #F8FAFC);
}

.footer-btn-primary {
  background: var(--primary, #476996);
  color: white;
  border: 2px solid var(--primary, #476996);
}

.footer-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  border-color: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(71, 105, 150, 0.25);
}

.footer-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Toolbar button styles for slot */
.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn-primary {
  background: var(--primary, #476996);
  color: white;
}

.toolbar-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
}

.toolbar-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
