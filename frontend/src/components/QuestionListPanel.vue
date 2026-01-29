<template>
<!-- Question List using AdminDataList -->
<AdminDataList type="question" :items="questions"
  :loading="isLoading" :total-count="paginationState.totalCount" :show-header="false" :show-pagination="true"
  item-unit="題" empty-text="沒有符合條件的題目" empty-hint="請調整篩選條件或新增題目" :current-page="currentPage"
  :page-size="pageSize" :pagination-state="paginationState" @update:selected-ids="handleSelectionChange"
  @tag-click="addTagToFilter" @page-change="handlePageChange" @size-change="handleSizeChange">
  <!-- Custom item actions -->
  <template #item-actions="{ item }">
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
    <button class="action-btn action-btn-info" @click="viewAssociatedExams(item.id, item.content)"
      title="查看關聯考卷">
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

    <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkSubjectModal" title="批次編輯科目">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <span>批次編輯科目</span>
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
</AdminDataList>

</template>

<script setup>
import { toRefs } from 'vue'
import AdminDataList from '@/components/common/AdminDataList.vue'

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
  'open-add-to-exam',
  'open-bulk-tag',
  'open-bulk-subject',
  'delete-selected'
])

const {
  questions,
  isLoading,
  paginationState,
  currentPage,
  pageSize,
  deletingId,
  isDeleting
} = toRefs(props)

const handleSelectionChange = (ids) => {
  emit('update:selected-ids', ids)
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

const openBulkSubjectModal = () => {
  emit('open-bulk-subject')
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
