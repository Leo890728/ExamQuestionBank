<template>
    <div class="item-list" :class="{ loading }">
        <!-- Header -->
        <div v-if="showHeader" class="list-header">
            <div class="header-icon" :style="{ background: headerIconColor }">
                <slot name="header-icon">
                    <i :class="['bi', headerIcon]"></i>
                </slot>
            </div>
            <div class="header-content">
                <h3 class="list-title">{{ title }}</h3>
                <p v-if="subtitle" class="list-subtitle">{{ subtitle }}</p>
            </div>
            <div class="header-actions">
                <slot name="header-actions"></slot>
            </div>
        </div>

        <!-- Select All Bar -->
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
                <i class="bi bi-inbox empty-icon"></i>
            </slot>
            <p class="empty-text">{{ emptyText }}</p>
            <p v-if="emptyHint" class="empty-hint">{{ emptyHint }}</p>
        </div>

        <!-- List Items -->
        <div v-else class="list-container">
            <div v-for="item in displayItems" :key="item.id" class="list-item"
                :class="{ selected: selectedIds.includes(item.id), 'hover-enabled': enableHover }"
                @click="handleItemClick(item)">
                <div class="item-top-row">
                    <div v-if="selectable" class="item-checkbox" @click.stop>
                        <input type="checkbox" :checked="selectedIds.includes(item.id)"
                            @change="toggleSelect(item.id)">
                    </div>
                    <div class="item-badges">
                        <slot name="item-badges" :item="item"></slot>
                    </div>
                    <div class="item-actions" @click.stop>
                        <slot name="item-actions" :item="item"></slot>
                    </div>
                </div>
                <div class="item-content-area">
                    <slot name="item-content" :item="item">
                        <p class="item-content-text">{{ item[contentField] }}</p>
                    </slot>
                </div>
            </div>
        </div>

        <!-- Selection Toolbar -->
        <SelectionToolbar :selected-count="selectedIds.length" :item-unit="itemUnit" @clear="clearSelection">
            <slot name="selection-actions" :selected-ids="selectedIds" :clear-selection="clearSelection"></slot>
        </SelectionToolbar>

        <!-- Pagination -->
        <PaginationControl v-if="showPagination && items.length > 0" :pagination-state="resolvedPaginationState"
            :current-page="resolvedPage" :page-size="isExternalPagination ? pageSize : internalPageSize"
            :is-loading="loading" @page-change="handlePageChange" @size-change="handleSizeChange" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SelectionToolbar from './SelectionToolbar.vue'
import PaginationControl from './PaginationControl.vue'

const props = defineProps({
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    title: { type: String, default: '項目列表' },
    subtitle: { type: String, default: '' },
    headerIcon: { type: String, default: 'bi-list-ul' },
    headerIconColor: { type: String, default: 'var(--primary, #476996)' },
    selectable: { type: Boolean, default: true },
    showSelectAll: { type: Boolean, default: true },
    itemUnit: { type: String, default: '項' },
    emptyText: { type: String, default: '暫無資料' },
    emptyHint: { type: String, default: '' },
    enableHover: { type: Boolean, default: true },
    contentField: { type: String, default: 'content' },
    showPagination: { type: Boolean, default: true },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 20 },
    paginationState: { type: Object, default: null }
})

const emit = defineEmits([
    'update:selected-ids',
    'item-click',
    'page-change',
    'size-change'
])

const selectedIds = ref([])

const isAllSelected = computed(() => {
    return props.items.length > 0 && props.items.every(item => selectedIds.value.includes(item.id))
})

const isPartialSelected = computed(() => {
    const selected = props.items.filter(item => selectedIds.value.includes(item.id))
    return selected.length > 0 && selected.length < props.items.length
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        const pageIds = props.items.map(item => item.id)
        selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
    } else {
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

// --- Pagination ---
const isExternalPagination = computed(() => props.paginationState !== null)
const internalPage = ref(1)
const internalPageSize = ref(props.pageSize)

const resolvedPaginationState = computed(() => {
    if (isExternalPagination.value) return props.paginationState
    const total = props.items.length
    const ps = internalPageSize.value
    const totalPages = Math.ceil(total / ps)
    const page = internalPage.value
    return { totalCount: total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
})

const resolvedPage = computed(() => isExternalPagination.value ? props.currentPage : internalPage.value)

const displayItems = computed(() => {
    if (isExternalPagination.value) return props.items
    const start = (internalPage.value - 1) * internalPageSize.value
    return props.items.slice(start, start + internalPageSize.value)
})

const handleItemClick = (item) => {
    emit('item-click', item)
}

const handlePageChange = (page) => {
    if (!isExternalPagination.value) {
        internalPage.value = page
    }
    emit('page-change', page)
}

const handleSizeChange = (size) => {
    if (!isExternalPagination.value) {
        internalPageSize.value = size
        internalPage.value = 1
    }
    emit('size-change', size)
}

defineExpose({
    selectedIds,
    clearSelection,
    toggleSelectAll
})
</script>

<style scoped>
.item-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border, #CBD5E1);
    overflow: clip;
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
    font-size: 20px;
}

.header-content {
    flex: 1;
    min-width: 0;
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
    flex-shrink: 0;
}

/* Select All Bar */
.select-all-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
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
    padding: 4px 10px;
    background: var(--primary, #476996);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
}

/* List Container */
.list-container {
    display: flex;
    flex-direction: column;
}

/* List Item */
.list-item {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border, #E2E8F0);
    background: white;
    transition: all 0.2s ease;
    cursor: pointer;
}

.list-item:last-child {
    border-bottom: none;
}

.list-item.hover-enabled:hover {
    background: var(--bg-page, #F8FAFC);
}

.list-item.selected {
    background: var(--primary-soft, #EEF2FF);
    border-left: 3px solid var(--primary, #476996);
}

/* Top Row: Checkbox + Badges + Actions */
.item-top-row {
    display: flex;
    align-items: center;
    gap: 14px;
}

.item-checkbox {
    flex-shrink: 0;
}

.item-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary, #476996);
    cursor: pointer;
}

.item-badges {
    display: flex;
    gap: 6px;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    min-width: 0;
}

.item-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    align-items: center;
}

/* Content Area */
.item-content-area {
    padding-left: 32px;
    padding-top: 8px;
}

.item-content-text {
    margin: 0;
    font-size: 14px;
    color: var(--text-primary, #1E293B);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}

/* Action Buttons (slotted) */
:deep(.action-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--border, #CBD5E1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    color: var(--text-secondary, #64748B);
    padding: 0;
}

:deep(.action-btn:hover) {
    background: var(--bg-page, #F8FAFC);
    color: var(--text-primary, #1E293B);
    border-color: var(--text-secondary, #94A3B8);
}

:deep(.action-btn.active) {
    background: #F59E0B;
    color: white;
    border-color: #F59E0B;
}

:deep(.action-btn.active:hover) {
    background: #D97706;
    border-color: #D97706;
}

:deep(.action-btn i) {
    font-size: 16px;
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
    to { transform: rotate(360deg); }
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
    font-size: 48px;
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

    .header-actions {
        width: 100%;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .list-item {
        padding: 12px;
    }

    .item-top-row {
        flex-wrap: wrap;
        gap: 8px;
    }

    .item-actions {
        width: 100%;
        justify-content: flex-end;
        margin-top: 4px;
    }

    .item-content-area {
        padding-left: 0;
    }
}

/* Dark Mode */
:global(.dark) .item-list {
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
</style>
