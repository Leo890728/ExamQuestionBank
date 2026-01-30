<template>
    <div class="tag-admin">
        <!-- Tag Filters -->
        <div class="tag-filters">
            <div class="filter-search">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" class="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input v-model="searchQuery" type="text" placeholder="搜尋標籤..." class="filter-input"
                    @input="handleSearch" />
            </div>
            <button class="action-btn action-btn-primary" @click="showAddModal = true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新增標籤</span>
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>載入中...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="tags.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <h3>尚無標籤</h3>
            <p>點擊「新增標籤」開始建立標籤</p>
        </div>

        <!-- Tag List -->
        <div v-else class="tag-table">
            <div class="table-header">
                <div class="col-name">標籤名稱</div>
                <div class="col-count">使用次數</div>
                <div class="col-date">建立時間</div>
                <div class="col-actions">操作</div>
            </div>
            <div class="table-body">
                <div v-for="tag in filteredTags" :key="tag.id" class="table-row">
                    <div class="col-name">
                        <span class="tag-badge">{{ tag.name }}</span>
                    </div>
                    <div class="col-count">
                        <span class="count-badge">{{ tag.question_count || 0 }} 題</span>
                    </div>
                    <div class="col-date">
                        {{ formatDate(tag.created_at) }}
                    </div>
                    <div class="col-actions">
                        <button class="icon-btn edit-btn" @click="openEditModal(tag)" title="編輯">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete-btn" @click="confirmDelete(tag)" title="刪除">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ showEditModal ? '編輯標籤' : '新增標籤' }}</h3>
                    <button class="modal-close" @click="closeModals">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <label class="form-label">標籤名稱</label>
                    <input v-model="formData.name" type="text" class="form-input" placeholder="輸入標籤名稱..."
                        @keyup.enter="showEditModal ? updateTag() : createTag()" />
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeModals">取消</button>
                    <button class="btn btn-primary" @click="showEditModal ? updateTag() : createTag()"
                        :disabled="!formData.name.trim() || saving">
                        {{ saving ? '儲存中...' : (showEditModal ? '更新' : '新增') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
            <div class="modal modal-delete">
                <div class="modal-header">
                    <h3>確認刪除</h3>
                    <button class="modal-close" @click="showDeleteModal = false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p>確定要刪除標籤「<strong>{{ tagToDelete?.name }}</strong>」嗎？</p>
                    <p class="warning-text" v-if="tagToDelete?.question_count > 0">
                        注意：此標籤已被 {{ tagToDelete.question_count }} 題使用
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
                    <button class="btn btn-danger" @click="deleteTag" :disabled="deleting">
                        {{ deleting ? '刪除中...' : '確定刪除' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import tagService from '@/services/tagService'
import { useTagStore } from '@/stores/tagStore'

// State
const tags = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const tagStore = useTagStore()

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form data
const formData = ref({ name: '' })
const editingTag = ref(null)
const tagToDelete = ref(null)

// Computed
const filteredTags = computed(() => {
    if (!searchQuery.value.trim()) return tags.value
    const query = searchQuery.value.toLowerCase()
    return tags.value.filter(tag => tag.name.toLowerCase().includes(query))
})

// Methods
const loadTags = async () => {
    loading.value = true
    try {
        const response = await tagStore.getTags()
        // API returns paginated response: { count, results: [...] }
        const data = response.data || response
        tags.value = (data.results || data || []).filter(t => t != null)
    } catch (error) {
        console.error('Failed to load tags:', error)
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    // Search is handled by computed property
}

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const closeModals = () => {
    showAddModal.value = false
    showEditModal.value = false
    formData.value = { name: '' }
    editingTag.value = null
}

const openEditModal = (tag) => {
    editingTag.value = tag
    formData.value = { name: tag.name }
    showEditModal.value = true
}

const createTag = async () => {
    if (!formData.value.name.trim()) return
    saving.value = true
    try {
        await tagService.createTag({ name: formData.value.name.trim() })
        tagStore.clearCache()
        closeModals()
        await loadTags()
    } catch (error) {
        console.error('Failed to create tag:', error)
        alert('新增標籤失敗')
    } finally {
        saving.value = false
    }
}

const updateTag = async () => {
    if (!formData.value.name.trim() || !editingTag.value) return
    saving.value = true
    try {
        await tagService.updateTag(editingTag.value.id, { name: formData.value.name.trim() })
        tagStore.clearCache()
        closeModals()
        await loadTags()
    } catch (error) {
        console.error('Failed to update tag:', error)
        alert('更新標籤失敗')
    } finally {
        saving.value = false
    }
}

const confirmDelete = (tag) => {
    tagToDelete.value = tag
    showDeleteModal.value = true
}

const deleteTag = async () => {
    if (!tagToDelete.value) return
    deleting.value = true
    try {
        await tagService.deleteTag(tagToDelete.value.id)
        tagStore.clearCache()
        showDeleteModal.value = false
        tagToDelete.value = null
        await loadTags()
    } catch (error) {
        console.error('Failed to delete tag:', error)
        alert('刪除標籤失敗')
    } finally {
        deleting.value = false
    }
}

// Lifecycle
onMounted(() => {
    loadTags()
})

// Expose methods for parent component
defineExpose({
    loadTags,
    openAddModal: () => { showAddModal.value = true }
})
</script>

<style scoped>
.tag-admin {
    padding: 0;
}

/* Filters */
.tag-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    align-items: center;
}

.filter-search {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
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
    padding: 10px 14px 10px 44px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    background: white;
    transition: all 0.2s;
}

.filter-input:focus {
    outline: none;
    border-color: var(--primary, #476996);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

/* Action Buttons */
.action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.action-btn-primary {
    background: var(--primary, #476996);
    color: white;
    box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.action-btn-primary:hover {
    background: var(--primary-hover, #35527a);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(71, 105, 150, 0.3);
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-secondary, #64748B);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: var(--primary, #476996);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-secondary, #64748B);
    text-align: center;
}

.empty-state svg {
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #1E293B);
    margin: 0 0 8px 0;
}

.empty-state p {
    margin: 0;
    font-size: 14px;
}

/* Table */
.tag-table {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 1fr 120px 140px 100px;
    gap: 16px;
    padding: 14px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #64748B);
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.table-body {
    max-height: 500px;
    overflow-y: auto;
}

.table-row {
    display: grid;
    grid-template-columns: 1fr 120px 140px 100px;
    gap: 16px;
    padding: 14px 20px;
    border-bottom: 1px solid #f1f5f9;
    align-items: center;
    transition: background 0.15s;
}

.table-row:hover {
    background: #f8fafc;
}

.table-row:last-child {
    border-bottom: none;
}

.tag-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: linear-gradient(135deg, #476996, #5a7fb3);
    color: white;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
}

.count-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    background: #f1f5f9;
    color: var(--text-secondary, #64748B);
    border-radius: 16px;
    font-size: 12px;
}

.col-date {
    font-size: 13px;
    color: var(--text-secondary, #64748B);
}

.col-actions {
    display: flex;
    gap: 8px;
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
}

.edit-btn {
    color: var(--primary, #476996);
}

.edit-btn:hover {
    background: rgba(71, 105, 150, 0.1);
}

.delete-btn {
    color: #dc2626;
}

.delete-btn:hover {
    background: rgba(220, 38, 38, 0.1);
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    backdrop-filter: blur(2px);
}

.modal {
    position: relative;
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    height: auto;
    animation: modal-slide-up 0.3s ease-out;
}

@keyframes modal-slide-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #1E293B);
}

.modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary, #64748B);
    cursor: pointer;
    transition: all 0.2s;
}

.modal-close:hover {
    background: #f1f5f9;
    color: var(--text-primary, #1E293B);
}

.modal-body {
    padding: 24px;
}

.form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #1E293B);
    margin-bottom: 8px;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary, #476996);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f1f5f9;
    color: var(--text-secondary, #64748B);
}

.btn-secondary:hover:not(:disabled) {
    background: #e2e8f0;
    color: var(--text-primary, #1E293B);
}

.btn-primary {
    background: var(--primary, #476996);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #35527a);
}

.btn-danger {
    background: #dc2626;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background: #b91c1c;
}

.warning-text {
    margin-top: 12px;
    padding: 12px;
    background: #fef3c7;
    border-radius: 8px;
    color: #92400e;
    font-size: 13px;
}

/* Responsive */
@media (max-width: 768px) {
    .tag-filters {
        flex-direction: column;
    }

    .filter-search {
        max-width: none;
        width: 100%;
    }

    .action-btn {
        width: 100%;
        justify-content: center;
    }

    .table-header {
        display: none;
    }

    .table-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 20px;
    }

    .col-name {
        order: 1;
    }

    .col-count {
        order: 2;
    }

    .col-date {
        order: 3;
        font-size: 12px;
    }

    .col-actions {
        order: 4;
        justify-content: flex-end;
    }
}
</style>
