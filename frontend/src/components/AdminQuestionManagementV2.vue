<template>
  <div class="question-management-v2">

    <!-- Tab Container -->
    <div class="tab-container">
      <button class="tab-btn" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        題庫列表
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
        暫存題目
        <span v-if="pendingQuestions.length > 0" class="tab-badge">{{ pendingQuestions.length }}</span>
      </button>
    </div>

    <!-- =============== 題庫列表 Tab =============== -->
    <template v-if="activeTab === 'list'">
      <!-- Filter Panel -->
      <div class="filter-wrapper">
        <QuestionFilterPanel v-model="localFilters" :tags="tagOptions" :loading="questionStore.loading"
          :total-count="questionStore.paginationState.totalCount" @search="applyFilters" @reset="handleResetFilters" />
      </div>

      <!-- Question Table -->
      <TableList ref="listTableRef" :items="normalizedQuestions" :loading="questionStore.loading" :columns="listColumns"
        :selectable="true" :show-pagination="true" :pagination-state="questionStore.paginationState"
        :current-page="questionStore.page" :page-size="questionStore.pageSize" :sort-key="sortKey"
        :sort-order="sortOrder" title="題目列表"
        :subtitle="`共 ${questionStore.paginationState.totalCount} 題，顯示第 ${questionStore.questions.length ? (questionStore.page - 1) * questionStore.pageSize + 1 : 0}–${Math.min(questionStore.page * questionStore.pageSize, questionStore.paginationState.totalCount)} 題`"
        header-icon="bi-database" empty-text="目前沒有題目" empty-hint="點擊上方「新增題目」開始建立" @sort-change="handleSortChange"
        @page-change="handlePageChange" @size-change="handleSizeChange" @update:selected-ids="handleSelectionChange">

        <template #header-actions>
          <button class="header-action-btn" @click="openImportModal">
            <i class="bi bi-upload"></i>
            匯入
          </button>
          <button class="header-action-btn primary" @click="openCreateQuestion">
            <i class="bi bi-plus-lg"></i>
            新增題目
          </button>
        </template>

        <!-- Content cell: two-line layout -->
        <template #cell-content="{ item }">
          <div class="cell-content-wrap">
            <span class="content-text">{{ item.content }}</span>
            <span class="content-meta">{{ item.category || '' }}{{ item.category && item.subject ? ' - ' : ''
            }}{{ item.subject || '' }}{{ (item.category || item.subject) && item.tagsText ? ' • ' : '' }}{{
                item.tagsText
                || '' }}</span>
          </div>
        </template>

        <!-- Type badge -->
        <template #cell-question_type="{ item }">
          <span v-if="item.question_type" class="type-badge">{{ item.question_type === 'multipleChoice' ? '選擇題' : '簡答題'
          }}</span>
        </template>

        <!-- Difficulty badge -->
        <template #cell-difficulty="{ item }">
          <span v-if="item.difficulty" class="difficulty-badge" :class="item.difficulty">
            {{ difficultyName(item.difficulty) }}
          </span>
        </template>

        <!-- Created time -->
        <template #cell-createdAt="{ item }">
          <span class="created-text">{{ item.createdAt }}</span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item }">
          <div class="row-actions">
            <button class="action-btn" title="查看" @click.stop="viewQuestion(item.id)">
              <i class="bi bi-eye"></i>
            </button>
            <button class="action-btn" title="編輯" @click.stop="openEditQuestion(item.id)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="action-btn danger" title="刪除" @click.stop="handleDelete(item.id)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </template>

        <template #selection-actions="{ selectedIds, clearSelection }">
          <button class="toolbar-btn toolbar-btn-danger" title="批次刪除" @click="deleteSelected(selectedIds, clearSelection)">
            <i class="bi bi-trash"></i>
            刪除 {{ selectedIds.length }} 題
          </button>
        </template>
      </TableList>
    </template>

    <!-- =============== 暫存題目 Tab =============== -->
    <template v-if="activeTab === 'pending'">
      <!-- Unsaved Changes Bar -->
      <div v-if="pendingQuestions.length > 0" class="unsaved-bar">
        <div class="bar-left">
          <div class="bar-icon-wrap">
            <span>⚠</span>
          </div>
          <span class="bar-msg">您有 {{ pendingQuestions.length }} 筆暫存題目尚未儲存</span>
          <span class="bar-detail">請確認內容後儲存至題庫</span>
        </div>
        <div class="bar-right">
          <button class="bar-btn outline" @click="discardAllPending">全部捨棄</button>
          <button class="bar-btn filled" :disabled="isSavingAll" @click="saveAllPending">
            {{ isSavingAll ? '儲存中...' : '全部儲存' }}
          </button>
        </div>
      </div>

      <!-- Pending Table -->
      <TableList ref="pendingTableRef" :items="pendingQuestions" :loading="false" :columns="pendingColumns"
        :selectable="true" :show-pagination="true" :page-size="10" title="暫存題目" :subtitle="`共有 ${pendingQuestions.length} 筆等待儲存的題目`"
        header-icon="bi-clock-history" empty-text="沒有暫存題目" empty-hint="新增題目時選擇「加入暫存」即可在此管理"
        @update:selected-ids="handlePendingSelectionChange">

        <template #header-actions>
          <button class="header-action-btn" @click="openImportModal">
            <i class="bi bi-upload"></i>
            匯入
          </button>
          <button class="header-action-btn primary" @click="openCreateQuestion">
            <i class="bi bi-plus-lg"></i>
            新增題目
          </button>
        </template>

        <!-- Content cell -->
        <template #cell-content="{ item }">
          <div class="cell-content-wrap">
            <span class="content-text">{{ item.content }}</span>
            <span class="content-meta">{{ item.category || '' }}{{ item.category && item.subject ? ' - ' : ''
            }}{{ item.subject || '' }}{{ (item.category || item.subject) && item.tagsText ? ' • ' : '' }}{{
                item.tagsText
                || '' }}</span>
          </div>
        </template>

        <!-- Type badge -->
        <template #cell-question_type="{ item }">
          <span v-if="item.question_type" class="type-badge">{{ item.question_type === 'multipleChoice' ? '選擇題' : '簡答題'
          }}</span>
        </template>

        <!-- Difficulty badge -->
        <template #cell-difficulty="{ item }">
          <span v-if="item.difficulty" class="difficulty-badge" :class="item.difficulty">
            {{ difficultyName(item.difficulty) }}
          </span>
        </template>

        <!-- Pending Actions: save / edit / delete -->
        <template #cell-actions="{ item, index }">
          <div class="row-actions">
            <button class="action-btn save-btn" title="儲存" @click.stop="savePendingQuestion(index)">
              <i class="bi bi-save"></i>
            </button>
            <button class="action-btn" title="編輯" @click.stop="editPendingQuestion(index)">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="action-btn danger" title="刪除" @click.stop="removePendingQuestion(index)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </template>

        <template #selection-actions="{ selectedIds, clearSelection }">
          <button class="toolbar-btn toolbar-btn-primary" title="批次儲存" @click="saveSelectedPending(selectedIds, clearSelection)">
            <i class="bi bi-save"></i>
            儲存 {{ selectedIds.length }} 題
          </button>
          <button class="toolbar-btn toolbar-btn-secondary" title="批次編輯標籤" @click="openBulkTagModal">
            <i class="bi bi-tags"></i>
            編輯標籤
          </button>
          <button class="toolbar-btn toolbar-btn-secondary" title="批次編輯屬性" @click="openBulkMetaModal">
            <i class="bi bi-pencil-square"></i>
            編輯屬性
          </button>
          <button class="toolbar-btn toolbar-btn-danger" title="批次刪除" @click="removeSelectedPending(selectedIds, clearSelection)">
            <i class="bi bi-trash"></i>
            刪除 {{ selectedIds.length }} 題
          </button>
        </template>
      </TableList>
    </template>

    <!-- =============== Bulk Edit Modals =============== -->
    <BulkTagEditor v-if="showBulkTagModal" :questions="[]"
      :pendingQuestions="pendingQuestions"
      :preselectedIds="[]"
      :preselectedPendingIds="selectedPendingIds" @close="closeBulkTagModal"
      @applied="handleBulkTagsApplied" />

    <BulkQuestionMetaEditor v-if="showBulkMetaModal" :questions="[]"
      :pendingQuestions="pendingQuestions"
      :preselectedIds="[]"
      :preselectedPendingIds="selectedPendingIds" @close="closeBulkMetaModal"
      @applied="handleBulkMetaApplied" />

    <!-- =============== QuestionEditor Modal =============== -->
    <div v-if="isEditorVisible" class="modal-overlay" @click.self="closeEditor">
      <div class="modal-panel">
        <div class="modal-panel-header">
          <div class="modal-title-row">
            <i class="bi" :class="editorQuestion ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
            <div>
              <h3 class="modal-title">{{ editorQuestion ? '編輯題目' : '新增題目' }}</h3>
              <p class="modal-subtitle">{{ editorQuestion ? '修改題目內容' : '建立題目內容並選擇儲存方式' }}</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="closeEditor" :disabled="saving">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-panel-body">
          <QuestionEditor ref="questionEditorRef" :question="editorQuestion" :saving="saving" @save="handleEditorSave"
            @save-pending="handleSaveToPendingFromEditor" @save-direct="handleSaveDirectlyFromEditor" />
        </div>
        <div class="modal-panel-footer" v-if="!editorQuestion">
          <div class="footer-info">
            <i class="bi bi-info-circle"></i>
            <span>可直接儲存到題庫，或先加入暫存，稍後再批次儲存。</span>
          </div>
          <div class="footer-actions">
            <button class="footer-btn secondary" @click="closeEditor" :disabled="saving">取消</button>
            <button class="footer-btn pending" @click="handleSaveToPending" :disabled="saving || !isEditorFormValid">
              <i class="bi bi-clock-history"></i> 加入暫存
            </button>
            <button class="footer-btn primary" @click="handleSaveDirectly" :disabled="saving || !isEditorFormValid">
              <template v-if="saving"><span class="btn-spinner"></span> 儲存中...</template>
              <template v-else><i class="bi bi-check-lg"></i> 直接儲存</template>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- =============== Import Modal =============== -->
    <QuestionImportModal v-if="isImportVisible" @close="isImportVisible = false" @imported="handleImported" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestionStore } from '@/stores/test/question'
import { useQuestionDetailStore } from '@/stores/questionDetailStore'
import { useTagStore } from '@/stores/tagStore'
import QuestionFilterPanel from '@/components/common/QuestionFilterPanel.vue'
import TableList from '@/components/common/TableList.vue'
import QuestionEditor from '@/components/QuestionEditor.vue'
import QuestionImportModal from '@/components/QuestionImportModal.vue'
import BulkTagEditor from '@/components/BulkTagEditor.vue'
import BulkQuestionMetaEditor from '@/components/BulkQuestionMetaEditor.vue'

// ── Stores ──
const questionStore = useQuestionStore()
const questionDetailStore = useQuestionDetailStore()
const tagStore = useTagStore()

// ── Refs ──
const listTableRef = ref(null)
const pendingTableRef = ref(null)
const activeTab = ref('list')
const tagOptions = ref([])

// ── Editor modal state ──
const isEditorVisible = ref(false)
const editorQuestion = ref(null)
const saving = ref(false)
const questionEditorRef = ref(null)
const editingPendingIndex = ref(null)
const isEditorFormValid = computed(() => questionEditorRef.value?.isFormValid ?? false)

// ── Import modal state ──
const isImportVisible = ref(false)

// ── Bulk edit modal state ──
const showBulkTagModal = ref(false)
const showBulkMetaModal = ref(false)

const openBulkTagModal = () => { showBulkTagModal.value = true }
const openBulkMetaModal = () => { showBulkMetaModal.value = true }
const closeBulkTagModal = () => { showBulkTagModal.value = false }
const closeBulkMetaModal = () => { showBulkMetaModal.value = false }

const handleBulkTagsApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount
  if (pendingUpdates?.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined && pendingQuestions.value[update.index]) {
        pendingQuestions.value[update.index].tags = update.tags || []
        pendingQuestions.value[update.index].tag_ids = update.tag_ids || []
        pendingQuestions.value[update.index].tagsText = (update.tags || []).map(t => t.name || t).join('、')
        totalUpdated++
      }
    })
  }
  if (totalUpdated > 0) alert(`已更新 ${totalUpdated} 題標籤`)
  if (errors?.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)
  closeBulkTagModal()
  selectedPendingIds.value = []
}

const handleBulkMetaApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount
  if (pendingUpdates?.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined && pendingQuestions.value[update.index]) {
        const q = pendingQuestions.value[update.index]
        if (update.subject !== undefined) q.subject = update.subject
        if (update.category !== undefined) q.category = update.category
        if (update.year !== undefined) q.year = update.year
        if (update.source !== undefined) q.source = update.source
        if (update.difficulty !== undefined) q.difficulty = update.difficulty
        totalUpdated++
      }
    })
  }
  if (totalUpdated > 0) alert(`已更新 ${totalUpdated} 題科目與分類`)
  if (errors?.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)
  closeBulkMetaModal()
  selectedPendingIds.value = []
}
const sortKey = ref('createdAt')
const sortOrder = ref('desc')

// ── Local filters (for QuestionFilterPanel v-model) ──
const localFilters = ref({
  category: '',
  subject: '',
  difficulty: '',
  question_type: '',
  search: '',
  tags: [],
  tag_mode: 'or'
})

// ── Pending questions (frontend-only state) ──
const pendingQuestions = ref([])
const isSavingAll = ref(false)
const selectedPendingIds = ref([])

// ── Columns (題庫列表) ──
const listColumns = [
  { key: 'id', label: 'ID', width: '60px', sortable: true },
  { key: 'content', label: '題目內容', width: '1fr' },
  { key: 'question_type', label: '題型', width: '80px' },
  { key: 'difficulty', label: '難度', width: '100px' },
  { key: 'createdAt', label: '建立時間', width: '140px', sortable: true },
  { key: 'actions', label: '操作', width: '120px', align: 'center' }
]

// ── Columns (暫存題目) ──
const pendingColumns = [
  { key: 'content', label: '題目內容', width: '1fr' },
  { key: 'question_type', label: '題型', width: '80px' },
  { key: 'difficulty', label: '難度', width: '100px' },
  { key: 'actions', label: '操作', width: '140px', align: 'center' }
]

// ── Helpers ──
const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const normalize = (q) => ({
  id: q.id,
  subject: q.subject || '',
  category: q.category || '',
  question_type: q.question_type || q.type || '',
  difficulty: q.difficulty || '',
  tags: q.tags || [],
  tagsText: (q.tags || []).map(t => t.name || t).join('、'),
  content: q.content || '',
  createdAt: formatDateTime(q.created_at),
})

const normalizedQuestions = computed(() =>
  questionStore.questions.map(normalize)
)

const difficultyName = (d) => {
  if (!d) return ''
  const map = { 'easy': '簡單', 'normal': '普通', 'hard': '困難', 'insane': '極難' }
  return map[d] || ''
}

// ── Sync local filters → store and search ──
const syncFiltersToStore = () => {
  const f = localFilters.value
  questionStore.setFilters({
    subject: f.subject || null,
    difficulty: f.difficulty || null,
    type: f.question_type || null,
    keyword: f.search?.trim() || '',
    category: f.category || null,
    tag_ids: f.tags?.length ? f.tags.map(t => t.id) : null,
    tag_mode: f.tag_mode || 'or'
  })
}

// ── Filter actions ──
const applyFilters = () => {
  syncFiltersToStore()
  questionStore.page = 1
  questionStore.search()
}

const handleResetFilters = () => {
  localFilters.value = {
    category: '', subject: '', difficulty: '', question_type: '',
    search: '', tags: [], tag_mode: 'or'
  }
  sortKey.value = 'createdAt'
  sortOrder.value = 'desc'
  questionStore.resetFilters()
  questionStore.search()
}

// ── Sort ──
const handleSortChange = ({ key, order }) => {
  sortKey.value = key
  sortOrder.value = order
  questionStore.page = 1
  questionStore.search()
}

// ── Pagination (delegate to store) ──
const handlePageChange = (page) => { questionStore.goToPage(page) }
const handleSizeChange = (size) => { questionStore.setPageSize(size) }

// ── Selection ──
const handleSelectionChange = (ids) => { /* TableList handles internally */ }
const handlePendingSelectionChange = (ids) => { selectedPendingIds.value = ids }

// ── Delete (use store) ──
const handleDelete = async (id) => {
  if (!confirm('確定要刪除此題目嗎？')) return
  try {
    await questionStore.deleteQuestion(id)
    alert('題目已刪除')
    questionStore.search()
  } catch (err) {
    console.error('Delete question failed', err)
    alert('刪除題目失敗')
  }
}

const deleteSelected = async (ids, clearSelection) => {
  if (!ids.length) return
  if (!confirm(`確定要刪除選取的 ${ids.length} 題嗎？此操作無法復原。`)) return
  try {
    for (const id of ids) {
      await questionStore.deleteQuestion(id)
    }
    alert(`已刪除 ${ids.length} 題`)
    clearSelection()
    questionStore.search()
  } catch (err) {
    console.error('Batch delete failed', err)
    alert('批次刪除失敗')
  }
}

// ── Pending CRUD ──
let pendingIdCounter = 0
const addPendingQuestion = (q) => {
  pendingIdCounter++
  const item = {
    ...q,
    _pendingId: Date.now() + Math.random(),
    id: `pending-${Date.now()}-${pendingIdCounter}`,
    question_type: q.question_type || q.type || '',
    tagsText: (q.tags || []).map(t => t.name || t).join('、'),
  }
  pendingQuestions.value.push(item)
}

const removePendingQuestion = (index) => {
  pendingQuestions.value.splice(index, 1)
}

const removeSelectedPending = (ids, clearSelection) => {
  pendingQuestions.value = pendingQuestions.value.filter(q => !ids.includes(q.id))
  clearSelection()
}

const saveSelectedPending = async (ids, clearSelection) => {
  if (!ids.length) return
  if (!confirm(`確定要儲存選取的 ${ids.length} 筆暫存題目嗎？`)) return
  let saved = 0
  try {
    for (const id of ids) {
      const q = pendingQuestions.value.find(p => p.id === id)
      if (!q) continue
      await questionStore.createQuestion({
        content: q.content,
        explanation: q.explanation || null,
        question_type: q.question_type || q.type || null,
        difficulty: q.difficulty || null,
        subject: q.subject || null,
        category: q.category || null,
        year: q.year || null,
        source: q.source || null,
        options: q.options || [],
        tag_ids: (q.tags || []).map(t => t.id).filter(Boolean)
      })
      saved++
    }
    pendingQuestions.value = pendingQuestions.value.filter(q => !ids.includes(q.id))
    clearSelection()
    alert(`已儲存 ${saved} 題至題庫`)
    if (activeTab.value === 'list') questionStore.search()
  } catch (err) {
    console.error('Batch save selected failed', err)
    alert(`儲存過程中發生錯誤，已儲存 ${saved} 題`)
  }
}

const savePendingQuestion = async (index) => {
  const q = pendingQuestions.value[index]
  try {
    await questionStore.createQuestion({
      content: q.content,
      explanation: q.explanation || null,
      question_type: q.question_type || q.type || null,
      difficulty: q.difficulty || null,
      subject: q.subject || null,
      category: q.category || null,
      year: q.year || null,
      source: q.source || null,
      options: q.options || [],
      tag_ids: (q.tags || []).map(t => t.id).filter(Boolean)
    })
    pendingQuestions.value.splice(index, 1)
    alert('題目已儲存至題庫')
    if (activeTab.value === 'list') questionStore.search()
  } catch (err) {
    console.error('Save pending question failed', err)
    alert('儲存失敗：' + (err.message || ''))
  }
}

const saveAllPending = async () => {
  if (!pendingQuestions.value.length) return
  if (!confirm(`確定要儲存所有 ${pendingQuestions.value.length} 筆暫存題目嗎？`)) return
  isSavingAll.value = true
  let saved = 0
  try {
    for (let i = pendingQuestions.value.length - 1; i >= 0; i--) {
      const q = pendingQuestions.value[i]
      await questionStore.createQuestion({
        content: q.content,
        explanation: q.explanation || null,
        question_type: q.question_type || q.type || null,
        difficulty: q.difficulty || null,
        subject: q.subject || null,
        category: q.category || null,
        year: q.year || null,
        source: q.source || null,
        options: q.options || [],
        tag_ids: (q.tags || []).map(t => t.id).filter(Boolean)
      })
      pendingQuestions.value.splice(i, 1)
      saved++
    }
    alert(`已儲存 ${saved} 題至題庫`)
  } catch (err) {
    console.error('Batch save failed', err)
    alert(`儲存過程中發生錯誤，已儲存 ${saved} 題`)
  } finally {
    isSavingAll.value = false
  }
}

const discardAllPending = () => {
  if (!confirm('確定要捨棄所有暫存題目嗎？此操作無法復原。')) return
  pendingQuestions.value = []
}

// ── Editor: open / close ──
const openCreateQuestion = () => {
  editorQuestion.value = null
  editingPendingIndex.value = null
  isEditorVisible.value = true
}

const openEditQuestion = async (id) => {
  try {
    isEditorVisible.value = true
    saving.value = false
    editorQuestion.value = null
    const data = await questionDetailStore.getQuestion(id)
    editorQuestion.value = data
  } catch (err) {
    console.error('Load question failed', err)
    alert('載入題目失敗')
    isEditorVisible.value = false
  }
}

const viewQuestion = (id) => openEditQuestion(id)

const editPendingQuestion = (index) => {
  editingPendingIndex.value = index
  const q = pendingQuestions.value[index]
  editorQuestion.value = { ...q }
  isEditorVisible.value = true
}

const closeEditor = () => {
  isEditorVisible.value = false
  editorQuestion.value = null
  saving.value = false
  editingPendingIndex.value = null
}

// ── Editor: save handlers ──
const toPendingQuestion = (data) => {
  pendingIdCounter++
  return {
  ...data,
  _pendingId: Date.now() + Math.random(),
  id: `pending-${Date.now()}-${pendingIdCounter}`,
  question_type: data.question_type || data.type || '',
  tagsText: (data.tags || []).map(t => t.name || t).join('、'),
  }
}

const handleEditorSave = async ({ questionData }) => {
  if (editingPendingIndex.value !== null) {
    pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
    alert('暫存題目已更新')
    closeEditor()
    return
  }
  try {
    saving.value = true
    if (editorQuestion.value?.id) {
      await questionStore.createQuestion({ ...questionData, id: undefined })
      questionDetailStore.setQuestion({ ...editorQuestion.value, ...questionData })
      alert('題目已更新')
    } else {
      await questionStore.createQuestion(questionData)
      alert('題目已建立')
    }
    closeEditor()
    questionStore.search()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗')
  } finally {
    saving.value = false
  }
}

const handleSaveDirectly = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSaveDirect()
}

const handleSaveToPending = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSavePending()
}

const handleSaveDirectlyFromEditor = async ({ questionData }) => {
  try {
    saving.value = true
    if (editingPendingIndex.value !== null) {
      pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
      alert('暫存題目已更新')
      closeEditor()
      return
    }
    await questionStore.createQuestion(questionData)
    alert('題目已建立')
    closeEditor()
    questionStore.search()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗：' + (err.message || ''))
  } finally {
    saving.value = false
  }
}

const handleSaveToPendingFromEditor = ({ questionData }) => {
  if (editingPendingIndex.value !== null) {
    pendingQuestions.value[editingPendingIndex.value] = toPendingQuestion(questionData)
    alert('暫存題目已更新')
  } else {
    addPendingQuestion(questionData)
    alert('已加入暫存')
  }
  closeEditor()
}

// ── Import modal ──
const openImportModal = () => { isImportVisible.value = true }
const handleImported = (importedQuestions) => {
  if (Array.isArray(importedQuestions)) {
    importedQuestions.forEach(q => addPendingQuestion(q))
  }
  isImportVisible.value = false
  questionStore.search()
}

// ── Load tags ──
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

// ── Lifecycle ──
onMounted(() => {
  questionStore.search()
  loadTags()
})

// ── Expose for parent ──
defineExpose({
  pendingQuestions,
  addPendingQuestion,
  fetchQuestions: () => questionStore.search(),
})
</script>

<style scoped>
.question-management-v2 {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ── Tab Container ── */
.tab-container {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: #FAFAFA;
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: normal;
  color: #7A7A7A;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #0D0D0D;
  background: rgba(0, 0, 0, 0.03);
}

.tab-btn.active {
  background: #FFFFFF;
  color: #0D0D0D;
  font-weight: 600;
  border: 1px solid #E8E8E8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
}

/* ── Filter Panel Wrapper ── */
.filter-wrapper {
  margin-top: -24px;
}

/* ── Header Action Buttons ── */
.header-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #E8E8E8;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #1E293B);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-action-btn:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}

.header-action-btn.primary {
  background: #476996;
  color: white;
  border-color: #476996;
}

.header-action-btn.primary:hover {
  background: #3b5a82;
}

.header-action-btn i {
  font-size: 14px;
}

/* ── Cell Content (two-line layout) ── */
.cell-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.content-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0D0D0D;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-meta {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #94A3B8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Type Badge ── */
.type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 6px;
  background: #F1F5F9;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

/* ── Difficulty Badges ── */
.difficulty-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
}

.difficulty-badge.easy {
  background: #DCFCE7;
  color: #15803D;
}

.difficulty-badge.normal {
  background: #FEF9C3;
  color: #A16207;
}

.difficulty-badge.hard {
  background: #FEE2E2;
  color: #DC2626;
}

.difficulty-badge.insane {
  background: #F3E8FF;
  color: #7C3AED;
}

/* ── Created Text ── */
.created-text {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #0D0D0D;
}

/* ── Row Actions ── */
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.row-actions .action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  background: transparent;
  color: #7A7A7A;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.row-actions .action-btn:hover {
  background: #F8FAFC;
  color: #1E293B;
  border-color: #94A3B8;
}

.row-actions .action-btn.danger:hover {
  background: #FEE2E2;
  color: #DC2626;
  border-color: #FCA5A5;
}

.row-actions .action-btn.save-btn {
  color: #476996;
}

.row-actions .action-btn.save-btn:hover {
  background: #EEF2FF;
  border-color: #476996;
}

.row-actions .action-btn i {
  font-size: 16px;
}

/* ── Unsaved Changes Bar ── */
.unsaved-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 24px;
  background: #FEF3C7;
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid #F59E0B;
  margin-bottom: -48px;
  position: relative;
  z-index: 1;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #FDE68A;
  font-size: 14px;
  color: #D97706;
}

.bar-msg {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
}

.bar-detail {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #B45309;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.bar-btn.outline {
  background: transparent;
  border: 1px solid #D97706;
  color: #92400E;
}

.bar-btn.outline:hover {
  background: #FDE68A;
}

.bar-btn.filled {
  background: #D97706;
  color: #FFFFFF;
  font-weight: 700;
}

.bar-btn.filled:hover {
  background: #B45309;
}

.bar-btn.filled:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Override TableList border-radius for pending tab ── */
.unsaved-bar+ :deep(.table-list) {
  border-radius: 0 0 12px 12px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .question-management-v2 {
    padding: 20px 16px;
    gap: 24px;
  }

  .page-title {
    font-size: 28px;
  }

  .unsaved-bar {
    flex-direction: column;
    height: auto;
    padding: 12px 16px;
    gap: 12px;
  }

  .bar-left {
    flex-wrap: wrap;
  }

  .bar-detail {
    display: none;
  }
}

/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 24px;
}

.modal-panel {
  background: #FFFFFF;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px 16px;
  border-bottom: 1px solid #E8E8E8;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title-row>i {
  font-size: 22px;
  color: #476996;
}

.modal-title {
  margin: 0;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #0D0D0D;
}

.modal-subtitle {
  margin: 2px 0 0;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #7A7A7A;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #7A7A7A;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #F1F3F5;
  color: #0D0D0D;
}

.modal-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.modal-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-top: 1px solid #E8E8E8;
  gap: 16px;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #7A7A7A;
}

.footer-info i {
  font-size: 14px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.footer-btn.secondary {
  background: #F1F3F5;
  color: #495057;
}

.footer-btn.secondary:hover {
  background: #DEE2E6;
}

.footer-btn.pending {
  background: #FEF3C7;
  color: #92400E;
}

.footer-btn.pending:hover {
  background: #FDE68A;
}

.footer-btn.primary {
  background: #476996;
  color: #FFFFFF;
}

.footer-btn.primary:hover {
  background: #3b5a82;
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
