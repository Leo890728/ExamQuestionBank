<template>
  <div class="question-admin">
    <div class="tab-switcher">
      <button class="tab-btn" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        題庫列表
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
        暫存題目
        <span v-if="pendingQuestions.length > 0" class="tab-badge">{{ pendingQuestions.length }}</span>
      </button>
    </div>

    <!-- Question Filters -->
    <div v-if="activeTab === 'list'" class="question-filters-wrapper">
      <QuestionFilterPanel v-model="filters" :tags="tagOptions" :loading="isLoading"
        :total-count="paginationState.totalCount" @search="applyFilters" @reset="resetFilters" />
    </div>
    <!-- Pending Questions List -->
    <PendingQuestionsPanel
      v-show="activeTab === 'pending'"
      ref="pendingPanelRef"
      :pending-questions="pendingQuestions"
      :selected-ids="selectedPendingIds"
      :is-saving="isSavingPending"
      :saving-progress="savingPendingProgress"
      @update:selected-ids="handlePendingSelectionChange"
      @edit="editPendingQuestion"
      @remove="removePendingQuestion"
      @remove-selected="removeSelectedPendingQuestions"
      @clear="clearPendingQuestions"
      @save="savePendingQuestions"
      @open-bulk-tag="openBulkTagModalForPending"
      @open-bulk-meta="openBulkMetaModalForPending"
    />

    <!-- Question List using TableList -->
    <QuestionListPanel
      v-if="activeTab === 'list'"
      :questions="questions"
      :is-loading="isLoading"
      :pagination-state="paginationState"
      :current-page="currentPage"
      :page-size="pageSize"
      :deleting-id="deletingId"
      :is-deleting="isDeleting"
      :sort-key="sortKey"
      :sort-order="sortOrder"
      @update:selected-ids="handleSelectionChange"
      @sort-change="handleSortChange"
      @view="viewQuestion"
      @edit="openEditQuestion"
      @view-associated-exams="handleViewAssociatedExams"
      @delete="deleteQuestion"
      @tag-click="addTagToFilter"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @open-add-to-exam="openAddToExamModal"
      @open-bulk-tag="openBulkTagModal"
      @open-bulk-meta="openBulkMetaModal"
      @delete-selected="deleteSelectedQuestions"
    />

    <div v-if="isEditorVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content modern-modal">
          <div class="modern-modal-header">
            <div class="header-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div class="header-content-wrapper">
              <h5 class="modern-modal-title">{{ currentQuestion ? '編輯題目' : '新增題目' }}</h5>
              <p class="modern-modal-subtitle">{{ currentQuestion ? '修改題目內容' : '建立題目內容並選擇儲存方式' }}</p>
            </div>
            <button type="button" class="modern-close-btn" @click="closeEditor" :disabled="saving">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body modern-modal-body">
            <QuestionEditor ref="questionEditorRef" :question="currentQuestion" :saving="saving" @save="handleSave"
              @save-pending="handleSaveToPendingFromEditor" @save-direct="handleSaveDirectlyFromEditor" />
          </div>
          <div class="modern-modal-footer" v-if="!currentQuestion">
            <div class="footer-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>可直接儲存到題庫，或先加入暫存，稍後再批次儲存。</span>
            </div>
            <div class="footer-actions">
              <button class="footer-btn footer-btn-secondary" @click="closeEditor" :disabled="saving">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                取消
              </button>
              <button class="footer-btn footer-btn-pending" @click="handleSaveToPending"
                :disabled="saving || !isEditorFormValid">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                加入暫存
              </button>
              <button class="footer-btn footer-btn-primary" @click="handleSaveDirectly"
                :disabled="saving || !isEditorFormValid">
                <svg v-if="!saving" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <div v-else class="btn-spinner-small"></div>
                {{ saving ? '儲存中...' : '直接儲存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Associated Exams Modal -->
    <div v-if="isViewExamsModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">題目關聯考卷</h5>
            <button type="button" class="btn-close" @click="closeViewExamsModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">題目內容</label>
              <p class="text-break">{{ currentQuestionContent }}</p>
            </div>
            <div>
              <label class="form-label fw-semibold">關聯考卷</label>
              <div v-if="isLoadingAssociatedExams" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">載入中...</span>
                </div>
              </div>
              <div v-else-if="associatedExams.length === 0" class="alert alert-info small">
                此題目未關聯任何考卷
              </div>
              <div v-else class="list-group">
                <div v-for="exam in associatedExams" :key="exam.id" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">{{ exam.name }}</h6>
                      <small class="text-muted">ID: {{ exam.id }}</small>
                    </div>
                    <span class="badge bg-secondary">{{ exam.question_count || 0 }} 題</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeViewExamsModal">關閉</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to Exam Modal -->
    <div v-if="isAddToExamModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">加入考卷</h5>
            <button type="button" class="btn-close" @click="closeAddToExamModal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" role="alert">
              將 {{ selectedCount }} 題加入到選取的考卷
            </div>
            <div class="mb-3">
              <label class="form-label">選擇考卷</label>
              <multiselect v-model="selectedExams" :options="availableExams" :loading="isLoadingExams" :multiple="true"
                :close-on-select="false" placeholder="選擇要加入的考卷..." track-by="id" label="name" :searchable="true" />
            </div>
            <div v-if="selectedExams.length > 0" class="alert alert-secondary small">
              <div><strong>已選擇 {{ selectedExams.length }} 份考卷</strong></div>
              <ul class="mb-0 mt-2">
                <li v-for="exam in selectedExams" :key="exam.id" class="small">
                  {{ exam.name }} (ID: {{ exam.id }} | 目前題數: {{ exam.question_count || 0 }})
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddToExamModal">取消</button>
            <button type="button" class="btn btn-primary" @click="addQuestionsToExam"
              :disabled="selectedExams.length === 0 || isAddingToExam">
              <span v-if="isAddingToExam" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              {{ isAddingToExam ? '加入中...' : '確認加入' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Edit Modals -->
    <BulkTagEditor v-if="showBulkTagModal" :questions="bulkEditMode === 'list' ? questions : []"
      :pendingQuestions="bulkEditMode === 'pending' ? pendingQuestions : []"
      :preselectedIds="bulkEditMode === 'list' ? selectedIds : []"
      :preselectedPendingIds="bulkEditMode === 'pending' ? selectedPendingIds : []" @close="closeBulkTagModal"
      @applied="handleBulkTagsApplied" />

    <BulkQuestionMetaEditor v-if="showBulkMetaModal" :questions="bulkEditMode === 'list' ? questions : []"
      :pendingQuestions="bulkEditMode === 'pending' ? pendingQuestions : []"
      :preselectedIds="bulkEditMode === 'list' ? selectedIds : []"
      :preselectedPendingIds="bulkEditMode === 'pending' ? selectedPendingIds : []" @close="closeBulkMetaModal"
      @applied="handleBulkMetaApplied" />

    <!-- Delete Confirmation Modal -->
    <div v-if="isDeleteConfirmModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" @click="closeDeleteConfirmModal" :disabled="isDeleting"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger mb-3" role="alert">
              <strong>警告：此操作無法復原</strong>
            </div>
            <div class="mb-3">
              <p class="mb-2">確定要刪除 <strong>{{ selectedCount }} 題</strong>嗎？</p>
              <div v-if="isLoadingAffectedExams" class="text-center my-3">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">載入中...</span>
                </div>
              </div>
              <div v-else-if="affectedExamsForDelete.length > 0" class="alert alert-warning small">
                <p class="mb-2"><strong>以下題目涉及 {{ affectedExamsForDelete.length }} 份考卷</strong></p>
                <ul class="mb-0">
                  <li v-for="exam in affectedExamsForDelete" :key="exam.id">
                    {{ exam.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDeleteConfirmModal" :disabled="isDeleting">
              取消
            </button>
            <button type="button" class="btn btn-danger" @click="confirmDelete"
              :disabled="isDeleting || isLoadingAffectedExams">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <QuestionImportModal ref="importModalRef" @import-questions="handleImportQuestions" />



  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { questionApi } from '@/api/test/question'
import { useQuestionDetailStore } from '@/stores/questionDetailStore'
import { useExamStore } from '@/stores/examStore'
import QuestionEditor from '@/components/QuestionEditor.vue'
import BulkTagEditor from '@/components/BulkTagEditor.vue'
import BulkQuestionMetaEditor from '@/components/BulkQuestionMetaEditor.vue'
import QuestionFilterPanel from '@/components/common/QuestionFilterPanel.vue'
import PendingQuestionsPanel from '@/components/PendingQuestionsPanel.vue'
import QuestionListPanel from '@/components/QuestionListPanel.vue'
import QuestionImportModal from '@/components/QuestionImportModal.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { useTagStore } from '@/stores/tagStore'
import { QuestionModel } from '@/models/Question'

const questions = ref([])
const pendingQuestions = ref([])
const isSavingPending = ref(false)
const savingPendingProgress = ref(0)
const selectedPendingIds = ref([]) // 暫存題目選取索引
const isLoading = ref(false)
const error = ref('')
const filters = ref({
  category: '',
  subject: '',
  difficulty: '',
  question_type: '',
  search: '',
  tags: [],
  tag_mode: 'or'
})
const tagOptions = ref([])
const sortKey = ref('createdAt')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(20)
const paginationState = ref({
  hasNext: false,
  hasPrev: false,
  totalPages: 0,
  totalCount: 0
})
const deletingId = ref(null)
const selectedIds = ref([])
const pendingPanelRef = ref(null)
const importModalRef = ref(null)
const activeTab = ref('list')
const questionDetailStore = useQuestionDetailStore()
const examStore = useExamStore()

const isEditorVisible = ref(false)
const currentQuestion = ref(null)
const saving = ref(false)
const questionEditorRef = ref(null)
const editingPendingIndex = ref(null) // 追蹤正在編輯的暫存題目索引
const isEditorFormValid = computed(() => {
  return questionEditorRef.value?.isFormValid ?? false
})

// View Associated Exams Modal state
const isViewExamsModalVisible = ref(false)
const currentQuestionId = ref(null)
const currentQuestionContent = ref('')
const associatedExams = ref([])
const isLoadingAssociatedExams = ref(false)

// Add to Exam Modal state
const isAddToExamModalVisible = ref(false)
const selectedExams = ref([])
const availableExams = ref([])
const isLoadingExams = ref(false)
const isAddingToExam = ref(false)
const isDeleting = ref(false)
const showBulkTagModal = ref(false)
const showBulkMetaModal = ref(false)
const bulkEditMode = ref('list') // 'list' or 'pending' - 批次編輯來源
const tagStore = useTagStore()

const openBulkTagModal = () => {
  bulkEditMode.value = 'list'
  showBulkTagModal.value = true
}

const openBulkMetaModal = () => {
  bulkEditMode.value = 'list'
  showBulkMetaModal.value = true
}

const openBulkTagModalForPending = () => {
  bulkEditMode.value = 'pending'
  showBulkTagModal.value = true
}

const openBulkMetaModalForPending = () => {
  bulkEditMode.value = 'pending'
  showBulkMetaModal.value = true
}

const closeBulkTagModal = () => {
  showBulkTagModal.value = false
  bulkEditMode.value = 'list'
}

const closeBulkMetaModal = () => {
  showBulkMetaModal.value = false
  bulkEditMode.value = 'list'
}

// Affected exams state for delete confirmation
const isDeleteConfirmModalVisible = ref(false)
const affectedExamsForDelete = ref([])
const isLoadingAffectedExams = ref(false)

// Selection helpers
const selectedCount = computed(() => selectedIds.value.length)

const emit = defineEmits(["update:selected-ids"])

const toPendingQuestion = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  return QuestionModel.fromRpcWithExtras(raw)
}

const resetPendingSelection = () => {
  selectedPendingIds.value = []
  pendingPanelRef.value?.resetPendingSelection()
}

const handlePendingSelectionChange = (ids) => {
  selectedPendingIds.value = ids
}

const clearSelection = () => { selectedIds.value = [] }

// Selection handlers
const handleSelectionChange = (ids) => {
  selectedIds.value = ids
}

// Emit selection changes to parent
watch(selectedIds, (val) => {
  try { emit('update:selected-ids', val) } catch (e) { /* noop if parent not listening */ }
}, { deep: true })


const normalize = (q) => ({
  id: q.id,
  subject: q.subject || '',
  category: q.category || '',
  question_type: q.question_type || '',
  difficulty: q.difficulty || '',
  tags: q.tags || [],
  contentSnippet: (() => {
    const raw = q.content || ''
    return raw.length > 20 ? raw.slice(0, 20) + '...' : raw
  })(),
  content: q.content || '',
  createdAt: formatDateTime(q.created_at),
  updatedAt: formatDateTime(q.updated_at)
})

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

// Map camelCase column keys to API ordering field names
const sortKeyToApiField = {
  id: 'id',
  content: 'content',
  subject: 'subject',
  difficulty: 'difficulty',
  createdAt: 'created_at',
}

const ordering = computed(() => {
  if (!sortKey.value) return '-created_at'
  const field = sortKeyToApiField[sortKey.value] || sortKey.value
  return sortOrder.value === 'desc' ? `-${field}` : field
})

const handleSortChange = ({ key, order }) => {
  sortKey.value = key
  sortOrder.value = order
  currentPage.value = 1
  fetchQuestions()
}

const fetchQuestions = async () => {
  isLoading.value = true
  try {
    const data = await questionApi.getQuestions({
      subject: filters.value.subject || null,
      difficulty: filters.value.difficulty || null,
      type: filters.value.question_type || null,
      keyword: filters.value.search?.trim() || null,
      category: filters.value.category || null,
      tag_ids: filters.value.tags?.length ? filters.value.tags.map(t => t.id) : null,
      tag_mode: filters.value.tag_mode || 'or',
      page: currentPage.value,
      page_size: pageSize.value,
      ordering: ordering.value || null
    })
    const list = data?.results || []
    questions.value = list.map(normalize)

    const count = data?.count || 0
    const tp = Math.ceil(count / pageSize.value) || 1
    paginationState.value = {
      hasNext: currentPage.value < tp,
      hasPrev: currentPage.value > 1,
      totalPages: tp,
      totalCount: count
    }
  } catch (err) {
    console.error('Failed to fetch questions', err)
    error.value = err.message || '載入題目列表失敗'
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => { currentPage.value = 1; fetchQuestions() }
const resetFilters = () => {
  filters.value = {
    category: '',
    subject: '',
    difficulty: '',
    question_type: '',
    search: '',
    tags: [],
    tag_mode: 'or'
  }
  sortKey.value = 'createdAt'
  sortOrder.value = 'desc'
  currentPage.value = 1
  fetchQuestions()
}

// Add tag to filter when clicking tag badge
const addTagToFilter = (tag) => {
  // Check if tag is already in the filter
  const alreadySelected = filters.value.tags.some(t => t.id === tag.id)

  if (!alreadySelected) {
    // Add tag to filter
    filters.value.tags.push(tag)
    // Apply filters to search with the new tag
    applyFilters()
  }
}

const handlePageChange = (page) => {
  if (page !== currentPage.value && page >= 1 && page <= paginationState.value.totalPages) {
    currentPage.value = page
    fetchQuestions()
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchQuestions()
}

// load tags
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

onMounted(() => {
  fetchQuestions()
  loadTags()

  // Listen for events from parent component
  window.addEventListener('openCreateQuestion', openCreateQuestion)
  window.addEventListener('refreshQuestions', fetchQuestions)
})

// Clean up event listeners
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('openCreateQuestion', openCreateQuestion)
  window.removeEventListener('refreshQuestions', fetchQuestions)
})

const openEditQuestion = async (id) => {
  try {
    isEditorVisible.value = true
    saving.value = false
    currentQuestion.value = null
    const data = await questionDetailStore.getQuestion(id)
    currentQuestion.value = data
  } catch (err) {
    console.error('Load question failed', err)
    alert('載入題目失敗')
    isEditorVisible.value = false
  }
}

const openCreateQuestion = () => { currentQuestion.value = null; isEditorVisible.value = true }

const closeEditor = () => { isEditorVisible.value = false; currentQuestion.value = null; saving.value = false }

const handleSave = async ({ questionData }) => {
  // If editing a pending question, save it back to pending list only
  if (editingPendingIndex.value !== null) {
    pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
    alert('暫存題目已更新')
    editingPendingIndex.value = null
    closeEditor()
    return
  }
  // This is called when editing existing question
  try {
    saving.value = true
    if (currentQuestion.value && currentQuestion.value.id) {
      await questionApi.updateQuestion(currentQuestion.value.id, questionData)
      questionDetailStore.setQuestion({
        ...currentQuestion.value,
        ...questionData,
        id: currentQuestion.value.id
      })
      alert('題目已更新')
    } else {
      await questionApi.createQuestion(questionData)
      alert('題目已建立')
    }
    closeEditor()
    fetchQuestions()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗')
  } finally {
    saving.value = false
  }
}

// New: Save directly to database
const handleSaveDirectly = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSaveDirect()
}

// New: Save to pending list
const handleSaveToPending = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSavePending()
}

// Called from QuestionEditor when save direct is triggered
const handleSaveDirectlyFromEditor = async ({ questionData }) => {
  try {
    saving.value = true

    // 如果正在編輯暫存題目
    if (editingPendingIndex.value !== null) {
      pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
      alert('暫存題目已更新')
      closeEditor()
      editingPendingIndex.value = null
      return
    }

    await questionApi.createQuestion(questionData)
    alert('題目已建立')
    closeEditor()
    fetchQuestions()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗：' + (err.message || ''))
  } finally {
    saving.value = false
  }
}

// Called from QuestionEditor when save to pending is triggered
const handleSaveToPendingFromEditor = ({ questionData }) => {
  // 如果正在編輯暫存題目，直接更新
  if (editingPendingIndex.value !== null) {
    pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
    alert('暫存題目已更新')
    editingPendingIndex.value = null
  } else {
    addPendingQuestion(questionData)
    alert('已加入暫存')
  }
  closeEditor()
}

const viewQuestion = async (id) => {
  // For now, reuse openEdit but set view-only (not necessary)
  openEditQuestion(id)
}

const openAddToExamModal = async () => {
  isAddToExamModalVisible.value = true
  selectedExams.value = []
  await loadAvailableExams()
}

const closeAddToExamModal = () => {
  isAddToExamModalVisible.value = false
  selectedExams.value = []
}

const loadAvailableExams = async () => {
  isLoadingExams.value = true
  try {
    const { data } = await examStore.getExams({ pageSize: 100 })
    const list = Array.isArray(data) ? data : data.results || []
    availableExams.value = list
    console.log('Loaded exams:', list)
  } catch (err) {
    console.error('Failed to load exams', err)
    alert('載入考卷列表失敗')
  } finally {
    isLoadingExams.value = false
  }
}

const addQuestionsToExam = async () => {
  if (selectedExams.value.length === 0 || selectedCount.value === 0) return

  isAddingToExam.value = true
  try {
    // Add each question to each selected exam
    // According to API docs: POST /exams/{id}/add_question/ with { question, order, points }
    for (const exam of selectedExams.value) {
      for (let i = 0; i < selectedIds.value.length; i++) {
        const questionId = selectedIds.value[i]
        await examStore.addQuestionToExam(exam.id, {
          question: questionId,
          order: i + 1
        })
      }
    }

    const examNames = selectedExams.value.map(e => e.name).join('、')
    alert(`已將 ${selectedCount.value} 題加入到考卷：${examNames}`)
    closeAddToExamModal()
    clearSelection()
  } catch (err) {
    console.error('Error adding questions to exam', err)
    alert('加入考卷失敗：' + (err.response?.data?.detail || err.message || '請稍後再試'))
  } finally {
    isAddingToExam.value = false
  }
}

const closeViewExamsModal = () => {
  isViewExamsModalVisible.value = false
  currentQuestionId.value = null
  currentQuestionContent.value = ''
  associatedExams.value = []
}

const viewAssociatedExams = async (questionId, content) => {
  isViewExamsModalVisible.value = true
  currentQuestionId.value = questionId
  currentQuestionContent.value = content
  await loadAssociatedExams(questionId)
}

const handleViewAssociatedExams = ({ id, content }) => {
  viewAssociatedExams(id, content)
}

const loadAssociatedExams = async (questionId) => {
  isLoadingAssociatedExams.value = true
  try {
    // Use dedicated API endpoint to get exams containing this question
    const { data } = await examStore.getExamsByQuestion(questionId)
    const exams = Array.isArray(data) ? data : data.results || []
    associatedExams.value = exams
    console.log('Associated exams:', exams)
  } catch (err) {
    console.error('Failed to load associated exams', err)
    alert('載入關聯考卷失敗')
  } finally {
    isLoadingAssociatedExams.value = false
  }
}

const deleteQuestion = async (id) => {
  if (!confirm('確定要刪除此題目嗎？')) return
  deletingId.value = id
  try {
    await questionApi.deleteQuestion(id)
    // remove from selection if present
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(x => x !== id)
    }
    alert('題目已刪除')
    fetchQuestions()
  } catch (err) {
    console.error('Delete question failed', err)
    alert('刪除題目失敗')
  } finally {
    deletingId.value = null
  }
}

const deleteSelectedQuestions = async () => {
  if (selectedCount.value === 0) return

  // Load affected exams first
  isLoadingAffectedExams.value = true
  try {
    const response = await examStore.getExamsByQuestions(selectedIds.value)
    const exams = Array.isArray(response) ? response : response.data ? response.data : []
    console.log('Affected exams:', exams)
    affectedExamsForDelete.value = exams
  } catch (err) {
    console.error('Failed to load affected exams', err)
    affectedExamsForDelete.value = []
  } finally {
    isLoadingAffectedExams.value = false
  }

  // Show confirmation modal
  isDeleteConfirmModalVisible.value = true
}

const closeDeleteConfirmModal = () => {
  isDeleteConfirmModalVisible.value = false
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    const idsToDelete = [...selectedIds.value]
    let successCount = 0
    let failCount = 0

    for (const id of idsToDelete) {
      try {
        await questionApi.deleteQuestion(id)
        successCount++
      } catch (err) {
        console.error(`Failed to delete question ${id}`, err)
        failCount++
      }
    }

    selectedIds.value = []
    affectedExamsForDelete.value = []
    isDeleteConfirmModalVisible.value = false

    if (failCount === 0) {
      alert(`成功刪除 ${successCount} 題`)
    } else {
      alert(`刪除完成：成功 ${successCount} 題，失敗 ${failCount} 題`)
    }

    fetchQuestions()
  } catch (err) {
    console.error('Batch delete failed', err)
    alert('批次刪除失敗')
  } finally {
    isDeleting.value = false
  }
}

// Handlers for Bulk Tag/Meta modals
const handleBulkTagsApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount

  // 處理暫存題目更新
  if (pendingUpdates && pendingUpdates.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined) {
        // 更新暫存題目
        if (pendingQuestions.value[update.index]) {
          pendingQuestions.value[update.index].tags = update.tags || []
          pendingQuestions.value[update.index].tag_ids = update.tag_ids || []
          totalUpdated++
        }
      }
    })
  }

  if (totalUpdated > 0) alert(`已更新 ${totalUpdated} 題標籤`)
  if (errors && errors.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)

  closeBulkTagModal()
  if (bulkEditMode.value === 'pending') {
    resetPendingSelection()
  } else {
    clearSelection()
    fetchQuestions()
  }
}

const handleBulkMetaApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount

  // 處理暫存題目更新
  if (pendingUpdates && pendingUpdates.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined) {
        // 更新暫存題目
        if (pendingQuestions.value[update.index]) {
          if (update.subject !== undefined) {
            pendingQuestions.value[update.index].subject = update.subject
          }
          if (update.category !== undefined) {
            pendingQuestions.value[update.index].category = update.category
          }
          if (update.year !== undefined) {
            pendingQuestions.value[update.index].year = update.year
          }
          if (update.source !== undefined) {
            pendingQuestions.value[update.index].source = update.source
          }
          if (update.difficulty !== undefined) {
            pendingQuestions.value[update.index].difficulty = update.difficulty
          }
          totalUpdated++
        }
      }
    })
  }

  if (totalUpdated > 0) alert(`已更新 ${totalUpdated} 題科目與分類`)
  if (errors && errors.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)

  closeBulkMetaModal()
  if (bulkEditMode.value === 'pending') {
    resetPendingSelection()
  } else {
    clearSelection()
    fetchQuestions()
  }
}

// Pending Questions handlers
const addPendingQuestion = (questionData) => {
  pendingQuestions.value.push(toPendingQuestion(questionData))
}

const getCorrectAnswer = (question) => {
  if (!question.options || !Array.isArray(question.options)) return ''

  const correctOptions = question.options
    .map((opt, idx) => opt.is_correct ? String.fromCharCode(65 + idx) : null)
    .filter(Boolean)

  return correctOptions.join(', ')
}

const editPendingQuestion = (index) => {
  editingPendingIndex.value = index
  currentQuestion.value = { ...toPendingQuestion(pendingQuestions.value[index]) }
  isEditorVisible.value = true
}

const removePendingQuestion = (index) => {
  if (confirm('確定要移除此暫存題目嗎？')) {
    pendingQuestions.value.splice(index, 1)
    resetPendingSelection()
  }
}

const removeSelectedPendingQuestions = () => {
  if (selectedPendingIds.value.length === 0) return
  if (!confirm(`確定要移除已選 ${selectedPendingIds.value.length} 個暫存題目嗎？`)) return

  const sorted = [...selectedPendingIds.value].sort((a, b) => b - a)
  sorted.forEach((idx) => {
    if (idx >= 0 && idx < pendingQuestions.value.length) {
      pendingQuestions.value.splice(idx, 1)
    }
  })
  resetPendingSelection()
}

const clearPendingQuestions = () => {
  if (confirm(`確定要清空全部 ${pendingQuestions.value.length} 個暫存題目嗎？`)) {
    pendingQuestions.value = []
    resetPendingSelection()
  }
}

const savePendingQuestions = async () => {
  if (pendingQuestions.value.length === 0) return

  if (!confirm(`即將把 ${pendingQuestions.value.length} 個暫存題目存入題庫，確定要繼續嗎？`)) {
    return
  }

  isSavingPending.value = true
  savingPendingProgress.value = 0

  let successCount = 0
  let failCount = 0
  const errors = []

  try {
    for (let i = 0; i < pendingQuestions.value.length; i++) {
      const questionData = pendingQuestions.value[i]
      savingPendingProgress.value = i + 1

      try {
        await questionApi.createQuestion(questionData)
        successCount++
      } catch (err) {
        console.error(`暫存題目 ${i + 1} 失敗:`, err)
        failCount++
        errors.push({ index: i + 1, error: err })
      }
    }

    // Clear pending questions after save
    pendingQuestions.value = []
    resetPendingSelection()
    savingPendingProgress.value = 0

    // Show result
    if (failCount === 0) {
      alert(`成功儲存 ${successCount} 題到題庫`)
    } else {
      alert(`儲存完成：成功 ${successCount} 題，失敗 ${failCount} 題`)
    }

    // Refresh question list
    fetchQuestions()
  } catch (err) {
    console.error('儲存暫存題目失敗:', err)
    alert('儲存暫存題目失敗')
  } finally {
    isSavingPending.value = false
    savingPendingProgress.value = 0
  }
}

// Import Modal Functions
const showImportModalFunc = () => {
  importModalRef.value?.open()
}

const handleImportQuestions = (questions) => {
  if (Array.isArray(questions) && questions.length > 0) {
    pendingQuestions.value.push(...questions.map(toPendingQuestion))
  }
}

// Expose function for external use (e.g., from PDF import)
defineExpose({
  addPendingQuestion,
  addPendingQuestions: (questions) => {
    pendingQuestions.value.push(...questions.map(toPendingQuestion))
  },
  showImportModal: showImportModalFunc
})

</script>

<style scoped>
.question-admin {
  padding: 0;
}

/* Tabs */
.tab-switcher {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--border, #CBD5E1);
  margin-bottom: 18px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748B);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-primary, #1E293B);
}

.tab-btn.active {
  background: white;
  color: var(--text-primary, #1E293B);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #f59e0b;
  color: white;
  font-size: 12px;
  font-weight: 700;
}


/* Filters */
.question-filters-wrapper {
  margin-bottom: 24px;
}


@media (max-width: 768px) {
  .tab-switcher {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    justify-content: center;
  }
}

/* Modern Modal Styles */

.modern-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
}

.modern-modal-header {
  background: linear-gradient(135deg, var(--primary, #476996) 0%, var(--primary-hover, #35527a) 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon-wrapper {
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

.header-icon-wrapper svg {
  color: white;
}

.header-content-wrapper {
  flex: 1;
}

.modern-modal-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.modern-modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.modern-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modern-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.modern-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modern-close-btn svg {
  color: white;
}

.modern-modal-body {
  padding: 28px;
  max-height: calc(90vh - 250px);
  overflow-y: auto;
}

.modern-modal-footer {
  padding: 20px 28px;
  background: #f9fafb;
  border-top: 1px solid var(--border, #CBD5E1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  flex: 1;
}

.footer-info svg {
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.footer-btn svg {
  flex-shrink: 0;
}

.footer-btn-secondary {
  background: white;
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #CBD5E1);
}

.footer-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  color: var(--text-primary, #1E293B);
  border-color: #94a3b8;
}

.footer-btn-pending {
  background: #fff7eb;
  color: #d89b32;
  border: 1px solid #f7d7a8;
}

.footer-btn-pending:hover:not(:disabled) {
  background: #fef3e2;
  border-color: #d89b32;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(216, 155, 50, 0.2);
}

.footer-btn-primary {
  background: var(--primary, #476996);
  color: white;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.footer-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(71, 105, 150, 0.3);
}

.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .modern-modal-header {
    padding: 20px;
  }

  .modern-modal-title {
    font-size: 18px;
  }

  .modern-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-info {
    order: -1;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .footer-btn {
    width: 100%;
  }
}

:root[data-theme="dark"] .tab-switcher,
.dark .tab-switcher {
  background: #111827;
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .tab-btn,
.dark .tab-btn {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .tab-btn:hover,
.dark .tab-btn:hover {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .tab-btn.active,
.dark .tab-btn.active {
  background: #0f172a;
  color: var(--text-primary-dark, #f1f5f9);
  box-shadow: none;
}

:root[data-theme="dark"] .modern-modal,
.dark .modern-modal {
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-dark, #334155);
}

:root[data-theme="dark"] .modern-modal-body,
.dark .modern-modal-body {
  background: var(--bg-primary, #0f172a);
}

:root[data-theme="dark"] .modern-modal-footer,
.dark .modern-modal-footer {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}
</style>

