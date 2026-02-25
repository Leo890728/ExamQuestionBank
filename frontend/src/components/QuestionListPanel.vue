<template>
<!-- Question List using TableList -->
<TableList :items="questions" :loading="isLoading" :columns="questionColumns" :draggable="false" :show-header="false"
  :show-pagination="true" :current-page="currentPage" :page-size="pageSize" :pagination-state="paginationState"
  :sort-key="sortKey" :sort-order="sortOrder" item-unit="題" empty-text="沒有符合條件的題目"
  empty-hint="請調整篩選條件或新增題目" @update:selected-ids="handleSelectionChange" @sort-change="handleSortChange"
  @page-change="handlePageChange" @size-change="handleSizeChange">

  <!-- Content cell -->
  <template #cell-content="{ item }">
    <div class="content-cell">
      <div class="content-text">{{ item.content }}</div>
      <div class="content-meta" v-if="item.category || item.question_type">
        <span v-if="item.category">{{ item.category }}</span>
        <span v-if="item.category && item.question_type"> · </span>
        <span v-if="item.question_type">{{ item.question_type }}</span>
      </div>
    </div>
  </template>

  <!-- Subject cell -->
  <template #cell-subject="{ item }">
    <span v-if="item.subject" class="badge-subject">{{ item.subject }}</span>
    <span v-else class="text-muted">—</span>
  </template>

  <!-- Difficulty cell -->
  <template #cell-difficulty="{ item }">
    <span v-if="item.difficulty" class="badge-difficulty" :class="item.difficulty">
      {{ getDifficultyLabel(item.difficulty) }}
    </span>
    <span v-else class="text-muted">—</span>
  </template>

  <!-- Tags cell -->
  <template #cell-tags="{ item }">
    <div class="tags-cell" v-if="item.tags && item.tags.length">
      <span v-for="tag in item.tags.slice(0, 3)" :key="tag.id" class="tag-badge" @click.stop="addTagToFilter(tag)">
        {{ tag.name }}
      </span>
      <span v-if="item.tags.length > 3" class="tag-more">+{{ item.tags.length - 3 }}</span>
    </div>
    <span v-else class="text-muted">—</span>
  </template>

  <!-- Created at cell -->
  <template #cell-createdAt="{ item }">
    <span class="date-text">{{ item.createdAt }}</span>
  </template>

  <!-- Actions cell -->
  <template #cell-actions="{ item }">
    <div class="row-actions" @click.stop>
      <button class="action-btn action-btn-view" @click="viewQuestion(item.id)" title="檢視">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button class="action-btn action-btn-edit" @click="openEditQuestion(item.id)" title="編輯">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="action-btn action-btn-info" @click="viewAssociatedExams(item.id, item.content)" title="查看關聯考卷">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </button>
      <button class="action-btn action-btn-delete" @click="deleteQuestion(item.id)" title="刪除"
        :disabled="deletingId === item.id">
        <svg v-if="deletingId !== item.id" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <div v-else class="action-spinner"></div>
      </button>
    </div>
  </template>

  <!-- Custom selection toolbar actions -->
  <template #selection-actions="{ selectedIds, clearSelection }">
    <button class="toolbar-btn toolbar-btn-primary" @click="openAddToExamModal" title="加入考卷">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      <span>加入考卷</span>
    </button>

    <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkTagModal" title="批次編輯標籤">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
      <span>批次編輯標籤</span>
    </button>

    <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkMetaModal" title="批次編輯欄位">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18"></path>
        <path d="M3 12h18"></path>
        <path d="M7 3h10v4H7z"></path>
        <path d="M7 17h10v4H7z"></path>
      </svg>
      <span>批次編輯</span>
    </button>

    <div class="toolbar-divider"></div>

    <button class="toolbar-btn toolbar-btn-danger" @click="deleteSelectedQuestions" :disabled="isDeleting"
      title="刪除選取">
      <div v-if="isDeleting" class="toolbar-spinner"></div>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>{{ isDeleting ? '刪除中...' : '刪除' }}</span>
    </button>
  </template>
</TableList>
</template>

<script setup>
import { toRefs } from 'vue'
import TableList from '@/components/common/TableList.vue'

const questionColumns = [
  { key: 'id', label: 'ID', width: '50px', sortable: true },
  { key: 'content', label: '題目內容', width: '2fr', sortable: true },
  { key: 'subject', label: '科目', width: '72px', align: 'center', sortable: true },
  { key: 'difficulty', label: '難度', width: '56px', align: 'center', sortable: true },
  { key: 'tags', label: '標籤', width: '1fr' },
  { key: 'createdAt', label: '建立', width: '84px', sortable: true },
  { key: 'actions', label: '操作', width: '130px', align: 'center' }
]

const getDifficultyLabel = (difficulty) => {
  const map = { easy: '簡單', medium: '中等', hard: '困難' }
  return map[difficulty] || difficulty || '—'
}

const props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  paginationState: {
    type: Object,
    default: () => ({ hasNext: false, hasPrev: false, totalPages: 0, totalCount: 0 })
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  },
  deletingId: {
    type: [Number, String],
    default: null
  },
  isDeleting: {
    type: Boolean,
    default: false
  },
  sortKey: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:selected-ids',
  'view',
  'edit',
  'view-associated-exams',
  'delete',
  'tag-click',
  'page-change',
  'size-change',
  'sort-change',
  'open-add-to-exam',
  'open-bulk-tag',
  'open-bulk-meta',
  'delete-selected'
])

const {
  questions,
  isLoading,
  paginationState,
  currentPage,
  pageSize,
  deletingId,
  isDeleting,
  sortKey,
  sortOrder
} = toRefs(props)

const handleSelectionChange = (ids) => {
  emit('update:selected-ids', ids)
}

const handleSortChange = (payload) => {
  emit('sort-change', payload)
}

const viewQuestion = (id) => {
  emit('view', id)
}

const openEditQuestion = (id) => {
  emit('edit', id)
}

const viewAssociatedExams = (id, content) => {
  emit('view-associated-exams', { id, content })
}

const deleteQuestion = (id) => {
  emit('delete', id)
}

const openAddToExamModal = () => {
  emit('open-add-to-exam')
}

const openBulkTagModal = () => {
  emit('open-bulk-tag')
}

const openBulkMetaModal = () => {
  emit('open-bulk-meta')
}

const deleteSelectedQuestions = () => {
  emit('delete-selected')
}

const addTagToFilter = (tag) => {
  emit('tag-click', tag)
}

const handlePageChange = (page) => {
  emit('page-change', page)
}

const handleSizeChange = (size) => {
  emit('size-change', size)
}
</script>

<style scoped>
/* Content cell */
.content-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.content-text {
  font-size: 13px;
  color: var(--text-primary, #1E293B);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.content-meta {
  font-size: 11px;
  color: var(--text-muted, #94A3B8);
}

/* Subject badge */
.badge-subject {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 500;
  background: #DBEAFE;
  color: #1E40AF;
}

/* Difficulty badge */
.badge-difficulty {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 500;
}

.badge-difficulty.easy {
  background: #D1FAE5;
  color: #065F46;
}

.badge-difficulty.medium {
  background: #FEF3C7;
  color: #92400E;
}

.badge-difficulty.hard {
  background: #FEE2E2;
  color: #991B1B;
}

/* Tags cell */
.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-badge {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: #F1F5F9;
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #E2E8F0);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tag-badge:hover {
  background: #E2E8F0;
  color: var(--text-primary, #1E293B);
  border-color: var(--text-secondary, #94A3B8);
}

.tag-more {
  font-size: 11px;
  color: var(--text-muted, #94A3B8);
  white-space: nowrap;
}

/* Date text */
.date-text {
  font-size: 12px;
  color: var(--text-muted, #94A3B8);
}

.text-muted {
  color: var(--text-muted, #94A3B8);
  font-size: 12px;
}

/* Row Actions */
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: nowrap;
}

.row-actions .action-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Action spinner for loading states */
.action-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(100, 116, 139, 0.3);
  border-top-color: var(--text-secondary, #64748B);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Toolbar spinner */
.toolbar-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
