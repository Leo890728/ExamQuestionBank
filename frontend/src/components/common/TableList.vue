<template>
    <div class="table-list" :class="{ loading }">
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

        <!-- Table -->
        <div v-else class="table-container">
            <!-- Column Headers -->
            <div class="table-header-row" :style="{ gridTemplateColumns: gridColumns }">
                <div v-if="draggable" class="th-cell grip-cell"></div>
                <div v-if="selectable" class="th-cell checkbox-cell">
                    <input type="checkbox" :checked="isAllSelected" :indeterminate.prop="isPartialSelected"
                        @change="toggleSelectAll">
                </div>
                <div v-for="col in columns" :key="col.key" class="th-cell"
                    :class="[`col-${col.key}`, { sortable: col.sortable }]" :style="alignStyle(col.align)"
                    @click="col.sortable ? handleSort(col.key) : null">
                    <span class="th-label">{{ col.label }}</span>
                    <i v-if="col.sortable && sortKey !== col.key" class="bi bi-arrow-down-up sort-icon"></i>
                    <i v-else-if="col.sortable && sortKey === col.key && sortOrder === 'asc'"
                        class="bi bi-arrow-up sort-icon active"></i>
                    <i v-else-if="col.sortable && sortKey === col.key && sortOrder === 'desc'"
                        class="bi bi-arrow-down sort-icon active"></i>
                </div>
            </div>

            <!-- Data Rows -->
            <draggable v-if="draggable" v-model="dragList" class="table-body" tag="div" item-key="id"
                handle=".grip-cell" :animation="200" ghost-class="drag-ghost" drag-class="drag-active"
                @end="handleDragEnd">
                <template #item="{ element: item, index }">
                    <div class="table-row" :class="[{ selected: selectedIds.includes(item.id) }, rowClass?.(item)]"
                        :style="{ gridTemplateColumns: gridColumns }" @click="handleItemClick(item)">
                        <div class="td-cell grip-cell" @mousedown.stop>
                            <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div v-if="selectable" class="td-cell checkbox-cell" @click.stop>
                            <input type="checkbox" :checked="selectedIds.includes(item.id)"
                                @change="toggleSelect(item.id)">
                        </div>
                        <div v-for="col in columns" :key="col.key" class="td-cell" :class="`col-${col.key}`"
                            :style="alignStyle(col.align)">
                            <slot :name="`cell-${col.key}`" :item="item" :index="index">
                                <span>{{ item[col.key] }}</span>
                            </slot>
                        </div>
                    </div>
                </template>
            </draggable>
            <div v-else class="table-body">
                <div v-for="(item, index) in displayItems" :key="item.id" class="table-row"
                    :class="[{ selected: selectedIds.includes(item.id) }, rowClass?.(item)]" :style="{ gridTemplateColumns: gridColumns }"
                    @click="handleItemClick(item)">
                    <div v-if="selectable" class="td-cell checkbox-cell" @click.stop>
                        <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)">
                    </div>
                    <div v-for="col in columns" :key="col.key" class="td-cell" :class="`col-${col.key}`"
                        :style="alignStyle(col.align)">
                        <slot :name="`cell-${col.key}`" :item="item" :index="index">
                            <span>{{ item[col.key] }}</span>
                        </slot>
                    </div>
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
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import SelectionToolbar from './SelectionToolbar.vue'
import PaginationControl from './PaginationControl.vue'

const props = defineProps({
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    showHeader: { type: Boolean, default: true },
    title: { type: String, default: '資料列表' },
    subtitle: { type: String, default: '' },
    headerIcon: { type: String, default: 'bi-table' },
    headerIconColor: { type: String, default: 'var(--primary, #476996)' },
    columns: { type: Array, required: true },
    selectable: { type: Boolean, default: true },
    draggable: { type: Boolean, default: false },
    sortKey: { type: String, default: '' },
    sortOrder: { type: String, default: '' },
    rowClass: { type: Function, default: null },
    itemUnit: { type: String, default: '筆' },
    emptyText: { type: String, default: '暫無資料' },
    emptyHint: { type: String, default: '' },
    showPagination: { type: Boolean, default: true },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 20 },
    paginationState: { type: Object, default: null }
})

const emit = defineEmits([
    'update:selected-ids',
    'item-click',
    'sort-change',
    'reorder',
    'page-change',
    'size-change'
])

// --- Selection ---
const selectedIds = ref([])

const isAllSelected = computed(() => {
    return props.items.length > 0 && displayItems.value.every(item => selectedIds.value.includes(item.id))
})

const isPartialSelected = computed(() => {
    const selected = displayItems.value.filter(item => selectedIds.value.includes(item.id))
    return selected.length > 0 && selected.length < displayItems.value.length
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        const pageIds = displayItems.value.map(item => item.id)
        selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
    } else {
        const pageIds = displayItems.value.map(item => item.id)
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

// --- Align ---
const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' }
const alignStyle = (align) => ({
    textAlign: align || 'left',
    justifyContent: alignMap[align] || 'flex-start'
})

// --- Grid Columns ---
const gridColumns = computed(() => {
    const cols = []
    if (props.draggable) cols.push('20px')
    if (props.selectable) cols.push('40px')
    for (const col of props.columns) {
        cols.push(col.width || '1fr')
    }
    return cols.join(' ')
})

// --- Sort ---
const handleSort = (key) => {
    let newOrder = 'asc'
    if (props.sortKey === key) {
        newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc'
    }
    emit('sort-change', { key, order: newOrder })
}

// --- Drag and Drop (vuedraggable) ---
const dragList = ref([])

watch(displayItems, (newItems) => {
    dragList.value = [...newItems]
}, { immediate: true })

const handleDragEnd = (evt) => {
    if (evt.oldIndex !== evt.newIndex) {
        emit('reorder', { fromIndex: evt.oldIndex, toIndex: evt.newIndex })
    }
}

// --- Navigation ---
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
.table-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border, #CBD5E1);
    overflow: clip;
}

/* Header (same as ItemList) */
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

/* Table Header Row */
.table-header-row {
    display: grid;
    align-items: center;
    padding: 10px 16px;
    background: var(--bg-page, #F8FAFC);
    border-bottom: 1px solid var(--border, #E2E8F0);
    gap: 8px;
}

.th-cell {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #64748B);
    display: flex;
    align-items: center;
    gap: 4px;
    user-select: none;
}

.th-cell.sortable {
    cursor: pointer;
}

.th-cell.sortable:hover {
    color: var(--text-primary, #1E293B);
}

.th-cell.checkbox-cell {
    justify-content: center;
}

.th-cell.checkbox-cell input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary, #476996);
    cursor: pointer;
}

.sort-icon {
    font-size: 13px;
    color: var(--text-secondary, #94A3B8);
}

.sort-icon.active {
    color: var(--primary, #476996);
}

/* Table Body */
.table-body {
    display: flex;
    flex-direction: column;
}

/* Table Row */
.table-row {
    display: grid;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border, #E2E8F0);
    background: white;
    transition: background 0.2s ease, border-color 0.2s ease;
    gap: 8px;
    cursor: pointer;
}

.table-row:last-child {
    border-bottom: none;
}

.table-row:hover {
    background: var(--bg-page, #F8FAFC);
}

.table-row.selected {
    background: var(--primary-soft, #EEF2FF);
    border-left: 3px solid var(--primary, #476996);
}

/* Drag States (vuedraggable) */
.drag-ghost {
    opacity: 0.4;
    background: var(--primary-soft, #EEF2FF);
    border-left: 3px solid var(--primary, #476996);
}

.drag-active {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    background: white;
    z-index: 10;
}

/* Drag row transition */
.drag-row-move {
    transition: transform 0.2s ease;
}

/* Cell Styles */
.td-cell {
    font-size: 14px;
    color: var(--text-primary, #1E293B);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.grip-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #94A3B8);
    cursor: grab;
}

.grip-cell:active {
    cursor: grabbing;
}

.grip-cell i {
    font-size: 14px;
}

.checkbox-cell {
    display: flex;
    align-items: center;
    justify-content: center;
}

.checkbox-cell input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--primary, #476996);
    cursor: pointer;
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

:deep(.action-btn.danger:hover) {
    background: #FEE2E2;
    color: #DC2626;
    border-color: #FCA5A5;
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

    .table-header-row,
    .table-row {
        padding: 10px 12px;
        gap: 6px;
    }

    .grip-cell {
        display: none;
    }
}

/* Dark Mode */
:global(.dark) .table-list {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .table-row {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .table-row:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .table-row.selected {
    background: var(--primary-soft) !important;
}

:global(.dark) .list-header,
:global(.dark) .table-header-row {
    background: var(--surface-muted) !important;
    border-color: var(--border) !important;
}
</style>
