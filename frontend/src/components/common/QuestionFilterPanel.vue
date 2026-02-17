<template>
    <div class="question-filter-wrapper">
        <!-- Collapsed State -->
        <transition name="filter-fade">
            <div v-if="collapsed" class="filter-collapsed" @click="collapsed = false">
                <div class="collapsed-left">
                    <div class="collapsed-icon-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="4" x2="4" y1="21" y2="14"></line>
                            <line x1="4" x2="4" y1="10" y2="3"></line>
                            <line x1="12" x2="12" y1="21" y2="12"></line>
                            <line x1="12" x2="12" y1="8" y2="3"></line>
                            <line x1="20" x2="20" y1="21" y2="16"></line>
                            <line x1="20" x2="20" y1="12" y2="3"></line>
                            <line x1="2" x2="6" y1="14" y2="14"></line>
                            <line x1="10" x2="14" y1="8" y2="8"></line>
                            <line x1="18" x2="22" y1="16" y2="16"></line>
                        </svg>
                    </div>
                    <span class="collapsed-title">{{ title }}</span>
                    <div v-if="activeChips.length" class="collapsed-chips">
                        <div class="collapsed-sep"></div>
                        <span v-for="(chip, i) in activeChips.slice(0, 2)" :key="i" class="collapsed-chip">
                            {{ chip }}
                        </span>
                        <span v-if="activeChips.length > 2" class="collapsed-chip collapsed-chip-more">
                            +{{ activeChips.length - 2 }}
                        </span>
                    </div>
                </div>
                <div class="collapsed-right">
                    <span v-if="showResultCount" class="collapsed-count">{{ totalCount }} 題</span>
                    <div class="collapsed-expand-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Expanded State -->
        <transition name="filter-fade">
            <div v-if="!collapsed" class="filter-panel">
                <!-- Title Row (always shown when collapsible, for collapse button) -->
                <div class="filter-title-row">
                    <div v-if="showTitle" class="filter-title-left">
                        <h2 class="filter-title">{{ title }}</h2>
                    </div>
                    <div class="filter-title-right">
                        <div v-if="showTitle" class="filter-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <line x1="4" x2="4" y1="21" y2="14"></line>
                                <line x1="4" x2="4" y1="10" y2="3"></line>
                                <line x1="12" x2="12" y1="21" y2="12"></line>
                                <line x1="12" x2="12" y1="8" y2="3"></line>
                                <line x1="20" x2="20" y1="21" y2="16"></line>
                                <line x1="20" x2="20" y1="12" y2="3"></line>
                                <line x1="2" x2="6" y1="14" y2="14"></line>
                                <line x1="10" x2="14" y1="8" y2="8"></line>
                                <line x1="18" x2="22" y1="16" y2="16"></line>
                            </svg>
                            <span>查詢器</span>
                        </div>
                        <button v-if="collapsible" class="collapse-btn" @click="collapsed = true"
                            title="收合查詢面板">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="m18 15-6-6-6 6"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Filter Grid: 2 rows x 2 cols -->
                <div class="filter-grid">
                    <div class="filter-row-2col">
                        <!-- 類科 -->
                        <div v-if="showCategoryFilter" class="filter-item">
                            <label class="filter-label">類科</label>
                            <div class="filter-input-box">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="input-icon">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <input v-model="localFilters.category" type="text" placeholder="輸入類科關鍵字..."
                                    @input="emitUpdate" />
                            </div>
                        </div>

                        <!-- 科目 -->
                        <div v-if="showSubjectFilter" class="filter-item">
                            <label class="filter-label">科目</label>
                            <div class="filter-input-box">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="input-icon">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <input v-model="localFilters.subject" type="text" placeholder="輸入科目關鍵字..."
                                    @input="emitUpdate" />
                            </div>
                        </div>
                    </div>

                    <div class="filter-row-2col">
                        <!-- 難度 -->
                        <div v-if="showDifficultyFilter" class="filter-item">
                            <label class="filter-label">難度</label>
                            <div class="filter-select-box">
                                <select v-model="localFilters.difficulty" @change="emitUpdate">
                                    <option value="">全部難度</option>
                                    <option value="easy">簡單</option>
                                    <option value="normal">普通</option>
                                    <option value="hard">困難</option>
                                    <option value="insane">地獄</option>
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="select-icon">
                                    <path d="m6 9 6 6 6-6"></path>
                                </svg>
                            </div>
                        </div>

                        <!-- 題型 -->
                        <div v-if="showQuestionTypeFilter" class="filter-item">
                            <label class="filter-label">題型</label>
                            <div class="filter-select-box">
                                <select v-model="localFilters.question_type" @change="emitUpdate">
                                    <option value="">全部題型</option>
                                    <option value="multipleChoice">選擇題</option>
                                    <option value="essay">問答題</option>
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="select-icon">
                                    <path d="m6 9 6 6 6-6"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Keyword Search -->
                <div v-if="showKeywordSearch" class="filter-search-section">
                    <label class="filter-label">關鍵字搜尋</label>
                    <div class="search-row">
                        <div class="filter-input-box search-input-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="input-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <input v-model="localFilters.search" type="text" placeholder="搜尋題目內容..."
                                @keyup.enter="handleSearch" @input="emitUpdate" />
                        </div>
                        <button class="search-btn" @click="handleSearch" :disabled="loading">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <span>搜尋</span>
                        </button>
                    </div>
                </div>

                <!-- Tag Filter -->
                <div v-if="showTagFilter" class="filter-tag-section">
                    <div class="tag-section-header">
                        <label class="filter-label">標籤篩選</label>
                        <div class="tag-mode-toggle">
                            <button type="button" class="tag-mode-btn"
                                :class="{ active: localFilters.tag_mode === 'or' }"
                                @click="localFilters.tag_mode = 'or'; emitUpdate()">
                                OR
                            </button>
                            <button type="button" class="tag-mode-btn"
                                :class="{ active: localFilters.tag_mode === 'and' }"
                                @click="localFilters.tag_mode = 'and'; emitUpdate()">
                                AND
                            </button>
                        </div>
                    </div>
                    <TagFilter v-model="localFilters.tags" v-model:mode="localFilters.tag_mode" :options="resolvedTags"
                        placeholder="選擇標籤篩選..." @update:modelValue="emitUpdate" @update:mode="emitUpdate" />
                </div>

                <!-- Divider + Actions -->
                <div class="filter-divider"></div>
                <div class="filter-actions">
                    <button class="reset-btn" @click="handleReset">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                            <path d="M3 3v5h5"></path>
                        </svg>
                        <span>重設篩選</span>
                    </button>
                    <div v-if="showResultCount" class="result-count">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                        </svg>
                        <span>找到</span>
                        <strong>{{ totalCount }}</strong>
                        <span>題</span>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import TagFilter from './TagFilter.vue'
import tagService from '@/services/tagService'

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => ({
            category: '',
            subject: '',
            difficulty: '',
            question_type: '',
            search: '',
            tags: [],
            tag_mode: 'or'
        })
    },
    tags: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    totalCount: {
        type: Number,
        default: 0
    },
    showTitle: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        default: '查詢題目'
    },
    collapsible: {
        type: Boolean,
        default: true
    },
    defaultCollapsed: {
        type: Boolean,
        default: false
    },
    showCategoryFilter: {
        type: Boolean,
        default: true
    },
    showSubjectFilter: {
        type: Boolean,
        default: true
    },
    showDifficultyFilter: {
        type: Boolean,
        default: true
    },
    showQuestionTypeFilter: {
        type: Boolean,
        default: true
    },
    showTagFilter: {
        type: Boolean,
        default: true
    },
    showKeywordSearch: {
        type: Boolean,
        default: true
    },
    showResultCount: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const collapsed = ref(props.defaultCollapsed)
const localFilters = ref({ ...props.modelValue })

watch(() => props.modelValue, (newVal) => {
    localFilters.value = { ...newVal }
}, { deep: true })

const emitUpdate = () => {
    emit('update:modelValue', { ...localFilters.value })
}

const handleSearch = () => {
    emitUpdate()
    emit('search')
}

const defaultFilters = {
    category: '',
    subject: '',
    difficulty: '',
    question_type: '',
    search: '',
    tags: [],
    tag_mode: 'or'
}

const handleReset = () => {
    localFilters.value = { ...defaultFilters }
    emitUpdate()
    emit('reset')
}

const difficultyMap = { easy: '簡單', normal: '普通', hard: '困難', insane: '地獄' }
const questionTypeMap = { multipleChoice: '選擇題', essay: '問答題' }

const activeChips = computed(() => {
    const chips = []
    const f = localFilters.value
    if (f.category) chips.push(f.category)
    if (f.subject) chips.push(f.subject)
    if (f.difficulty) chips.push(difficultyMap[f.difficulty] || f.difficulty)
    if (f.question_type) chips.push(questionTypeMap[f.question_type] || f.question_type)
    if (f.search) chips.push(`"${f.search}"`)
    if (f.tags?.length) chips.push(`${f.tags.length} 個標籤`)
    return chips
})

// 標籤自動載入：如果外部沒傳入 tags，則組件內部自行載入
const internalTags = ref([])

const resolvedTags = computed(() => {
    return props.tags.length > 0 ? props.tags : internalTags.value
})

const loadTags = async () => {
    if (props.tags.length > 0 || !props.showTagFilter) return
    try {
        const { data } = await tagService.getTags({ limit: 200 })
        internalTags.value = Array.isArray(data) ? data : (data?.results || [])
    } catch (error) {
        console.error('QuestionFilterPanel: 載入標籤失敗', error)
        internalTags.value = []
    }
}

onMounted(() => {
    loadTags()
})
</script>

<style scoped>
/* ===== Transitions ===== */
.filter-fade-enter-active,
.filter-fade-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.filter-fade-enter-from,
.filter-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ===== Collapsed State ===== */
.filter-collapsed {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface, #FFFFFF);
    border-radius: 16px;
    padding: 14px 20px;
    gap: 16px;
    cursor: pointer;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04);
    transition: box-shadow 0.2s ease;
}

.filter-collapsed:hover {
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
}

.collapsed-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.collapsed-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--primary-soft, #EEF2FF);
    border-radius: 10px;
    color: var(--primary, #476996);
    flex-shrink: 0;
}

.collapsed-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary, #1E293B);
    white-space: nowrap;
}

.collapsed-chips {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.collapsed-sep {
    width: 1px;
    height: 20px;
    background: var(--border, #CBD5E1);
    flex-shrink: 0;
}

.collapsed-chip {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    background: var(--primary-soft, #EEF2FF);
    color: var(--primary, #476996);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.collapsed-chip-more {
    background: var(--bg-page, #F1F5F9);
    color: var(--text-secondary, #64748B);
}

.collapsed-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.collapsed-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary, #476996);
    white-space: nowrap;
}

.collapsed-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--bg-page, #F1F5F9);
    border-radius: 10px;
    color: var(--text-secondary, #64748B);
    flex-shrink: 0;
}

/* ===== Expanded Panel ===== */
.filter-panel {
    background: var(--surface, #FFFFFF);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Title Row */
.filter-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.filter-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #1E293B);
    margin: 0;
}

.filter-title-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.filter-title-right {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
}

.filter-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 20px;
    background: var(--primary-soft, #EEF2FF);
    color: var(--primary, #476996);
    font-size: 13px;
    font-weight: 600;
}

.collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--bg-page, #F1F5F9);
    border: none;
    border-radius: 10px;
    color: var(--text-secondary, #64748B);
    cursor: pointer;
    transition: all 0.2s;
}

.collapse-btn:hover {
    background: var(--surface-muted, #E2E8F0);
    color: var(--text-primary, #1E293B);
}

/* Filter Grid */
.filter-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filter-row-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.filter-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #1E293B);
}

/* Input Box */
.filter-input-box {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    background: var(--bg-page, #F1F5F9);
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 0 14px;
    transition: all 0.2s;
}

.filter-input-box:focus-within {
    border-color: var(--primary, #476996);
    background: var(--surface, #FFFFFF);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.input-icon {
    color: var(--text-secondary, #94A3B8);
    flex-shrink: 0;
}

.filter-input-box input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--text-primary, #1E293B);
    outline: none;
    min-width: 0;
}

.filter-input-box input::placeholder {
    color: var(--text-secondary, #94A3B8);
}

/* Select Box */
.filter-select-box {
    position: relative;
    height: 44px;
}

.filter-select-box select {
    width: 100%;
    height: 100%;
    padding: 0 36px 0 14px;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--bg-page, #F1F5F9);
    font-size: 14px;
    color: var(--text-secondary, #64748B);
    appearance: none;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
}

.filter-select-box select:focus {
    border-color: var(--primary, #476996);
    background: var(--surface, #FFFFFF);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
    color: var(--text-primary, #1E293B);
}

.select-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #94A3B8);
    pointer-events: none;
}

/* Search Section */
.filter-search-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.search-row {
    display: flex;
    gap: 10px;
}

.search-input-flex {
    flex: 1;
}

.search-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 20px;
    background: var(--primary, #476996);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
    background: var(--primary-hover, #35527a);
}

.search-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Tag Section */
.filter-tag-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tag-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tag-mode-toggle {
    display: flex;
    background: var(--bg-page, #F1F5F9);
    border-radius: 10px;
    padding: 3px;
    gap: 0;
}

.tag-mode-btn {
    padding: 4px 12px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-secondary, #64748B);
}

.tag-mode-btn.active {
    background: var(--primary, #476996);
    color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Divider + Actions */
.filter-divider {
    height: 1px;
    background: var(--border, #CBD5E1);
}

.filter-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: var(--bg-page, #F1F5F9);
    color: var(--text-secondary, #64748B);
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.reset-btn:hover {
    background: var(--surface-muted, #E2E8F0);
    color: var(--text-primary, #1E293B);
}

.result-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary, #64748B);
}

.result-count strong {
    font-size: 16px;
    font-weight: 700;
    color: var(--primary, #476996);
}

.result-count svg {
    color: var(--primary, #476996);
}

/* ===== Dark Mode ===== */
:global(.dark) .filter-collapsed,
:global(.dark) .filter-panel {
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3), 0 2px 8px -2px rgba(0, 0, 0, 0.2);
}

:global(.dark) .filter-collapsed:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
    .filter-row-2col {
        grid-template-columns: 1fr;
    }

    .filter-panel {
        padding: 18px;
        gap: 16px;
    }

    .collapsed-chips {
        display: none;
    }

    .filter-actions {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .reset-btn {
        justify-content: center;
    }

    .result-count {
        justify-content: center;
    }
}
</style>
