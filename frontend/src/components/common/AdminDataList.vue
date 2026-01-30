<template>
    <div class="admin-data-list" :class="{ 'loading': loading }">
        <!-- Header -->
        <div v-if="showHeader" class="list-header">
            <div class="header-icon" :style="{ background: headerIconColor }">
                <slot name="header-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </slot>
            </div>
            <div class="header-content">
                <h3 class="list-title">{{ title }}</h3>
                <p class="list-subtitle">{{ subtitle }}</p>
            </div>
            <div class="header-stats">
                <div class="stat-item">
                    <span class="stat-value">{{ totalCount }}</span>
                    <span class="stat-label">{{ itemUnit }}</span>
                </div>
            </div>
            <div class="header-actions">
                <slot name="header-actions"></slot>
            </div>
        </div>

        <!-- Select All Header -->
        <div v-if="showSelectAll && items.length > 0" class="select-all-bar">
            <label class="select-all-label">
                <input type="checkbox" :checked="isAllSelected" :indeterminate.prop="isPartialSelected"
                    @change="toggleSelectAll">
                <span>全選本頁 ({{ items.length }} {{ itemUnit }})</span>
            </label>
            <span v-if="selectedIds.length > 0" class="selection-count">
                已選 {{ selectedIds.length }} {{ itemUnit }}
            </span>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>載入中...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="items.length === 0" class="empty-state">
            <slot name="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" class="empty-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </slot>
            <p class="empty-text">{{ emptyText }}</p>
            <p v-if="emptyHint" class="empty-hint">{{ emptyHint }}</p>
        </div>

        <!-- List Items -->
        <div v-else class="list-container">
            <div v-for="item in items" :key="item.id" class="list-item"
                :class="{ 'selected': selectedIds.includes(item.id), 'hover-enabled': enableHover }"
                @click="handleItemClick(item)">
                <!-- Checkbox -->
                <div v-if="showCheckbox" class="item-checkbox" @click.stop>
                    <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)">
                </div>

                <!-- Item Number/ID -->
                <div v-if="showItemId" class="item-id">
                    <span class="id-badge">{{ item.id }}</span>
                </div>

                <!-- Main Content -->
                <div class="item-content">
                    <!-- Primary Info Row -->
                    <div class="item-primary">
                        <span class="item-title">{{ getItemTitle(item) }}</span>
                        <div class="item-badges">
                            <slot name="item-badges" :item="item">
                                <span v-if="type === 'question' && item.subject" class="badge badge-subject">
                                    {{ item.subject }}
                                </span>
                                <span v-if="type === 'question' && item.difficulty" class="badge badge-difficulty"
                                    :class="item.difficulty">
                                    {{ getDifficultyLabel(item.difficulty) }}
                                </span>
                                <span v-if="type === 'question' && item.question_type" class="badge badge-type">
                                    {{ item.question_type }}
                                </span>
                                <span v-if="type === 'exam' && item.questionCount != null" class="badge badge-info">
                                    {{ item.questionCount }} 題
                                </span>
                                <span v-if="type === 'exam' && item.timeLimit != null" class="badge badge-warning">
                                    {{ item.timeLimit }} 分鐘
                                </span>
                            </slot>
                        </div>
                    </div>

                    <!-- Description/Content Row -->
                    <div class="item-description">
                        {{ getItemDescription(item) }}
                    </div>

                    <!-- Tags Row (for questions) -->
                    <div v-if="type === 'question' && item.tags && item.tags.length > 0" class="item-tags">
                        <span v-for="tag in item.tags.slice(0, 5)" :key="tag.id" class="tag-badge"
                            @click.stop="$emit('tag-click', tag)">
                            {{ tag.name }}
                        </span>
                        <span v-if="item.tags.length > 5" class="tag-more">+{{ item.tags.length - 5 }}</span>
                    </div>

                    <!-- Meta Info Row -->
                    <div class="item-meta">
                        <slot name="item-meta" :item="item">
                            <span class="meta-item" title="建立時間">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                {{ formatDate(item.created_at || item.createdAt) }}
                            </span>
                            <span class="meta-item" title="更新時間">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                </svg>
                                {{ formatDate(item.updated_at || item.updatedAt) }}
                            </span>
                        </slot>
                    </div>
                </div>

                <!-- Actions -->
                <div class="item-actions" @click.stop>
                    <slot name="item-actions" :item="item">
                        <button class="action-btn action-btn-view" @click="$emit('view', item)" title="檢視">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="action-btn action-btn-edit" @click="$emit('edit', item)" title="編輯">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="action-btn action-btn-delete" @click="$emit('delete', item)" title="刪除">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                </path>
                            </svg>
                        </button>
                        <!-- More Actions Dropdown -->
                        <div v-if="hasMoreActions" class="more-actions-dropdown">
                            <button class="action-btn action-btn-more" @click="toggleDropdown(item.id)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>
                            <div v-if="openDropdownId === item.id" class="dropdown-menu">
                                <slot name="more-actions" :item="item"></slot>
                            </div>
                        </div>
                    </slot>
                </div>
            </div>
        </div>

        <!-- Selection Toolbar -->
        <SelectionToolbar :selected-count="selectedIds.length" :item-unit="itemUnit" @clear="clearSelection">
            <slot name="selection-actions" :selected-ids="selectedIds" :clear-selection="clearSelection"></slot>
        </SelectionToolbar>

        <!-- Pagination -->
        <PaginationControl v-if="showPagination && items.length > 0" :pagination-state="paginationState"
            :current-page="currentPage" :page-size="pageSize" :is-loading="loading" @page-change="handlePageChange"
            @size-change="handleSizeChange" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SelectionToolbar from './SelectionToolbar.vue'
import PaginationControl from './PaginationControl.vue'

const props = defineProps({
    // Data type: 'question' or 'exam'
    type: {
        type: String,
        default: 'question',
        validator: (value) => ['question', 'exam'].includes(value)
    },
    // Data items
    items: {
        type: Array,
        default: () => []
    },
    // Total count for pagination
    totalCount: {
        type: Number,
        default: 0
    },
    // Loading state
    loading: {
        type: Boolean,
        default: false
    },
    // Header configuration
    showHeader: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        default: '資料列表'
    },
    subtitle: {
        type: String,
        default: '管理所有項目'
    },
    headerIconColor: {
        type: String,
        default: 'var(--primary, #476996)'
    },
    itemUnit: {
        type: String,
        default: '筆'
    },
    // Selection
    showCheckbox: {
        type: Boolean,
        default: true
    },
    showSelectAll: {
        type: Boolean,
        default: true
    },
    // Display options
    showItemId: {
        type: Boolean,
        default: true
    },
    enableHover: {
        type: Boolean,
        default: true
    },
    // Empty state
    emptyText: {
        type: String,
        default: '暫無資料'
    },
    emptyHint: {
        type: String,
        default: ''
    },
    // Pagination
    showPagination: {
        type: Boolean,
        default: true
    },
    currentPage: {
        type: Number,
        default: 1
    },
    pageSize: {
        type: Number,
        default: 20
    },
    paginationState: {
        type: Object,
        default: () => ({ hasNext: false, hasPrev: false, totalPages: 0, totalCount: 0 })
    },
    // Actions
    hasMoreActions: {
        type: Boolean,
        default: false
    },
    // Title/Description field mapping
    titleField: {
        type: String,
        default: '' // Will auto-detect based on type
    },
    descriptionField: {
        type: String,
        default: '' // Will auto-detect based on type
    }
})

const emit = defineEmits([
    'update:selected-ids',
    'item-click',
    'view',
    'edit',
    'delete',
    'tag-click',
    'page-change',
    'size-change'
])

const selectedIds = ref([])
const openDropdownId = ref(null)

// Selection computed properties
const isAllSelected = computed(() => {
    return props.items.length > 0 && props.items.every(item => selectedIds.value.includes(item.id))
})

const isPartialSelected = computed(() => {
    const selected = props.items.filter(item => selectedIds.value.includes(item.id))
    return selected.length > 0 && selected.length < props.items.length
})

// Methods
const getItemTitle = (item) => {
    if (props.titleField) {
        return item[props.titleField] || ''
    }
    // Auto-detect based on type
    if (props.type === 'exam') {
        return item.name || ''
    }
    // For questions, use content with truncation
    const content = item.content || item.question_content || ''
    return content.length > 60 ? content.slice(0, 60) + '…' : content
}

const getItemDescription = (item) => {
    if (props.descriptionField) {
        return item[props.descriptionField] || ''
    }
    // Auto-detect based on type
    if (props.type === 'exam') {
        return item.description || '—'
    }
    // For questions, show category
    return item.category || ''
}

const getDifficultyLabel = (difficulty) => {
    const labels = { easy: '簡單', medium: '中等', hard: '困難' }
    return labels[difficulty] || difficulty
}

const formatDate = (value) => {
    if (!value) return '—'
    // If already formatted
    if (typeof value === 'string' && value.includes('/')) return value
    // Format date
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        // Remove current page items from selection
        const pageIds = props.items.map(item => item.id)
        selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
    } else {
        // Add all current page items
        const pageIds = props.items.map(item => item.id)
        const set = new Set([...selectedIds.value, ...pageIds])
        selectedIds.value = Array.from(set)
    }
    emit('update:selected-ids', selectedIds.value)
}

const toggleSelect = (id) => {
    const idx = selectedIds.value.indexOf(id)
    if (idx === -1) {
        selectedIds.value.push(id)
    } else {
        selectedIds.value.splice(idx, 1)
    }
    emit('update:selected-ids', selectedIds.value)
}

const clearSelection = () => {
    selectedIds.value = []
    emit('update:selected-ids', selectedIds.value)
}

const handleItemClick = (item) => {
    emit('item-click', item)
}

const toggleDropdown = (id) => {
    openDropdownId.value = openDropdownId.value === id ? null : id
}

const handlePageChange = (page) => {
    emit('page-change', page)
}

const handleSizeChange = (size) => {
    emit('size-change', size)
}

// Close dropdown when clicking outside
const closeDropdown = () => {
    openDropdownId.value = null
}

// Expose for parent components
defineExpose({
    selectedIds,
    clearSelection,
    toggleSelectAll
})
</script>

<style scoped>
.admin-data-list {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border, #CBD5E1);
}

/* Header */
.list-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 2px solid var(--border, #CBD5E1);
    background: var(--bg-page, #F8FAFC);
}

.header-icon {
    width: 44px;
    height: 44px;
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

.header-stats {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    background: white;
    border-radius: 10px;
    border: 1px solid var(--border, #CBD5E1);
}

.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary, #476996);
}

.stat-label {
    font-size: 12px;
    color: var(--text-secondary, #64748B);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Select All Bar */
.select-all-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 16px 16px 0 0;
    padding: 12px 24px;
    background: var(--bg-page, #F8FAFC);
    border-bottom: 1px solid var(--border, #E2E8F0);
}

.select-all-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--text-secondary, #64748B);
    cursor: pointer;
}

.select-all-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary, #476996);
    cursor: pointer;
}

.selection-count {
    padding: 6px 12px;
    background: var(--primary, #476996);
    color: white;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
}

/* List Container */
.list-container {
    display: flex;
    flex-direction: column;
    min-height: 200px;
}

/* List Item */
.list-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 18px 24px;
    border-bottom: 1px solid var(--border, #E2E8F0);
    background: white;
    transition: all 0.2s ease;
}

.list-item:last-child {
    border-bottom: none;
}

.list-item.hover-enabled:hover {
    background: var(--bg-page, #F8FAFC);
}

.list-item.selected {
    background: var(--primary-soft, #EEF2FF);
    border-color: rgba(71, 105, 150, 0.2);
}

/* Item Checkbox */
.item-checkbox {
    padding-top: 4px;
}

.item-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary, #476996);
    cursor: pointer;
}

/* Item ID */
.item-id {
    flex-shrink: 0;
}

.id-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    padding: 6px 10px;
    background: var(--bg-page, #F8FAFC);
    border: 1px solid var(--border, #CBD5E1);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #64748B);
    font-family: 'Monaco', 'Menlo', monospace;
}

/* Item Content */
.item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.item-primary {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
}

.item-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary, #1E293B);
    line-height: 1.5;
    word-break: break-word;
}

.item-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
}

.badge-subject {
    background: var(--primary-soft, #EEF2FF);
    color: var(--primary, #476996);
}

.badge-type {
    background: #F3F4F6;
    color: var(--text-secondary, #64748B);
}

.badge-difficulty {
    padding: 4px 10px;
    border: 1px solid transparent;
    box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.badge-difficulty.easy {
    background: #A7F3D0;
    color: #065F46;
    border-color: #34D399;
}

.badge-difficulty.medium {
    background: #FCD34D;
    color: #92400E;
    border-color: #D97706;
}

.badge-difficulty.hard {
    background: #FCA5A5;
    color: #991B1B;
    border-color: #EF4444;
}

.badge-info {
    background: #DBEAFE;
    color: #1E40AF;
}

.badge-warning {
    background: #FEF3C7;
    color: #92400E;
}

.item-description {
    font-size: 13px;
    color: var(--text-secondary, #64748B);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Tags */
.item-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.tag-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    background: #E0E7FF;
    color: #4338CA;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tag-badge:hover {
    background: #C7D2FE;
}

.tag-more {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    background: #F3F4F6;
    color: var(--text-secondary, #64748B);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
}

/* Meta Info */
.item-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary, #64748B);
}

.meta-item svg {
    opacity: 0.6;
}

/* Item Actions */
.item-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.action-btn,
:deep(.action-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
}

.action-btn:hover,
:deep(.action-btn:hover) {
    transform: translateY(-1px);
}

:deep(.action-btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.action-btn-view,
:deep(.action-btn-view) {
    color: var(--primary, #476996);
}

.action-btn-view:hover,
:deep(.action-btn-view:hover) {
    background: var(--primary-soft, #EEF2FF);
}

.action-btn-edit,
:deep(.action-btn-edit) {
    color: #059669;
}

.action-btn-edit:hover,
:deep(.action-btn-edit:hover) {
    background: #D1FAE5;
}

.action-btn-delete,
:deep(.action-btn-delete) {
    color: #DC2626;
}

.action-btn-delete:hover,
:deep(.action-btn-delete:hover) {
    background: #FEE2E2;
}

/* Extra action button for 'info' type */
:deep(.action-btn-info) {
    color: #2563EB;
}

:deep(.action-btn-info:hover) {
    background: #DBEAFE;
}

/* Action spinner for loading states */
:deep(.action-spinner) {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(220, 38, 38, 0.3);
    border-top-color: #DC2626;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.action-btn-more {
    color: var(--text-secondary, #64748B);
}

.action-btn-more:hover {
    background: #F3F4F6;
}


/* More Actions Dropdown */
.more-actions-dropdown {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    min-width: 160px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border, #E2E8F0);
    z-index: 100;
    overflow: hidden;
}

/* Loading State */
.loading-state {
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

/* Responsive */
@media (max-width: 768px) {
    .list-header {
        flex-wrap: wrap;
        padding: 16px;
        gap: 12px;
    }

    .header-stats {
        order: 3;
        width: 100%;
        justify-content: center;
    }

    .header-actions {
        order: 4;
        width: 100%;
        flex-wrap: wrap;
        justify-content: center;
    }

    .list-item {
        padding: 14px 16px;
        flex-wrap: wrap;
    }

    .item-actions {
        width: 100%;
        margin-top: 12px;
        justify-content: flex-end;
    }

    .item-meta {
        flex-direction: column;
        gap: 8px;
    }
}

/* Dark Mode Overrides */
:global(.dark) .admin-data-list {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .list-item {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .list-item.hover-enabled:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .list-item.selected {
    background: var(--primary-soft) !important;
}

:global(.dark) .list-header,
:global(.dark) .select-all-bar {
    background: var(--surface-muted) !important;
    border-color: var(--border) !important;
}

:global(.dark) .stat-item,
:global(.dark) .id-badge {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-secondary) !important;
}

:global(.dark) .badge-type,
:global(.dark) .tag-more,
:global(:root[data-theme="dark"]) .badge-type,
:global(:root[data-theme="dark"]) .tag-more {
    background: var(--surface-muted) !important;
    color: var(--text-secondary) !important;
}

:global(.dark) .tag-badge,
:global(:root[data-theme="dark"]) .tag-badge {
    background: var(--primary-soft) !important;
    color: var(--primary) !important;
}

:global(.dark) .item-tags,
:global(:root[data-theme="dark"]) .item-tags {
    background: transparent !important;
}

:global(.dark) .dropdown-menu {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .empty-state {
    background: var(--surface) !important;
    color: var(--text-secondary) !important;
}
</style>
