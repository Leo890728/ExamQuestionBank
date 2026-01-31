<template>
<!-- Pending Questions List -->
<div class="pending-panel">
  <div class="pending-tools">
    <div class="pending-tools-info">
      <span>共 {{ pendingQuestions.length }} 題</span>
      <span v-if="selectedPendingIds.length > 0" class="pending-selected">已選 {{ selectedPendingIds.length }}
        題</span>
    </div>
    <div class="pending-tools-actions">
      <button class="btn-clear-pending" @click="clearPendingQuestions" :disabled="pendingQuestions.length === 0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        清除全部
      </button>
      <button class="btn-save-pending" @click="savePendingQuestions"
        :disabled="isSavingPending || pendingQuestions.length === 0">
        <svg v-if="!isSavingPending" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <div v-else class="pending-spinner"></div>
        {{ isSavingPending ? `儲存中... (${savingPendingProgress}/${pendingQuestions.length})` : '儲存全部' }}
      </button>
    </div>
  </div>

  <AdminDataList ref="pendingDataListRef" type="question" :items="paginatedPendingQuestions" :loading="false"
    :total-count="pendingQuestions.length" :show-header="false" :show-pagination="true" :show-item-id="false"
    item-unit="題" empty-text="目前沒有暫存題目" empty-hint="在新增題目時選擇「加入暫存」，題目會出現在這裡"
    :current-page="pendingCurrentPage" :page-size="pendingPageSize" :pagination-state="pendingPaginationState"
    @update:selected-ids="handlePendingSelectionChange" @page-change="handlePendingPageChange"
    @size-change="handlePendingSizeChange">
    <template #item-actions="{ item }">
      <button class="action-btn action-btn-edit" @click="editPendingQuestion(item.id)" title="編輯">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="action-btn action-btn-delete" @click="removePendingQuestion(item.id)" title="刪除">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </template>

    <template #item-meta="{ item }">
      <span v-if="item.options && item.options.length > 0" class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M4 6h16"></path>
          <path d="M4 12h16"></path>
          <path d="M4 18h16"></path>
        </svg>
        {{ item.options.length }} 選項
      </span>
      <span v-if="getCorrectAnswer(item)" class="meta-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        答案: {{ getCorrectAnswer(item) }}
      </span>
    </template>

    <template #selection-actions>
      <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkTagModalForPending" title="批次編輯標籤">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <span>批次編輯標籤</span>
      </button>

      <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkMetaModalForPending" title="批次編輯欄位">
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

      <button class="toolbar-btn toolbar-btn-danger" @click="removeSelectedPendingQuestions" title="移除已選">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>移除已選</span>
      </button>
    </template>
  </AdminDataList>
</div>

</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AdminDataList from '@/components/common/AdminDataList.vue'

const props = defineProps({
  pendingQuestions: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  savingProgress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:selected-ids',
  'edit',
  'remove',
  'remove-selected',
  'clear',
  'save',
  'open-bulk-tag',
  'open-bulk-meta'
])

const pendingDataListRef = ref(null)
const pendingCurrentPage = ref(1)
const pendingPageSize = ref(20)

const pendingQuestions = computed(() => props.pendingQuestions)
const selectedPendingIds = computed(() => props.selectedIds)
const isSavingPending = computed(() => props.isSaving)
const savingPendingProgress = computed(() => props.savingProgress)

const pendingItemsWithIndex = computed(() => {
  return pendingQuestions.value.map((item, index) => ({ ...item, id: index }))
})

const pendingTotalPages = computed(() => {
  return Math.ceil(pendingQuestions.value.length / pendingPageSize.value)
})

const pendingPaginationState = computed(() => ({
  hasNext: pendingCurrentPage.value < pendingTotalPages.value,
  hasPrev: pendingCurrentPage.value > 1,
  totalPages: pendingTotalPages.value,
  totalCount: pendingQuestions.value.length
}))

const paginatedPendingQuestions = computed(() => {
  const start = (pendingCurrentPage.value - 1) * pendingPageSize.value
  return pendingItemsWithIndex.value.slice(start, start + pendingPageSize.value)
})

const resetPendingSelection = () => {
  emit('update:selected-ids', [])
  pendingDataListRef.value?.clearSelection()
}

const handlePendingSelectionChange = (ids) => {
  emit('update:selected-ids', ids)
}

const handlePendingPageChange = (page) => {
  pendingCurrentPage.value = page
}

const handlePendingSizeChange = (size) => {
  pendingPageSize.value = size
  pendingCurrentPage.value = 1
  resetPendingSelection()
}

watch(() => pendingQuestions.value.length, (len) => {
  const totalPages = Math.max(1, Math.ceil(len / pendingPageSize.value))
  if (len === 0) {
    pendingCurrentPage.value = 1
  } else if (pendingCurrentPage.value > totalPages) {
    pendingCurrentPage.value = totalPages
  }
  resetPendingSelection()
})

const getCorrectAnswer = (question) => {
  if (!question.options || !Array.isArray(question.options)) return ''

  const correctOptions = question.options
    .map((opt, idx) => opt.is_correct ? String.fromCharCode(65 + idx) : null)
    .filter(Boolean)

  return correctOptions.join(', ')
}

const editPendingQuestion = (index) => {
  emit('edit', index)
}

const removePendingQuestion = (index) => {
  emit('remove', index)
}

const removeSelectedPendingQuestions = () => {
  emit('remove-selected')
}

const clearPendingQuestions = () => {
  emit('clear')
}

const savePendingQuestions = () => {
  emit('save')
}

const openBulkTagModalForPending = () => {
  emit('open-bulk-tag')
}

const openBulkMetaModalForPending = () => {
  emit('open-bulk-meta')
}

defineExpose({
  resetPendingSelection
})
</script>

<style scoped>
/* Pending Questions Section */
.pending-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px dashed #d89b32;
  margin-bottom: 24px;
  overflow: hidden;
}

.pending-header {
  background: linear-gradient(135deg, #d89b32 0%, #c88a2a 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.header-icon svg {
  color: white;
}

.header-content {
  flex: 1;
}

.pending-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
}

.pending-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-bulk-edit-pending,
.btn-clear-pending,
.btn-save-pending {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-bulk-edit-pending {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.btn-bulk-edit-pending:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.btn-clear-pending {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-clear-pending:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-save-pending {
  background: white;
  color: #d89b32;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-save-pending:hover:not(:disabled) {
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-save-pending:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.pending-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(216, 155, 50, 0.3);
  border-top-color: #d89b32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.pending-list {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.pending-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff7eb;
  border: 1px dashed #d89b32;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.pending-item:hover {
  background: #fef3e2;
  border-color: #c88a2a;
  box-shadow: 0 2px 8px rgba(216, 155, 50, 0.1);
}

.pending-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 8px;
  cursor: pointer;
}

.pending-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d89b32;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
}

.pending-content {
  flex: 1;
  min-width: 0;
}

.pending-text {
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pending-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.meta-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(216, 155, 50, 0.15);
  color: #c88a2a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.meta-badge.meta-answer {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
  font-weight: 700;
}

.meta-info {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.pending-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-edit-pending,
.btn-remove-pending {
  flex-shrink: 0;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-pending {
  color: var(--primary, #476996);
}

.btn-edit-pending:hover {
  background: var(--primary-soft, #EEF2FF);
  transform: scale(1.05);
}

.btn-remove-pending {
  color: #dc2626;
}

.btn-remove-pending:hover {
  background: #fee2e2;
  transform: scale(1.05);
}

.pending-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pending-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 4px;
  flex-wrap: wrap;
}

.pending-tools-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

.pending-selected {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary, #476996);
  font-weight: 600;
}

.pending-tools-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pending-panel .meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.pending-panel .meta-item svg {
  opacity: 0.6;
}

.pending-tools .btn-clear-pending {
  background: #f3f4f6;
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #CBD5E1);
}

.pending-tools .btn-clear-pending:hover:not(:disabled) {
  background: #e5e7eb;
  color: var(--text-primary, #1E293B);
}

.pending-tools .btn-save-pending {
  background: var(--primary, #476996);
  color: white;
  border: none;
  box-shadow: 0 2px 6px rgba(71, 105, 150, 0.2);
}

.pending-tools .btn-save-pending:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
}

.pending-empty {
  margin-top: 12px;
  padding: 24px;
  border: 2px dashed var(--border, #CBD5E1);
  border-radius: 12px;
  background: #f8fafc;
  text-align: center;
}

.pending-empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #1E293B);
  margin-bottom: 6px;
}

.pending-empty-hint {
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

@media (max-width: 768px) {
  .pending-tools {
    flex-direction: column;
    align-items: flex-start;
  }

  .pending-tools-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .pending-panel .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary, #64748B);
  }

  .pending-panel .meta-item svg {
    opacity: 0.6;
  }

  .pending-tools .btn-clear-pending {
    background: #f3f4f6;
    color: var(--text-secondary, #64748B);
    border: 1px solid var(--border, #CBD5E1);
  }

  .pending-tools .btn-clear-pending:hover:not(:disabled) {
    background: #e5e7eb;
    color: var(--text-primary, #1E293B);
  }

  .pending-tools .btn-save-pending {
    background: var(--primary, #476996);
    color: white;
    border: none;
    box-shadow: 0 2px 6px rgba(71, 105, 150, 0.2);
  }

  .pending-tools .btn-save-pending:hover:not(:disabled) {
    background: var(--primary-hover, #35527a);
  }
}

:root[data-theme="dark"] .pending-selected,
.dark .pending-selected {
  background: rgba(71, 105, 150, 0.25);
  color: #cbd5f5;
}

:root[data-theme="dark"] .pending-tools .btn-clear-pending,
.dark .pending-tools .btn-clear-pending {
  background: #1f2937;
  color: #cbd5f5;
  border-color: #334155;
}

:root[data-theme="dark"] .pending-tools .btn-save-pending,
.dark .pending-tools .btn-save-pending {
  background: #f59e0b;
  color: #0f172a;
}

:root[data-theme="dark"] .pending-empty,
.dark .pending-empty {
  background: #111827;
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .pending-empty-title,
.dark .pending-empty-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .pending-empty-hint,
.dark .pending-empty-hint {
  color: var(--text-secondary-dark, #94a3b8);
}

/* Pending Section - Dark Mode */
:root[data-theme="dark"] .pending-section,
.dark .pending-section {
  background: #0f172a;
  border-color: #a16207;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

:root[data-theme="dark"] .pending-header,
.dark .pending-header {
  background: linear-gradient(135deg, #a16207 0%, #92400e 100%);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:root[data-theme="dark"] .header-icon,
.dark .header-icon {
  background: rgba(255, 255, 255, 0.12);
}

:root[data-theme="dark"] .pending-title,
.dark .pending-title {
  color: #fef3c7;
}

:root[data-theme="dark"] .pending-subtitle,
.dark .pending-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

:root[data-theme="dark"] .btn-bulk-edit-pending,
.dark .btn-bulk-edit-pending,
:root[data-theme="dark"] .btn-clear-pending,
.dark .btn-clear-pending {
  background: rgba(255, 255, 255, 0.12);
  color: #fef3c7;
  border-color: rgba(255, 255, 255, 0.25);
}

:root[data-theme="dark"] .btn-save-pending,
.dark .btn-save-pending {
  background: #0f172a;
  color: #fcd34d;
  border: 1px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .pending-item,
.dark .pending-item {
  background: #1f2937;
  border-color: #a16207;
}

:root[data-theme="dark"] .pending-item:hover,
.dark .pending-item:hover {
  background: #263244;
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

:root[data-theme="dark"] .pending-number,
.dark .pending-number {
  background: #f59e0b;
  color: #0f172a;
}

:root[data-theme="dark"] .pending-text,
.dark .pending-text {
  color: #f8fafc;
}

:root[data-theme="dark"] .meta-badge,
.dark .meta-badge {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
}

:root[data-theme="dark"] .meta-badge.meta-answer,
.dark .meta-badge.meta-answer {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

:root[data-theme="dark"] .meta-info,
.dark .meta-info {
  color: #94a3b8;
}

:root[data-theme="dark"] .btn-edit-pending:hover,
.dark .btn-edit-pending:hover {
  background: rgba(71, 105, 150, 0.25);
}

:root[data-theme="dark"] .btn-remove-pending:hover,
.dark .btn-remove-pending:hover {
  background: rgba(220, 38, 38, 0.2);
}
</style>
