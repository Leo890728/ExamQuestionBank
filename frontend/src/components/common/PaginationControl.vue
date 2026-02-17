<template>
    <nav v-if="paginationState.totalPages > 0" class="pagination-wrapper">
        <div class="pagination-info">
            <span class="text-muted">
                共 {{ paginationState.totalCount }} 筆 | 第 {{ currentPage }} / {{ paginationState.totalPages }} 頁
            </span>
            <select :value="pageSize" class="form-select form-select-sm page-size-select" @change="onPageSizeChange">
                <option :value="10">每頁 10 筆</option>
                <option :value="20">每頁 20 筆</option>
                <option :value="50">每頁 50 筆</option>
                <option :value="100">每頁 100 筆</option>
            </select>
        </div>

        <ul class="pagination mb-0">
            <li class="page-item" :class="{ disabled: !paginationState.hasPrev || isLoading }">
                <button class="page-link" :disabled="!paginationState.hasPrev || isLoading"
                    @click="$emit('page-change', 1)" title="第一頁">
                    <span aria-hidden="true">&laquo;</span>
                </button>
            </li>
            <li class="page-item" :class="{ disabled: !paginationState.hasPrev || isLoading }">
                <button class="page-link" :disabled="!paginationState.hasPrev || isLoading"
                    @click="$emit('page-change', currentPage - 1)" title="上一頁">
                    <span aria-hidden="true">&lsaquo;</span>
                </button>
            </li>

            <!-- Page Numbers -->
            <li v-for="page in visiblePages" :key="page" class="page-item"
                :class="{ active: page === currentPage, disabled: isLoading || typeof page !== 'number' }">
                <button class="page-link" :disabled="isLoading || typeof page !== 'number'"
                    @click="typeof page === 'number' ? $emit('page-change', page) : null">
                    {{ page }}
                </button>
            </li>

            <li class="page-item" :class="{ disabled: !paginationState.hasNext || isLoading }">
                <button class="page-link" :disabled="!paginationState.hasNext || isLoading"
                    @click="$emit('page-change', currentPage + 1)" title="下一頁">
                    <span aria-hidden="true">&rsaquo;</span>
                </button>
            </li>
            <li class="page-item" :class="{ disabled: !paginationState.hasNext || isLoading }">
                <button class="page-link" :disabled="!paginationState.hasNext || isLoading"
                    @click="$emit('page-change', paginationState.totalPages)" title="最後一頁">
                    <span aria-hidden="true">&raquo;</span>
                </button>
            </li>
        </ul>

        <div class="page-jumper">
            <span class="text-muted me-2">跳至</span>
            <input v-model.number="jumpToPage" type="number" class="form-control form-control-sm" :min="1"
                :max="paginationState.totalPages" @keyup.enter="handlePageJump" placeholder="頁碼" />
            <button class="btn btn-sm btn-secondary" :disabled="isLoading || !isValidJumpPage" @click="handlePageJump">
                前往
            </button>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface PaginationState {
    hasNext: boolean
    hasPrev: boolean
    totalPages: number
    totalCount: number
}

const props = defineProps<{
    paginationState: PaginationState
    currentPage: number
    pageSize: number
    isLoading?: boolean
}>()

const emit = defineEmits<{
    (e: 'page-change', page: number): void
    (e: 'size-change', size: number): void
}>()

const jumpToPage = ref<number | null>(null)

// Calculate visible pages for pagination (e.g., 1 ... 4 5 6 ... 10)
const visiblePages = computed(() => {
    const total = props.paginationState.totalPages
    const current = props.currentPage
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    range.push(1)

    if (total <= 1) return range

    for (let i = current - delta; i <= current + delta; i++) {
        if (i < total && i > 1) {
            range.push(i)
        }
    }
    range.push(total)

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1)
            } else if (i - l !== 1) {
                rangeWithDots.push('...')
            }
        }
        rangeWithDots.push(i)
        l = i
    }

    return rangeWithDots
})

const isValidJumpPage = computed(() => {
    if (!jumpToPage.value) return false
    const page = Number(jumpToPage.value)
    return Number.isInteger(page) && page >= 1 && page <= props.paginationState.totalPages
})

const onPageSizeChange = (event: Event) => {
    const select = event.target as HTMLSelectElement
    emit('size-change', parseInt(select.value))
}

const handlePageJump = () => {
    if (isValidJumpPage.value && jumpToPage.value) {
        emit('page-change', jumpToPage.value)
        jumpToPage.value = null
    }
}
</script>

<style scoped>
/* Pagination Wrapper - Sticky & Floating */
.pagination-wrapper {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border, #CBD5E1);
    flex-wrap: wrap;
    z-index: 100;
    margin-top: 24px;
}

.pagination-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.pagination-info .text-muted {
    font-size: 14px;
    color: var(--text-secondary, #64748B);
    font-weight: 500;
}

.page-size-select {
    width: auto;
    min-width: 130px;
    padding: 8px 32px 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    background: #f9fafb;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    color: var(--text-primary, #1E293B);
}

.page-size-select:focus {
    outline: none;
    border-color: var(--primary, #476996);
    background-color: white;
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.pagination {
    display: flex;
    padding-left: 0;
    list-style: none;
    gap: 6px;
    margin: 0;
}

.page-item {
    display: flex;
}

.page-link {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 12px;
    color: var(--text-primary, #1E293B);
    text-decoration: none;
    background-color: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
}

.page-link:hover:not(:disabled) {
    background-color: var(--primary-soft, #EEF2FF);
    border-color: var(--primary, #476996);
    color: var(--primary, #476996);
    transform: translateY(-1px);
}

.page-item.active .page-link {
    background: var(--primary, #476996);
    border-color: var(--primary, #476996);
    color: white;
    box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.page-item.disabled .page-link {
    cursor: not-allowed;
    opacity: 0.4;
    transform: none;
    color: var(--text-secondary, #64748B);
    background-color: #f9fafb;
    border-color: #e5e7eb;
    pointer-events: none;
}

.page-jumper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-jumper .text-muted {
    font-size: 14px;
    color: var(--text-secondary, #64748B);
}

.page-jumper input {
    width: 70px;
    text-align: center;
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    color: var(--text-primary, #1E293B);
    transition: all 0.2s ease;
}

.page-jumper input:focus {
    outline: none;
    border-color: var(--primary, #476996);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.page-jumper .btn {
    white-space: nowrap;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--primary, #476996);
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.page-jumper .btn:hover:not(:disabled) {
    background: var(--primary-hover, #35527a);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(71, 105, 150, 0.3);
}

.page-jumper .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .pagination-wrapper {
        flex-direction: column;
        gap: 12px;
        padding: 16px;
    }

    .pagination-info,
    .pagination,
    .page-jumper {
        width: 100%;
        justify-content: center;
    }

    .pagination {
        flex-wrap: wrap;
    }

    .page-size-select {
        width: 100%;
    }
}
</style>
