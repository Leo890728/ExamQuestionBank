<template>
    <div class="exam-admin">
        <!-- Search Filter -->
        <div class="exam-filters">
            <div class="filter-search">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" class="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input v-model="searchTerm" type="text" class="filter-input" placeholder="搜尋考卷名稱或說明..." />
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ errorMessage }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>

        <!-- Exam List using TableList -->
        <TableList ref="tableListRef" :items="filteredExams" :loading="examStore.listLoading" :columns="examColumns"
            :draggable="false" :sort-key="sortKey" :sort-order="sortOrder" title="考卷列表"
            subtitle="管理所有考卷與發布狀態" item-unit="張考卷" empty-text="暫無符合條件的考卷"
            empty-hint="嘗試調整篩選條件或新增考卷" @sort-change="handleSortChange"
            @update:selected-ids="handleSelectionChange">
            <!-- Custom header icon -->
            <template #header-icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2">
                    </path>
                    <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                    <path d="M9 14l2 2 4-4"></path>
                </svg>
            </template>

            <!-- Header actions -->
            <template #header-actions>
                <button class="header-btn header-btn-primary" @click="addExam">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>新增考卷</span>
                </button>
                <button class="header-btn header-btn-outline" @click="batchImport">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>匯入</span>
                </button>
            </template>

            <!-- Question count cell -->
            <template #cell-questionCount="{ item }">
                <span class="question-count">{{ item.questionCount }}</span>
            </template>

            <!-- Time limit cell -->
            <template #cell-timeLimit="{ item }">
                <span>{{ item.timeLimit ? item.timeLimit + ' min' : '—' }}</span>
            </template>

            <!-- Publish status cell -->
            <template #cell-publish="{ item }">
                <span class="publish-badge" :class="item.publish ? 'published' : 'draft'">
                    {{ item.publish ? '已發布' : '草稿' }}
                </span>
            </template>

            <!-- Created at cell -->
            <template #cell-createdAt="{ item }">
                <span class="date-text">{{ item.createdAt }}</span>
            </template>

            <!-- Actions cell -->
            <template #cell-actions="{ item }">
                <div class="row-actions" @click.stop>
                    <button class="action-btn action-btn-view" @click="viewExam(item.id)" title="檢視">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="action-btn action-btn-edit" @click="editExam(item.id)" title="編輯">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn action-btn-delete" @click="deleteExam(item.id)" title="刪除"
                        :disabled="deletingExamId === item.id">
                        <div v-if="deletingExamId === item.id" class="action-spinner"></div>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                            </path>
                        </svg>
                    </button>
                    <!-- More actions dropdown (Bootstrap) -->
                    <div class="dropdown">
                        <button class="action-btn action-btn-more" v-bs-dropdown
                            data-bs-toggle="dropdown" title="更多">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item" @click="exportExam(item.id)"
                                    :disabled="exportingExams[item.id]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    <span>{{ exportingExams[item.id] ? '匯出中...' : '匯出 JSON' }}</span>
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item" @click="printExam(item.id)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                        <path
                                            d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2">
                                        </path>
                                        <rect x="6" y="14" width="12" height="8"></rect>
                                    </svg>
                                    <span>列印考卷</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </template>

            <!-- Custom selection toolbar actions -->
            <template #selection-actions="{ selectedIds, clearSelection }">
                <button class="toolbar-btn toolbar-btn-primary" @click="exportSelectedExams" :disabled="isExporting">
                    <svg v-if="!isExporting" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <div v-else class="toolbar-spinner"></div>
                    <span>{{ isExporting ? '匯出中...' : '匯出' }}</span>
                </button>
                <div class="toolbar-divider"></div>
                <button class="toolbar-btn toolbar-btn-danger" @click="deleteSelectedExams"
                    :disabled="isDeletingSelected">
                    <div v-if="isDeletingSelected" class="toolbar-spinner"></div>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                        </path>
                    </svg>
                    <span>{{ isDeletingSelected ? '刪除中...' : '刪除' }}</span>
                </button>
            </template>
        </TableList>

        <ExamDetailModal :visible="isExamDetailVisible" :exam="selectedExamDetail" :loading="isExamDetailLoading"
            :error="examDetailError" @close="closeExamDetail" />

        <!-- Hidden file input for import -->
        <input ref="jsonImportInput" type="file" accept="application/json" style="display:none"
            @change="handleImportFile" />
    </div>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import ExamDetailModal from '@/components/ExamDetailModal.vue'
import { usePdfImportStore } from '@/stores/pdfImport'
import { useExamStore } from '@/stores/test/exam'
import { examApi } from '@/api/test/exam'
import { Dropdown } from 'bootstrap'
import TableList from '@/components/common/TableList.vue'

// Directive: init Bootstrap Dropdown with fixed Popper strategy
const vBsDropdown = {
    mounted(el) {
        new Dropdown(el, {
            popperConfig(defaultConfig) {
                return { ...defaultConfig, strategy: 'fixed' }
            }
        })
    },
    beforeUnmount(el) {
        Dropdown.getInstance(el)?.dispose()
    }
}

const errorMessage = ref('')
const searchTerm = ref('')
const sortKey = ref('createdAt')
const sortOrder = ref('desc')
const selectedExamDetail = ref(null)
const isExamDetailVisible = ref(false)
const isExamDetailLoading = ref(false)
const examDetailError = ref('')
const deletingExamId = ref(null)
const isExporting = ref(false)
const exportingExams = reactive({})
const selectedExamIds = ref([])
const isDeletingSelected = ref(false)
const jsonImportInput = ref(null)
const tableListRef = ref(null)


const router = useRouter()
const examStore = useExamStore()
const pdfImportStore = usePdfImportStore()

const examColumns = [
    { key: 'id', label: 'ID', width: '44px', sortable: true },
    { key: 'name', label: '名稱', width: '1.5fr', sortable: true },
    { key: 'description', label: '描述', width: '2fr' },
    { key: 'questionCount', label: '題數', width: '44px', align: 'center', sortable: true },
    { key: 'timeLimit', label: '時限', width: '56px', align: 'center' },
    { key: 'publish', label: '狀態', width: '62px', align: 'center', sortable: true },
    { key: 'createdAt', label: '建立', width: '84px', sortable: true },
    { key: 'actions', label: '操作', width: '140px', align: 'center' }
]

const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date)
}

const normalizeExam = (exam) => ({
    id: exam.id,
    name: exam.name,
    description: exam.description || '—',
    questionCount: exam.question_count ?? 0,
    timeLimit: exam.time_limit ?? null,
    publish: exam.publish ?? false,
    createdAt: formatDateTime(exam.created_at),
    updatedAt: formatDateTime(exam.updated_at),
    _raw: exam
})

// Map camelCase column keys to raw snake_case field names
const sortKeyMap = {
    id: 'id',
    name: 'name',
    questionCount: 'question_count',
    publish: 'publish',
    createdAt: 'created_at',
}

const handleSortChange = ({ key, order }) => {
    sortKey.value = key
    sortOrder.value = order
}

const sortedExams = computed(() => {
    const list = [...examStore.exams].map(normalizeExam)
    if (!sortKey.value) return list
    const rawKey = sortKeyMap[sortKey.value] || sortKey.value
    list.sort((a, b) => {
        const av = a._raw[rawKey] ?? ''
        const bv = b._raw[rawKey] ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortOrder.value === 'asc' ? cmp : -cmp
    })
    return list
})

const filteredExams = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()
    if (!term) return sortedExams.value
    return sortedExams.value.filter((exam) => {
        const haystack = [exam.name, exam.description, exam.questionCount?.toString(), exam.timeLimit?.toString(),
        exam.createdAt, exam.id?.toString()].filter(Boolean).map((v) => v.toLowerCase()).join(' ')
        return haystack.includes(term)
    })
})

const handleSelectionChange = (ids) => {
    selectedExamIds.value = ids
}


const fetchExams = async () => {
    errorMessage.value = ''
    try {
        await examStore.loadExams()
    } catch (error) {
        console.error('Failed to fetch exams', error)
        errorMessage.value = error.message || '取得考卷列表失敗，請稍後再試。'
    }
}

const normalizeExamDetail = (exam) => ({
    id: exam.id, name: exam.name, description: exam.description || '—', timeLimit: exam.time_limit ?? null,
    createdAt: formatDateTime(exam.created_at), updatedAt: formatDateTime(exam.updated_at),
    examQuestions: (exam.questions ?? []).map((q, i) => ({
        id: q.id ?? i, order: q.order ?? i + 1, points: q.points ?? null,
        questionContent: q.content || '—', questionSubject: '', questionCategory: ''
    }))
})

const viewExam = async (id) => {
    isExamDetailVisible.value = true; isExamDetailLoading.value = true; examDetailError.value = ''; selectedExamDetail.value = null
    try {
        const data = await examApi.getExamDetail(id)
        selectedExamDetail.value = normalizeExamDetail(data)
    } catch (error) {
        examDetailError.value = error.message || '無法取得考卷詳細資訊。'
    } finally { isExamDetailLoading.value = false }
}

const closeExamDetail = () => { isExamDetailVisible.value = false; selectedExamDetail.value = null; examDetailError.value = '' }
const editExam = (id) => { router.push(`/admin/exams/${id}/edit`) }
const addExam = () => { pdfImportStore.clearPayload(); router.push('/admin/exams/new') }
const batchImport = () => { if (jsonImportInput.value) jsonImportInput.value.click() }

const deleteExam = async (id) => {
    if (!confirm('確定要刪除此考卷嗎？')) return
    deletingExamId.value = id
    try {
        await examStore.deleteExam(id)
        alert('考卷已刪除')
    } catch (error) {
        alert(error.message || '刪除考卷失敗，請稍後再試。')
    } finally { deletingExamId.value = null }
}

const deleteSelectedExams = async () => {
    if (selectedExamIds.value.length === 0) return
    if (!confirm(`確定要刪除選取的 ${selectedExamIds.value.length} 張考卷嗎？`)) return
    isDeletingSelected.value = true
    let successCount = 0, failCount = 0
    for (const id of [...selectedExamIds.value]) {
        try {
            await examStore.deleteExam(id)
            successCount++
        } catch { failCount++ }
    }
    isDeletingSelected.value = false
    alert(failCount === 0 ? `成功刪除 ${successCount} 張考卷` : `刪除完成：成功 ${successCount} 張，失敗 ${failCount} 張`)
    if (tableListRef.value) {
        tableListRef.value.clearSelection()
    }
}

const exportExam = async (examId) => {
    if (exportingExams[examId]) return
    exportingExams[examId] = true
    try {
        const data = await examApi.getExamDetail(examId)
        const exportItem = { id: data.id, name: data.name, description: data.description, time_limit: data.time_limit, questions: [] }
        if (Array.isArray(data.questions)) {
            for (const q of data.questions) {
                exportItem.questions.push({ question_id: q.id, order: q.order, points: q.points })
            }
        }
        const blob = new Blob([JSON.stringify(exportItem, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `exam_${exportItem.id || 'export'}.json`
        document.body.appendChild(a); a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href) }, 100)
    } catch (error) { alert('匯出考卷失敗') }
    finally { exportingExams[examId] = false }
}

const exportSelectedExams = async () => {
    if (selectedExamIds.value.length === 0 || isExporting.value) return
    isExporting.value = true
    try {
        const exportData = []
        for (const examId of selectedExamIds.value) {
            try {
                const data = await examApi.getExamDetail(examId)
                const questions = (data.questions || []).map(q => ({ question_id: q.id, order: q.order, points: q.points }))
                exportData.push({ id: data.id, name: data.name, description: data.description, time_limit: data.time_limit, questions })
            } catch { }
        }
        if (exportData.length === 0) { alert('沒有可匯出的考卷'); return }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `selected_exams_${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}.json`
        document.body.appendChild(a); a.click()
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href) }, 100)
        alert(`成功匯出 ${exportData.length} 張考卷`)
    } catch { alert('批量匯出失敗') }
    finally { isExporting.value = false }
}

const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
            if (!item.name) continue
            const newExam = await examStore.createExam({
                name: item.name, description: item.description || '', time_limit: item.time_limit || null
            })
            if (newExam?.id && Array.isArray(item.exam_questions || item.questions)) {
                for (const eq of (item.exam_questions || item.questions)) {
                    const qId = eq.question_id || eq.id
                    if (qId) {
                        try {
                            await examApi.addExamQuestion(newExam.id, {
                                question_id: qId, order: eq.order ?? 1, points: eq.points ?? 1
                            })
                        } catch { }
                    }
                }
            }
        }
        alert('匯入完成')
        await fetchExams()
    } catch (error) { alert('匯入失敗：' + (error.message || '格式錯誤')) }
    finally { event.target.value = '' }
}

const printExam = (examId) => {
    const printUrl = router.resolve({ path: `/admin/exams/${examId}/print` }).href
    window.open(printUrl, '_blank')
}

defineExpose({ fetchExams, addExam, batchImport })
onMounted(() => { fetchExams() })
</script>

<style scoped>
/* Filters */
.exam-filters {
    margin-bottom: 24px;
}

.filter-search {
    position: relative;
}

.search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #64748B);
    pointer-events: none;
}

.filter-input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.2s ease;
    background: #f9fafb;
}

.filter-input:focus {
    outline: none;
    border-color: var(--primary, #476996);
    background: white;
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

/* Header Buttons */
.header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    white-space: nowrap;
}

.header-btn-primary {
    background: var(--primary, #476996);
    color: white;
}

.header-btn-primary:hover {
    background: var(--primary-hover, #35527a);
}

.header-btn-outline {
    background: white;
    color: var(--text-primary, #1E293B);
    border: 2px solid var(--border, #E2E8F0);
}

.header-btn-outline:hover {
    border-color: var(--text-secondary, #94A3B8);
    background: var(--bg-page, #F8FAFC);
}

/* Cell Styles */
.question-count {
    font-weight: 600;
    color: var(--primary, #476996);
}

.publish-badge {
    display: inline-flex;
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
}

.publish-badge.published {
    background: #A7F3D0;
    color: #065F46;
}

.publish-badge.draft {
    background: #FCD34D;
    color: #92400E;
}

.date-text {
    font-size: 12px;
    color: var(--text-muted, #94A3B8);
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

/* More Actions Dropdown (Bootstrap) */
.action-btn-more {
    color: var(--text-secondary, #64748B);
}

.action-btn-more:hover {
    background: #F3F4F6;
}

.row-actions :deep(.dropdown-menu) {
    min-width: 150px;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border, #E2E8F0);
    padding: 4px 0;
}

.row-actions :deep(.dropdown-item) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text-primary, #1E293B);
}

.row-actions :deep(.dropdown-item:hover) {
    background-color: var(--bg-page, #F1F5F9);
    color: var(--text-primary, #1E293B);
}

.row-actions :deep(.dropdown-item:disabled) {
    opacity: 0.5;
}

.row-actions :deep(.dropdown-item svg) {
    color: var(--text-secondary, #64748B);
    flex-shrink: 0;
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

/* Action spinner for loading states */
.action-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-top-color: var(--text-secondary, #64748B);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Dark mode for dropdown */
:global(.dark) .row-actions .dropdown-menu {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .row-actions .dropdown-item:hover {
    background-color: var(--surface-muted) !important;
}
</style>
