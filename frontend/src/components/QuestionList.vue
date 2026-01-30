<template>
  <div class="question-list" :class="{ 'practice-mode': mode === 'practice' }">
    <!-- Header (hidden in practice mode) -->
    <div v-if="showHeader" class="list-header">
      <div class="header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      </div>
      <div class="header-content">
        <h3 class="list-title">題目列表</h3>
        <p class="list-subtitle">管理目前考卷的所有題目與配分</p>
      </div>

      <div class="header-actions">
        <button v-if="showAutoDistribute" class="action-btn action-btn-accent" @click="$emit('auto-distribute')"
          :disabled="autoDistributeLoading">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          自動配分
        </button>
        <button class="action-btn action-btn-secondary" @click="$emit('add-existing-question')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          從題庫加入
        </button>
        <button v-if="showAddQuestion" class="action-btn action-btn-primary" @click="$emit('add-question')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新增題目
        </button>
      </div>
    </div>

    <!-- View Mode Toggle (hidden in practice mode) -->
    <div v-if="showModeToggle" class="view-mode-section">
      <div class="view-mode-toggle">
        <button class="toggle-btn" :class="{ active: viewMode === 'exam' }" @click="viewMode = 'exam'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          此張考卷的題目
        </button>
        <button class="toggle-btn" :class="{ active: viewMode === 'search' }" @click="handleViewModeChange('search')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          搜尋題目加入考卷
        </button>
      </div>
    </div>

    <!-- Exam Mode: Simple Search Bar (only in exam mode) -->
    <div v-if="viewMode === 'exam' && showModeToggle" class="search-bar">
      <div class="search-control">
        <input type="checkbox" :checked="isAllSelected" :indeterminate.prop="isPartialSelected"
          @change="toggleSelectAll" class="select-all-checkbox" title="全選/取消全選" />
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input v-model="searchQuery" type="text" placeholder="搜尋題目內容、科目、分類..." class="search-input" />
        <span v-if="selectedIds.length > 0" class="selection-badge">
          已選 {{ selectedIds.length }} 題
        </span>
      </div>
    </div>

    <!-- Search/Practice Mode: QuestionFilterPanel -->
    <div v-if="(viewMode === 'search' || mode === 'practice') && listMode === 'search'" class="filter-panel-container">
      <QuestionFilterPanel v-model="searchFilters" :tags="tags" :loading="searchLoading" :total-count="totalSearchCount"
        :show-source-filter="showSourceFilter" @search="handleSearch" @reset="handleResetFilters" />
    </div>

    <!-- Selection Toolbar (with custom slots for practice mode) -->
    <SelectionToolbar v-if="showToolbar && (viewMode === 'search' || mode === 'practice') && selectedIds.length > 0"
      :selected-count="selectedIds.length" item-unit="題" @clear="clearSelection">
      <!-- Custom toolbar buttons slot -->
      <slot name="toolbar-buttons" :selected-ids="selectedIds" :clear-selection="clearSelection">
        <!-- Default button for exam mode -->
        <button v-if="mode !== 'practice'" class="toolbar-btn toolbar-btn-primary" @click="handleAddSearchResultsToExam"
          :disabled="selectedIds.length === 0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          加入考卷
        </button>
      </slot>
    </SelectionToolbar>

    <div v-if="loading || searchLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="filteredQuestions.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" class="empty-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <p class="empty-text">{{ emptyText }}</p>
      <p v-if="!searchQuery && viewMode === 'exam' && mode !== 'practice'" class="empty-hint">點擊上方按鈕開始新增題目</p>
    </div>

    <!-- Exam Mode: Use QuestionItem component -->
    <div v-else-if="viewMode === 'exam' && mode !== 'practice'" class="questions">
      <QuestionItem v-for="item in filteredQuestions" :key="item.id" :item="item"
        :is-active="selectedQuestionId === item.question" :has-pending-edit="Boolean(pendingEdits[item.id])"
        :is-checked="selectedIds.includes(item.id)" :show-checkbox="true" @select="selectQuestion"
        @remove="(id) => $emit('remove-question', id)" @toggle-check="toggleCheck" />
    </div>

    <!-- Search/Practice Mode: Question items with custom actions -->
    <div v-else class="search-questions-list">
      <!-- Select All Header -->
      <div v-if="filteredQuestions.length > 0" class="list-header-actions">
        <label class="select-all-label">
          <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll">
          <span>全選本頁 ({{ filteredQuestions.length }} 題)</span>
        </label>
      </div>

      <div v-for="item in filteredQuestions" :key="item.id" class="search-question-item"
        :class="{ selected: selectedIds.includes(item.id) }" @click="toggleCheck(item.id)">
        <input type="checkbox" :checked="selectedIds.includes(item.id)" class="search-question-checkbox" @click.stop
          @change="toggleCheck(item.id)" />
        <div class="search-question-info">
          <div class="search-question-badges">
            <span v-if="item.question_subject || item.subject" class="search-badge search-badge-subject">{{
              item.question_subject || item.subject }}</span>
            <span v-if="item.difficulty" class="search-badge search-badge-difficulty" :class="item.difficulty">
              {{ getDifficultyLabel(item.difficulty) }}
            </span>
            <span v-for="tag in ((item.tags || []).slice(0, 2))" :key="tag.id" class="search-badge search-badge-tag">
              {{ tag.name }}
            </span>
            <span v-if="(item.tags || []).length > 2" class="search-badge search-badge-more">
              +{{ item.tags.length - 2 }}
            </span>
            <!-- Extra badges slot (e.g., wrong count) -->
            <slot name="item-extra-badges" :item="item"></slot>
            <!-- Status badges -->
            <span v-if="item.is_bookmarked" class="search-badge search-badge-status bookmark-status" title="已收藏">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                stroke="currentColor" stroke-width="1">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              已收藏
            </span>
            <span v-if="item.is_in_flashcard" class="search-badge search-badge-status flashcard-status" title="已加入快閃卡">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="14" rx="2"></rect>
                <path d="M7 9h10M7 13h6"></path>
              </svg>
              快閃卡
            </span>
          </div>
          <div class="search-question-content">{{ item.question_content || item.content }}</div>
        </div>

        <!-- Custom item actions slot for practice mode -->
        <div v-if="mode === 'practice'" class="search-question-actions" @click.stop>
          <slot name="item-actions" :item="item">
            <button class="btn btn-sm" @click="$emit('item-action', 'practice', item)">練習</button>
            <button class="btn btn-sm" :class="item.is_in_flashcard ? 'btn-flashcard-added' : ''" 
                    @click="$emit('item-action', 'flashcard', item)" 
                    :title="item.is_in_flashcard ? '已加入快閃卡' : '加入快閃卡'">
              <i :class="item.is_in_flashcard ? 'bi bi-bookmark-check-fill' : 'bi bi-bookmark-plus'"></i>
              {{ item.is_in_flashcard ? '已收藏' : '快閃卡' }}
            </button>
            <button class="btn btn-sm btn-outline" @click="$emit('item-action', 'ask-ai', item)">Ask AI</button>
          </slot>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationControl v-if="(viewMode === 'search' || mode === 'practice') && totalSearchCount > searchPageSize"
      :pagination-state="searchPaginationState" :current-page="searchCurrentPage" :page-size="searchPageSize"
      :is-loading="searchLoading" @page-change="handleSearchPageChange" @size-change="handleSearchPageSizeChange" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import QuestionItem from './QuestionItem.vue'
import QuestionFilterPanel from './common/QuestionFilterPanel.vue'
import PaginationControl from './common/PaginationControl.vue'
import SelectionToolbar from './common/SelectionToolbar.vue'

const props = defineProps({
  // Mode: 'exam' (default), 'practice', or 'modal'
  mode: {
    type: String,
    default: 'exam',
    validator: (value) => ['exam', 'practice', 'modal'].includes(value)
  },
  // List mode: 'search' (default), 'wrong', 'bookmark'
  listMode: {
    type: String,
    default: 'search',
    validator: (value) => ['search', 'wrong', 'bookmark'].includes(value)
  },
  // Layout control props
  showHeader: {
    type: Boolean,
    default: true
  },
  showModeToggle: {
    type: Boolean,
    default: true
  },
  showSourceFilter: {
    type: Boolean,
    default: false
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  questions: {
    type: Array,
    default: () => []
  },
  selectedQuestionId: {
    type: Number,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  autoDistributeLoading: {
    type: Boolean,
    default: false
  },
  showAutoDistribute: {
    type: Boolean,
    default: true
  },
  showAddQuestion: {
    type: Boolean,
    default: true
  },
  pendingEdits: {
    type: Object,
    default: () => ({})
  },
  tags: {
    type: Array,
    default: () => []
  },
  searchResults: {
    type: Array,
    default: () => []
  },
  searchLoading: {
    type: Boolean,
    default: false
  },
  totalSearchCount: {
    type: Number,
    default: 0
  },
  // External control of filters (for practice mode)
  externalFilters: {
    type: Object,
    default: null
  },
  // Exclude specific question IDs from display (for modal mode)
  excludeIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'select-question',
  'add-question',
  'add-existing-question',
  'remove-question',
  'auto-distribute',
  'update:total-points',
  'update:selected-ids',
  'search-questions',
  'load-tags',
  'add-search-results',
  'item-action',
  'item-click'
])

const searchQuery = ref('')
const selectedIds = ref([])
const viewMode = ref('exam') // 'exam' or 'search'
const searchFilters = ref({
  subject: '',
  difficulty: '',
  search: '',
  tags: [],
  tag_mode: 'or',
  source: 'all'
})
const searchCurrentPage = ref(1)
const searchPageSize = ref(20)

// Use external filters if provided (for practice mode)
watch(() => props.externalFilters, (newFilters) => {
  if (newFilters) {
    searchFilters.value = { ...searchFilters.value, ...newFilters }
  }
}, { immediate: true, deep: true })

// Set viewMode to 'search' in practice/modal mode
watch(() => props.mode, (mode) => {
  if (mode === 'practice' || mode === 'modal') {
    viewMode.value = 'search'
  }
}, { immediate: true })

const filteredQuestions = computed(() => {
  // In practice/modal mode or search mode, show search results
  if (props.mode === 'practice' || props.mode === 'modal' || viewMode.value === 'search') {
    // Filter out excluded IDs
    let results = props.searchResults
    if (props.excludeIds.length > 0) {
      results = results.filter(q => !props.excludeIds.includes(q.id))
    }
    return results
  }

  // In exam mode, show exam questions with optional filtering
  let questions = props.questions
  questions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0))
  if (!searchQuery.value) return questions

  const query = searchQuery.value.toLowerCase()
  return questions.filter(item => {
    return (
      item.question_content?.toLowerCase().includes(query) ||
      item.question_subject?.toLowerCase().includes(query) ||
      item.question_category?.toLowerCase().includes(query)
    )
  })
})

const emptyText = computed(() => {
  if (props.mode === 'practice') {
    return '找不到符合條件的題目'
  }
  if (viewMode.value === 'search') {
    return '沒有找到符合的題目'
  }
  return searchQuery.value ? '沒有符合的題目' : '尚未加入任何題目'
})

const getDifficultyLabel = (difficulty) => {
  const labels = { easy: '簡單', medium: '中等', hard: '困難' }
  return labels[difficulty] || difficulty
}

const isAllSelected = computed(() => {
  return filteredQuestions.value.length > 0 &&
    filteredQuestions.value.every(q => selectedIds.value.includes(q.id))
})

const isPartialSelected = computed(() => {
  const selected = filteredQuestions.value.filter(q => selectedIds.value.includes(q.id))
  return selected.length > 0 && selected.length < filteredQuestions.value.length
})

const toggleSelectAll = () => {
  const pageIds = filteredQuestions.value.map(q => q.id)
  if (isAllSelected.value) {
    // Remove current page items from selection (preserve other pages)
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  } else {
    // Add all current page items (preserve existing selections)
    const set = new Set([...selectedIds.value, ...pageIds])
    selectedIds.value = Array.from(set)
  }
  emit('update:selected-ids', selectedIds.value)
}

const toggleCheck = (id) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
  emit('update:selected-ids', selectedIds.value)
}

const selectQuestion = (item) => {
  emit('select-question', item)
}

const handleViewModeChange = (mode) => {
  viewMode.value = mode
  if (mode === 'search') {
    // Load tags when switching to search mode
    emit('load-tags')
    // Trigger initial search
    handleSearch()
  }
}

const handleSearch = () => {
  searchCurrentPage.value = 1
  emit('search-questions', searchFilters.value, searchCurrentPage.value, searchPageSize.value)
}

const handleResetFilters = () => {
  searchFilters.value = {
    subject: '',
    difficulty: '',
    search: '',
    tags: [],
    tag_mode: 'or'
  }
  searchCurrentPage.value = 1
  handleSearch()
}

const handleSearchPageChange = (page) => {
  searchCurrentPage.value = page
  emit('search-questions', searchFilters.value, page, searchPageSize.value)
}

const handleSearchPageSizeChange = (size) => {
  searchPageSize.value = size
  searchCurrentPage.value = 1
  emit('search-questions', searchFilters.value, searchCurrentPage.value, size)
}

const searchPaginationState = computed(() => {
  const totalPages = Math.ceil(props.totalSearchCount / searchPageSize.value)
  return {
    totalPages,
    totalCount: props.totalSearchCount,
    hasNext: searchCurrentPage.value < totalPages,
    hasPrev: searchCurrentPage.value > 1
  }
})

const handleAddSearchResultsToExam = () => {
  // Extract actual question IDs from selected search results
  const questionIds = selectedIds.value
    .map(id => {
      const searchResult = props.searchResults.find(q => q.id === id)
      return searchResult?.question
    })
    .filter(id => id !== undefined)

  if (questionIds.length === 0) {
    alert('請選擇要加入的題目')
    return
  }

  // Emit event with question IDs and default points
  emit('add-search-results', questionIds, 1)

  // Clear selection after adding
  clearSelection()
}

const clearSelection = () => {
  selectedIds.value = []
  emit('update:selected-ids', selectedIds.value)
}

defineExpose({ selectedIds, clearSelection })
</script>

<style scoped>
.question-list {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border, #CBD5E1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.list-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  border-bottom: 2px solid var(--border, #CBD5E1);
  background: var(--bg-page, #F8FAFC);
}

.header-icon {
  width: 44px;
  height: 44px;
  background: var(--primary, #476996);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
}

.list-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  letter-spacing: -0.01em;
}

.list-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-primary {
  background: var(--primary, #476996);
  color: white;
}

.action-btn-primary:hover {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(71, 105, 150, 0.25);
}

.action-btn-secondary {
  background: white;
  color: var(--text-primary, #1E293B);
  border: 2px solid var(--border, #CBD5E1);
}

.action-btn-secondary:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary, #476996);
}

.action-btn-accent {
  background: var(--accent, #10B981);
  color: white;
}

.action-btn-accent:hover {
  background: var(--accent-hover, #059669);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25);
}

.action-btn-accent:disabled {
  background: var(--border, #CBD5E1);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* View Mode Toggle */
.view-mode-section {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #CBD5E1);
  background: white;
}

.view-mode-toggle {
  display: flex;
  gap: 8px;
  background: var(--bg-page, #F8FAFC);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--border, #CBD5E1);
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: var(--text-secondary, #64748B);
  white-space: nowrap;
}

.toggle-btn:hover {
  color: var(--text-primary, #1E293B);
  background: rgba(71, 105, 150, 0.05);
}

.toggle-btn.active {
  background: var(--primary, #476996);
  color: white;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.toggle-btn svg {
  flex-shrink: 0;
}

/* Filter Panel Container */
.filter-panel-container {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #CBD5E1);
  background: white;
}

/* Search Questions List (AddQuestionModal style) */
.search-questions-list {
  overflow-y: auto;
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 12px;
  background: white;
}

.search-question-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #E2E8F0);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-question-item:last-child {
  border-bottom: none;
}

.search-question-item:hover {
  background: var(--bg-page, #F8FAFC);
}

.search-question-item.selected {
  background: var(--primary-soft, #EEF2FF);
  border-color: rgba(71, 105, 150, 0.2);
}

.search-question-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--primary, #476996);
  flex-shrink: 0;
}

.search-question-info {
  flex: 1;
  min-width: 0;
}

.search-question-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.search-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.search-badge-subject {
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary, #476996);
}

.search-badge-category {
  background: #FEF3C7;
  color: #92400E;
}

.search-badge-tag {
  background: #E0E7FF;
  color: #4338CA;
}

.search-badge-more {
  background: #f3f4f6;
  color: var(--text-secondary, #64748B);
}

.search-badge-difficulty {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.search-badge-difficulty.easy {
  background: #A7F3D0;
  color: #065F46;
  border-color: #34D399;
}

.search-badge-difficulty.medium {
  background: #FCD34D;
  color: #92400E;
  border-color: #D97706;
}

.search-badge-difficulty.hard {
  background: #FCA5A5;
  color: #991B1B;
  border-color: #EF4444;
}

.search-badge-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.search-badge-status.bookmark-status {
  background: #FEF3C7;
  color: #92400E;
}

.search-badge-status.flashcard-status {
  background: #E0E7FF;
  color: #4338CA;
}

/* Wrong count badge - use :deep() for slot content */

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px; /* Space for scrollbar if needed */
  }

  .action-btn {
    flex-shrink: 0;
    padding: 10px 14px; /* Ensure touch target */
  }

  .view-mode-section, 
  .filter-panel-container {
    padding: 12px 16px;
  }
  
  .list-title {
      font-size: 17px;
  }

  .search-question-item {
    flex-direction: column; /* Stack checkbox and content/actions */
    align-items: stretch; /* Full width */
    padding: 12px 14px;
    gap: 10px;
    position: relative;
  }

  /* Checkbox positioning for stacked layout */
  .search-question-checkbox {
    position: absolute;
    top: 14px;
    left: 14px;
    width: 20px;
    height: 20px;
  }

  .search-question-info {
    padding-left: 32px; /* Indent content for checkbox */
    width: 100%;
  }

  .search-question-actions {
    display: flex;
    justify-content: flex-end;
    width: 100%;
    gap: 8px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  .search-question-actions button {
     flex: 1; /* evenly distribute buttons */
     justify-content: center;
  }

  .search-badge {
    margin-bottom: 4px;
  }
}
:deep(.search-badge-wrong) {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: #FEE2E2;
  color: #991B1B;
}

/* List Header Actions (Select All) */
.list-header-actions {
  padding: 12px 16px;
  background: var(--bg-page, #F8FAFC);
  border-bottom: 1px solid var(--border, #E2E8F0);
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
  cursor: pointer;
}

.select-all-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary, #476996);
}

/* Question Item Actions */
.search-question-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.search-question-actions .btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-question-actions .btn-sm {
  background: var(--primary, #476996);
  color: white;
  border: none;
}

.search-question-actions .btn-sm:hover {
  background: var(--primary-hover, #35527a);
}

.search-question-actions .btn-outline {
  background: transparent;
  color: var(--primary, #476996);
  border: 1px solid var(--primary, #476996);
}

.search-question-actions .btn-outline:hover {
  background: var(--primary-soft, #EEF2FF);
}

.search-question-actions .btn-flashcard-added {
  background: #E0E7FF;
  color: #4338CA;
  border: 1px solid #C7D2FE;
}

.search-question-actions .btn-flashcard-added:hover {
  background: #C7D2FE;
}

.search-question-actions .btn i {
  margin-right: 4px;
}

/* Practice Mode Specific Styles */
.question-list.practice-mode {
  background: transparent;
  box-shadow: none;
  border: none;
}

.question-list.practice-mode .filter-panel-container {
  padding: 0;
  border: none;
  background: transparent;
}

.question-list.practice-mode .search-questions-list {
  margin-top: 16px;
}

.search-question-content {
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Scrollbar for search questions list */
.search-questions-list::-webkit-scrollbar {
  width: 8px;
}

.search-questions-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.search-questions-list::-webkit-scrollbar-thumb {
  background: var(--border, #CBD5E1);
  border-radius: 4px;
}

.search-questions-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #64748B);
}

/* Search Bar */
.search-bar {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #CBD5E1);
  background: white;
}

.search-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-page, #F8FAFC);
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 12px;
  padding: 10px 14px;
  transition: all 0.2s ease;
}

.search-control:focus-within {
  border-color: var(--primary, #476996);
  background: white;
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.select-all-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.search-icon {
  color: var(--text-secondary, #64748B);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary, #64748B);
}

.selection-badge {
  padding: 6px 12px;
  background: var(--primary, #476996);
  color: white;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Questions List */
.questions {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  border-radius: 16px;
  background: var(--bg-page, #F8FAFC);
}

/* Loading State */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: var(--text-secondary, #64748B);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border, #CBD5E1);
  border-top-color: var(--primary, #476996);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}

.empty-icon {
  color: var(--border, #CBD5E1);
  margin-bottom: 20px;
}

.empty-text {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #1E293B);
}

.empty-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

/* Scrollbar Styling */
.questions::-webkit-scrollbar {
  width: 8px;
}

.questions::-webkit-scrollbar-track {
  background: var(--surface-muted, #E2E8F0);
  border-radius: 4px;
}

.questions::-webkit-scrollbar-thumb {
  background: var(--border, #CBD5E1);
  border-radius: 4px;
}

.questions::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #64748B);
}

/* Responsive Design */
@media (max-width: 768px) {
  .list-header {
    flex-wrap: wrap;
    padding: 16px;
    gap: 12px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .list-title {
    font-size: 16px;
  }

  .list-subtitle {
    font-size: 12px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .search-bar {
    padding: 12px 16px;
  }

  .search-control {
    padding: 8px 12px;
  }

  .questions {
    padding: 12px;
  }
}
</style>
