<template>
    <div class="exam-design-page">
        <!-- Header -->
        <header class="page-header" :class="{ 'has-changes': hasChanges }">
            <div class="header-left">
                <span v-if="hasChanges" class="unsaved-icon">⚠</span>
                <h1 class="page-title">{{ examInfo?.id ? "Edit Exam" : "Create New Exam" }}</h1>
                <template v-if="hasChanges">
                    <span class="unsaved-sep">·</span>
                    <span class="unsaved-detail">{{ unsavedSummary }}</span>
                </template>
            </div>
            <div v-if="hasChanges" class="header-right">
                <button class="unsaved-btn-discard" @click="handleDiscard">捨棄</button>
                <button class="unsaved-btn-save" @click="handleSave" :disabled="isSaving">
                    {{ isSaving ? '儲存中...' : '儲存' }}
                </button>
            </div>
        </header>

        <!-- Content Area -->
        <main class="content-area">
            <!-- Left Panel -->
            <aside class="left-panel">
                <!-- Exam Info Card -->
                <section class="card info-card">
                    <div class="card-header info-header">
                        <div class="info-icon"></div>
                        <h2 class="info-title">Exam Information</h2>
                    </div>
                    <div v-if="examInfo" class="card-body form-body">
                        <div class="form-group name-group">
                            <label>Exam Name</label>
                            <input type="text" v-model="examInfo.name" placeholder="Enter exam name" />
                        </div>
                        <div class="form-group desc-group">
                            <label>Description</label>
                            <textarea v-model="examInfo.description" placeholder="Enter description"></textarea>
                        </div>
                        <div class="form-group time-group">
                            <label>Time Limit</label>
                            <input type="number" v-model="examInfo.time_limit" placeholder="Minutes" />
                        </div>
                    </div>
                </section>

                <!-- Stats Card -->
                <section class="card stats-card">
                    <div class="card-header stats-header">
                        <h2 class="stats-title">Statistics</h2>
                    </div>
                    <div class="card-body stats-body">
                        <div class="counters">
                            <div class="counter-item">
                                <span class="count">{{ statTotalQuestions }}</span>
                                <span class="label">Questions</span>
                            </div>
                            <div class="counter-item">
                                <span class="count">{{ statTotalScore }}</span>
                                <span class="label">Total Score</span>
                            </div>
                        </div>
                    </div>
                    <div class="chart-container">
                        <Pie id="statsChart" :data="questionDifficultyChartData" :options="chartOptions"></Pie>
                    </div>
                </section>
            </aside>

            <!-- Right Panel -->
            <section class="right-panel">
                <div ref="tabBarSentinel" class="sentinel"></div>
                <!-- Tab Bar -->
                <div class="tab-bar" :class="{ 'is-sticky': isTabBarSticky }">
                    <div class="tab-group">
                        <button class="tab-item" :class="{ active: activeTab === 'questions' }"
                            @click="activeTab = 'questions'">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                            </svg>
                            考卷題目
                            <span class="tab-badge">{{ examQuestions.length }}</span>
                        </button>
                        <button class="tab-item" :class="{ active: activeTab === 'search' }"
                            @click="activeTab = 'search'">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                            搜尋題庫
                        </button>
                    </div>
                </div>

                <!-- 考卷題目 Tab -->
                <template v-if="activeTab === 'questions'">
                    <div class="toolbar">
                        <div class="filter-row">
                            <input type="text" class="search-box" placeholder="搜尋題目..." v-model="filterContent" />
                            <select class="filter-select" v-model="filterType">
                                <option value="All Types">所有題型</option>
                                <option v-for="type in QuestionTypeList" :value="type">{{ type }}</option>
                            </select>
                            <select class="filter-select" v-model="filterDifficulty">
                                <option value="All Difficulty">所有難度</option>
                                <option v-for="difficulty in QuestionDifficultyList" :value="difficulty">{{ difficulty
                                    }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <TableList :showHeader="false" :emptyText="'暫無題目'" :itemUnit="'題'" :items="filterQuestions()"
                        :columns="tableColumns" :row-class="getRowClass" :draggable="true" :showPagination="true"
                        :sort-key="sortKey" :sort-order="sortOrder" @sort-change="handleSortChange"
                        @reorder="handleReorder">
                        <template #cell-content="{ item }">
                            <div class="col-content">
                                <div class="q-text">{{ item.content }}</div>
                                <div class="q-meta" v-if="item.category && item.subject">{{ item.category }} •
                                    {{ item.subject }}</div>
                            </div>
                        </template>
                        <template #cell-type="{ item }">
                            <div class="col-type">
                                <span class="badge-default">{{ item.type === 'multipleChoice' ? 'MCQ'
                                    : 'Essay' }}</span>
                            </div>
                        </template>
                        <template #cell-difficulty="{ item }">
                            <div class="col-diff">
                                <span :class="'badge-' + item.difficulty">{{ item.difficulty }}</span>
                            </div>
                        </template>
                        <template #cell-points="{ item }">
                            <input class="score-input" type="number" :value="item.points"
                                @change="handUpdateScore(item.id, $event)" @click.stop @mousedown.stop />
                        </template>
                        <template #cell-actions="{ item }">
                            <div class="col-actions">
                                <button class="action-btn danger" title="移除題目"
                                    @click.stop="handleToggleAddQuestion(item)">
                                    <i class="bi bi-trash3"></i>
                                </button>
                            </div>
                        </template>
                        <template #selection-actions="{ selectedIds, clearSelection }">
                            <button class="btn-warning btn-sm" @click="openBatchScore(selectedIds)">
                                批次修改分數
                            </button>
                            <button class="btn-danger btn-sm"
                                @click="handleBulkRemoveFromExam(selectedIds, clearSelection)">
                                刪除題目
                            </button>
                        </template>
                    </TableList>
                </template>

                <!-- 搜尋題庫 Tab -->
                <template v-if="activeTab === 'search'">
                    <QuestionFilterPanel v-model="searchFilters" :loading="searchLoading"
                        :total-count="searchTotalCount" :collapsible="true" :default-collapsed="false" title="篩選條件"
                        @search="handleSearch" @reset="handleResetSearch" />

                    <ItemList :items="searchResults" :loading="searchLoading" :show-header="false" :selectable="true"
                        :show-select-all="true" item-unit="題" empty-text="尚無搜尋結果" empty-hint="請使用上方篩選條件搜尋題目"
                        content-field="content" :show-pagination="true" :page-size="searchPageSize"
                        :current-page="searchCurrentPage" :paginationState="searchPaginationState"
                        @update:selected-ids="handleSearchSelectedIdsChange" @item-click="handleSearchItemClick"
                        @page-change="handleSearchPageChange" @size-change="handleSearchPageSizeChange">
                        <template #item-badges="{ item }">
                            <span class="badge badge-subject">{{ item.subject || '未分類' }}</span>
                            <span class="badge" :class="'badge-' + item.difficulty">
                                {{ difficultyLabel(item.difficulty) }}
                            </span>
                            <span v-for="tag in (item.tags || []).slice(0, 2)" :key="tag.id" class="badge badge-tag">
                                {{ tag.name }}
                            </span>
                            <span v-if="(item.tags || []).length > 2" class="badge badge-more">
                                +{{ item.tags.length - 2 }}
                            </span>
                        </template>
                        <template #item-actions="{ item }">
                            <button class="action-btn" title="檢視" @click.stop="handlePreviewQuestion(item)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                            <button class="action-btn action-btn-add" :class="{ added: isQuestionInExam(item) }"
                                :title="isQuestionInExam(item) ? '已加入' : '加入考卷'"
                                @click.stop="handleToggleAddQuestion(item)">
                                <svg v-if="!isQuestionInExam(item)" xmlns="http://www.w3.org/2000/svg" width="16"
                                    height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M5 12h14" />
                                    <path d="M12 5v14" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </button>
                        </template>
                        <template #selection-actions="{ selectedIds, clearSelection }">
                            <button class="btn-primary btn-sm"
                                @click="handleBulkAddToExam(selectedIds, clearSelection)">
                                加入考卷
                            </button>
                        </template>
                    </ItemList>
                </template>
            </section>
        </main>
    </div>

    <!-- Question Preview Modal -->
    <Teleport to="body">
        <QuestionPreviewModal :visible="showPreviewModal" :question="previewQuestion"
            :is-in-exam="previewQuestion ? isQuestionInExam(previewQuestion) : false" @close="showPreviewModal = false"
            @add="handleAddPreviewedQuestion" />
    </Teleport>

    <!-- Batch Score Editor Modal -->
    <Teleport to="body">
        <BatchScoreEditor v-if="showBatchScore" :questions="batchScoreQuestions" :exam-total-score="statTotalScore"
            @close="showBatchScore = false" @applied="handleBatchScoreApplied" />
    </Teleport>

    <!-- Leave Page Modal -->
    <Teleport to="body">
        <div v-if="showLeaveModal" class="modal-overlay" @click.self="cancelLeave">
            <div class="modal-card">
                <!-- Header -->
                <div class="modal-header">
                    <div class="modal-icon">⚠</div>
                    <h3 class="modal-title">離開頁面？</h3>
                    <p class="modal-desc">您有未儲存的變更，離開後將會遺失。</p>
                </div>
                <!-- Body -->
                <div class="modal-body">
                    <div class="modal-summary">
                        <span class="summary-title">未儲存的變更：</span>
                        <div v-if="questionChanges.addedQuestions.length" class="summary-row">
                            <span class="summary-dot added"></span>
                            新增 {{ questionChanges.addedQuestions.length }} 題
                        </div>
                        <div v-if="questionChanges.removedQuestions.length" class="summary-row">
                            <span class="summary-dot removed"></span>
                            移除 {{ questionChanges.removedQuestions.length }} 題
                        </div>
                        <div v-if="questionChanges.orderChanged.length" class="summary-row">
                            <span class="summary-dot modified"></span>
                            {{ questionChanges.orderChanged.length }} 題順序變更
                        </div>
                    </div>
                </div>
                <!-- Footer -->
                <div class="modal-footer">
                    <button class="modal-btn-save" @click="saveAndLeave">儲存並離開</button>
                    <button class="modal-btn-discard" @click="discardAndLeave">不儲存，直接離開</button>
                    <button class="modal-btn-cancel" @click="cancelLeave">取消</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { Pie } from "vue-chartjs"
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';

import { useExamStore } from '@/stores/test/exam';
import { useQuestionStore } from '@/stores/test/question';
import { QuestionDifficultyList, QuestionTypeList } from '@/models/Question'

import TableList from '@/components/common/TableList.vue'
import ItemList from '@/components/common/ItemList.vue'
import QuestionFilterPanel from '@/components/common/QuestionFilterPanel.vue'
import QuestionPreviewModal from '@/components/QuestionPreviewModal.vue'
import BatchScoreEditor from '@/components/BatchScoreEditor.vue'

import { useSticky } from '@/composables/useSticky'

import "@/styles/main.scss";

// ChartJS
ChartJS.register(Title, Tooltip, Legend, ArcElement);

// Route
const route = useRoute();
const router = useRouter();

// Store
const examStore = useExamStore();
const questionStore = useQuestionStore();

const {
    examInfo, examQuestions,
    hasChanges, questionChanges, unsavedSummary
} = storeToRefs(examStore)

const questionDifficultyChartData = computed(() => {
    const qs = examQuestions.value || []
    const easyCount = qs.filter(q => q.difficulty === 'easy').length;
    const mediumCount = qs.filter(q => q.difficulty === 'normal').length;
    const hardCount = qs.filter(q => q.difficulty === 'hard').length;
    const insaneCount = qs.filter(q => q.difficulty === 'insane').length;

    const mcqCount = qs.filter(q => q.type === 'multipleChoice').length
    const essayCount = qs.filter(q => q.type !== 'multipleChoice').length

    if (!qs.length) {
        return {
            datasets: [
                {
                    label: '暫無題目',
                    data: [1],
                    backgroundColor: ['#e5e7eb'],
                    weight: 1,
                }
            ]
        }
    }

    return {
        labels: ['簡單', '普通', '困難', '極難'],
        datasets: [
            // 內圈 - 難度分佈
            {
                label: '難度分佈',
                data: [easyCount, mediumCount, hardCount, insaneCount],
                backgroundColor: ['#dcfce7', '#dbeafe', '#ffedd5', '#fee2e2'],
                weight: 1,
            },
            // 外圈 - 題型分佈
            {
                label: '題型分佈',
                data: [mcqCount, essayCount],
                backgroundColor: ['#476996', '#94a3b8'],
                weight: 1,
            }
        ],
    };
});

const datasetLabels = [
    ['簡單', '普通', '困難', '極難'],
    ['選擇題', '問答題'],
]

const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                generateLabels: (chart) => {
                    const datasets = chart.data.datasets
                    if (!datasets.length) return []
                    if (!examQuestions.value.length) return []
                    const items = []
                    datasets.forEach((ds, di) => {
                        const labels = datasetLabels[di] || []
                        labels.forEach((label, i) => {
                            const meta = chart.getDatasetMeta(di)
                            const hidden = meta.data[i] ? meta.data[i].hidden : false
                            items.push({
                                text: label,
                                fillStyle: ds.backgroundColor[i],
                                strokeStyle: ds.backgroundColor[i],
                                hidden,
                                datasetIndex: di,
                                index: i,
                            })
                        })
                    })
                    return items
                },
            },
            onClick: (_e, legendItem, legend) => {
                const { datasetIndex, index } = legendItem
                const meta = legend.chart.getDatasetMeta(datasetIndex)
                const item = meta.data[index]
                if (item) {
                    item.hidden = !item.hidden
                    legend.chart.update()
                }
            },
        },
        tooltip: {
            callbacks: {
                title: (items) => {
                    if (!items.length) return ''
                    const { datasetIndex, dataIndex } = items[0]
                    return !examQuestions.value.length ? '' : datasetLabels[datasetIndex]?.[dataIndex] || ''
                },
                label: (ctx) => {
                    const label = datasetLabels[ctx.datasetIndex]?.[ctx.dataIndex] || ''
                    const value = ctx.raw || 0
                    return !examQuestions.value.length ? ' 暫無題目' : ` ${label}: ${value} 題`
                }
            }
        }
    },
    cutout: '30%',
}

// Tab - 題庫 / 搜尋
const activeTab = ref('questions')
const tabBarSentinel = ref(null)
const { isSticky: isTabBarSticky } = useSticky(tabBarSentinel)

// Filters
const filterContent = ref('');
const filterType = ref('All Types');
const filterDifficulty = ref('All Difficulty');

// Search tab state
const searchFilters = ref({
    category: '',
    subject: '',
    difficulty: '',
    question_type: '',
    search: '',
    tags: [],
    tag_mode: 'or'
})
const {
    questions: searchResults,
    loading: searchLoading,
    totalCount: searchTotalCount,
    page: searchCurrentPage,
    pageSize: searchPageSize,
    paginationState: searchPaginationState
} = storeToRefs(questionStore)
const searchSelectedIds = ref([])

const difficultyLabel = (d) => {
    const map = { easy: '簡單', normal: '普通', hard: '困難', insane: '極難' }
    return map[d] || d || '未知'
}

const handleSearch = async () => {
    const f = searchFilters.value
    questionStore.setFilters({
        subject: f.subject || null,
        difficulty: f.difficulty || null,
        type: f.question_type || null,
        keyword: f.search || null,
        category: f.category || null,
        tag_ids: f.tags?.length ? f.tags.map(t => t.id ?? t) : null,
        tag_mode: f.tag_mode || 'or',
    })
    await questionStore.search()
}
const handleSearchPageChange = (page) => questionStore.goToPage(page)
const handleSearchPageSizeChange = (size) => questionStore.setPageSize(size)
const handleResetSearch = () => questionStore.resetFilters()
const handleSearchSelectedIdsChange = (ids) => { searchSelectedIds.value = ids }
const handleSearchItemClick = (item) => { handlePreviewQuestion(item) }

// --- Question Preview Modal ---
const showPreviewModal = ref(false)
const previewQuestion = ref(null)

const handlePreviewQuestion = (item) => {
    previewQuestion.value = item
    showPreviewModal.value = true
}

const handleAddPreviewedQuestion = (question) => {
    if (!isQuestionInExam(question)) {
        examStore.addQuestion(question)
    }
}
const isQuestionInExam = (item) => {
    return (examQuestions.value || []).some(q => q.id == item.id)
}
const handleToggleAddQuestion = (item) => {
    if (isQuestionInExam(item)) {
        examStore.removeQuestion(item.id)
    } else {
        examStore.addQuestion(item)
    }
}
const handleBulkAddToExam = (selectedIds, clearSelection) => {
    selectedIds.forEach(id => {
        const question = searchResults.value.find(q => q.id === id)
        if (question && !isQuestionInExam(question)) {
            examStore.addQuestion(question)
        }
    })
    clearSelection()
}
const handleBulkRemoveFromExam = (selectedIds, clearSelection) => {
    selectedIds.forEach(id => {
        const question = examQuestions.value.find(q => q.id === id)
        if (question) {
            examStore.removeQuestion(question.id)
        }
    })
    clearSelection()
}

// ---- Batch Score ----
const showBatchScore = ref(false)
const batchScoreQuestions = ref([])

const openBatchScore = (selectedIds) => {
    batchScoreQuestions.value = examQuestions.value.filter(q => selectedIds.includes(q.id))
    showBatchScore.value = true
}

const handleBatchScoreApplied = ({ points, questionIds }) => {
    questionIds.forEach(id => examStore.updateQuestionPoints(id, points))
    showBatchScore.value = false
}

function filterQuestions() {
    let questions = sortedQuestions.value;
    if (filterContent.value) {
        questions = questions.filter(question => question.content.toLowerCase().includes(filterContent.value.toLowerCase()));
    }
    if (filterType.value != "All Types") {
        questions = questions.filter(question => question.type == filterType.value);
    }
    if (filterDifficulty.value != "All Difficulty") {
        questions = questions.filter(question => question.difficulty == filterDifficulty.value);
    }
    return questions;
}

// Sorting
const sortKey = ref('');
const sortOrder = ref('');

const handleSortChange = ({ key, order }) => {
    sortKey.value = key
    sortOrder.value = order
}

const sortedQuestions = computed(() => {
    if (!sortKey.value) return examQuestions.value
    return [...examQuestions.value].sort((a, b) => {
        const aVal = a[sortKey.value]
        const bVal = b[sortKey.value]
        if (aVal == null || bVal == null) return 0
        const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
        return sortOrder.value === 'asc' ? cmp : -cmp
    })
});

// Reorder
const handleReorder = (change) => {
    examStore.reorderQuestions(change.fromIndex, change.toIndex)
}

// Table Columns
const tableColumns = ref([
    { key: 'order', label: '#', width: '2%', align: 'center', sortable: true },
    { key: 'content', label: 'Question Content', width: '70%', sortable: true },
    { key: 'type', label: 'Type', width: '5%', align: 'center', sortable: true },
    { key: 'difficulty', label: 'Difficulty', width: '5%', align: 'center', sortable: true },
    { key: 'points', label: 'Score', width: '5%', align: 'center', sortable: true },
    { key: 'actions', label: 'Actions', width: '5%', align: 'center' }
]);

// Stats
const statTotalQuestions = computed(() => (examQuestions.value || []).length);
const statTotalScore = computed(() => (examQuestions.value || []).reduce((total, q) => total + q.points, 0));

// Methods
onMounted(async () => {
    const examId = route.params.id ? Number(route.params.id) : null;
    if (examId) {
        try {
            await examStore.loadExam(examId);
        } catch (error) {
            console.log("Error fetching exam:", error);
        }
    } else {
        examStore.initNewExam();
    }
});

const handUpdateScore = (id, event) => {
    const points = Number(event.target.value)
    if (points >= 0) {
        examStore.updateQuestionPoints(id, points)
    } else {
        const q = (examQuestions.value || []).find(q => q.id === id)
        if (q) event.target.value = q.points
    }
}

const handleDiscard = () => {
    examStore.discardChanges()
}

const isSaving = ref(false)

const handleSave = async () => {
    if (!hasChanges.value || isSaving.value) return
    isSaving.value = true
    try {
        const isNew = !route.params.id
        const eid = await examStore.saveExam()
        if (isNew && eid) {
            router.replace(`/admin/exams/${eid}/edit`)
        }
    } catch (err) {
        console.error('Save failed:', err)
        alert('儲存失敗：' + (err.message || '未知錯誤'))
    } finally {
        isSaving.value = false
    }
}

// --- Leave Page Guard ---
const showLeaveModal = ref(false)
let resolveLeaveGuard = null

onBeforeRouteLeave((to, from, next) => {
    if (!hasChanges.value) {
        next()
        return
    }
    showLeaveModal.value = true
    resolveLeaveGuard = next
})

const saveAndLeave = async () => {
    await handleSave()
    showLeaveModal.value = false
    resolveLeaveGuard?.()
}

const discardAndLeave = () => {
    showLeaveModal.value = false
    resolveLeaveGuard?.()
}

const cancelLeave = () => {
    showLeaveModal.value = false
    resolveLeaveGuard?.(false)
}

// Browser tab close / refresh
const beforeUnloadHandler = (e) => {
    if (hasChanges.value) {
        e.preventDefault()
        e.returnValue = ''
    }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

const getRowClass = (item) => {
    const c = questionChanges.value
    if (c.addedQuestions.some(q => q.id === item.id)) return 'row-added'
    if (c.removedQuestions.some(q => q.id === item.id)) return 'row-removed'
    if (c.orderChanged.some(q => q.id === item.id)) return 'row-modified'
    if (c.scoreChanged.some(q => q.id === item.id)) return 'row-modified'
    return ''
}
</script>

<style scoped>
/* Reset & Base */
* {
    box-sizing: border-box;
}

.exam-design-page {
    width: 100%;
    min-height: 100vh;
    background-color: #f8fafc;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
}

/* Header */
.page-header {
    height: 50px;
    background-color: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    position: sticky;
    top: 50px;
    z-index: 100;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    transition: background-color 0.3s, border-color 0.3s;
}

.page-header.has-changes {
    background-color: #FEF3C7;
    border-bottom: 2px solid #F59E0B;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.page-header.has-changes .page-title {
    font-size: 16px;
    color: #92400E;
}

.unsaved-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.unsaved-sep {
    font-size: 16px;
    color: #B45309;
}

.unsaved-detail {
    font-size: 13px;
    color: #B45309;
    white-space: nowrap;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.unsaved-btn-discard {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #D97706;
    background: transparent;
    color: #92400E;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.unsaved-btn-discard:hover {
    background: #FDE68A;
}

.unsaved-btn-save {
    padding: 4px 10px;
    border-radius: 4px;
    border: none;
    background: #D97706;
    color: white;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.unsaved-btn-save:hover {
    background: #B45309;
}

.breadcrumb {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 2px;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

/* Content Area */
.content-area {
    flex: 1;
    padding: 24px;
    display: flex;
    gap: 24px;
}

/* Left Panel */
.left-panel {
    width: 400px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.card {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    /* For rounded corners with header */
    display: flex;
    flex-direction: column;
}

/* Info Card */
.info-header {
    height: 50px;
    background-color: white;
    padding: 0 20px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
}

.info-icon {
    display: none;
}

.info-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.form-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
}

.form-group input,
.form-group textarea {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    color: #334155;
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
}

.btn-primary {
    background-color: #476996;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.btn-secondary {
    background-color: white;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

/* Stats Card */
.stats-header {
    height: 50px;
    background-color: white;
    padding: 0 20px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #f1f5f9;
}

.stats-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.stats-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.counters {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.counter-item {
    flex: 1;
    background-color: #f8fafc;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.count {
    font-size: 20px;
    font-weight: 700;
    color: #476996;
}

.label {
    font-size: 12px;
    color: #64748b;
}

/* Right Panel */
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Sentinel */
.sentinel {
    height: 1px;
}

/* Tab Bar */
.tab-bar {
    position: sticky;
    top: 100px;
    z-index: 100;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 4px 6px;
    display: flex;
    align-items: center;
    transition: box-shadow 0.2s ease, border-radius 0.2s ease;
}

.tab-bar.is-sticky {
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}


.tab-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-item:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.tab-item.active {
    background: #476996;
    color: white;
    font-weight: 600;
}

.tab-item.active svg {
    color: white;
}

.tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
}

.tab-item.active .tab-badge {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

/* Toolbar */
.toolbar {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filter-row {
    display: flex;
    gap: 12px;
}

.search-box {
    flex: 2;
    height: 40px;
    padding: 0 12px;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
}

.filter-select {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    background-color: white;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
}

/* Search Results Badges */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
}

.badge-subject {
    background: #476996;
    color: white;
}

.badge-tag {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
}

.badge-more {
    background: #f8fafc;
    color: #94a3b8;
    border: 1px solid #e2e8f0;
}

.badge-easy {
    background: #dcfce7;
    color: #166534;
}

.badge-normal {
    background: #dbeafe;
    color: #1e40af;
}

.badge-hard {
    background: #fee2e2;
    color: #991b1b;
}

.badge-insane {
    background: #fae8ff;
    color: #86198f;
}

/* Action Buttons in Search Results */
.action-btn-add {
    background: #476996;
    color: white;
    border-color: #476996;
}

.action-btn-add:hover {
    background: #35527a !important;
    color: white !important;
    border-color: #35527a !important;
}

.action-btn-add.added {
    background: #476996;
    color: white;
    border-color: #476996;
    opacity: 0.6;
}

.btn-sm {
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 8px;
}

/* Question List */
.question-list {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.list-header {
    height: 44px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
}

.list-row {
    height: 64px;
    background-color: white;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    padding: 0 16px;
    color: #334155;
}

/* Columns */
.col-checkbox {
    width: 40px;
    display: flex;
    justify-content: center;
}

.col-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
}

.q-text {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
}

.q-meta {
    font-size: 12px;
    color: #94a3b8;
}

.col-type {
    width: 80px;
    text-align: center;
}

.col-diff {
    width: 80px;
    text-align: center;
}

.score-input {
    width: 56px;
    text-align: center;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 4px 0;
    font-size: 14px;
    font-weight: 500;
    color: #1E293B;
    background: #F8FAFC;
    outline: none;
    transition: all 0.2s;
    -moz-appearance: textfield;
}

.score-input::-webkit-outer-spin-button,
.score-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.score-input:hover {
    border-color: #CBD5E1;
    background: white;
}

.score-input:focus {
    border-color: #476996;
    background: white;
    box-shadow: 0 0 0 2px rgba(71, 105, 150, 0.15);
}

.col-actions {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Change Indicators */
:deep(.table-row.row-added) {
    background: #F0FDF4;
    border-left: 3px solid #22C55E;
}

:deep(.table-row.row-added) .td-cell {
    color: #166534;
}

:deep(.table-row.row-added) .grip-cell {
    color: #16A34A;
}

:deep(.table-row.row-added:hover) {
    background: #DCFCE7;
}

:deep(.table-row.row-modified) {
    background: #FEF3C7;
    border-left: 3px solid #F59E0B;
}

:deep(.table-row.row-modified) .td-cell {
    color: #92400E;
}

:deep(.table-row.row-modified) .grip-cell {
    color: #B45309;
}

:deep(.table-row.row-modified:hover) {
    background: #FDE68A;
}

:deep(.table-row.row-removed) {
    background: #FEF2F2;
    border-left: 3px solid #EF4444;
}

:deep(.table-row.row-removed) .td-cell {
    color: #991B1B;
}

:deep(.table-row.row-removed) .grip-cell {
    color: #EF4444;
}

:deep(.table-row.row-removed:hover) {
    background: #FEE2E2;
}

/* Leave Page Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: #1E293BB3;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-card {
    background: white;
    border-radius: 16px;
    width: 440px;
    max-width: 90vw;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.modal-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 28px 28px 0;
    text-align: center;
}

.modal-icon {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: #FEF3C7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 8px;
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1E293B;
}

.modal-desc {
    margin: 0;
    font-size: 14px;
    color: #64748B;
}

.modal-body {
    padding: 20px 28px;
}

.modal-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 16px;
}

.summary-title {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.summary-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #475569;
}

.summary-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.summary-dot.added {
    background: #22C55E;
}

.summary-dot.removed {
    background: #EF4444;
}

.summary-dot.modified {
    background: #F59E0B;
}

.modal-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 28px 28px;
}

.modal-btn-save {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: #476996;
    color: white;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}

.modal-btn-save:hover {
    background: #35527a;
}

.modal-btn-discard {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    background: white;
    color: #64748B;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.modal-btn-discard:hover {
    background: #F8FAFC;
}

.modal-btn-cancel {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #94A3B8;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.modal-btn-cancel:hover {
    background: #F1F5F9;
}

.btn-warning {
    background: #D97706;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-warning:hover {
    background: #B45309;
}

.btn-danger {
    background: #DC2626;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger:hover {
    background: #B91C1C;
}

.btn-sm {
    padding: 6px 14px;
    font-size: 13px;
}
</style>
