<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">批次編輯標籤</h3>
            <p class="modal-subtitle">批次新增或移除題目標籤</p>
          </div>
        </div>
        <button class="close-btn" @click="close" :disabled="processing">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Info Banner -->
        <div class="info-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>將為 <strong>{{ targetQuestionsCount }}</strong> 個題目 <strong>{{ mode === 'add' ? '新增' : '移除' }}</strong> 標籤</span>
        </div>

        <!-- 套用範圍 -->
        <div class="form-section">
          <label class="section-label">套用範圍</label>
          <div class="radio-group-horizontal">
            <label class="radio-card" :class="{ active: applyTo === 'all' }">
              <input type="radio" v-model="applyTo" value="all">
              <div class="radio-content">
                <div class="radio-title">全部題目</div>
                <div class="radio-desc">套用至當前頁面所有題目 ({{ questions.length + pendingQuestions.length }} 題)</div>
              </div>
            </label>
            <label class="radio-card" :class="{ active: applyTo === 'selected' }">
              <input type="radio" v-model="applyTo" value="selected">
              <div class="radio-content">
                <div class="radio-title">選取題目</div>
                <div class="radio-desc">僅套用至勾選的題目</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 選擇題目 -->
        <div v-if="applyTo === 'selected'" class="form-section">
          <label class="section-label">
            選擇題目
            <span class="label-hint">({{ selectedQuestionIds.length + selectedPendingIndices.length }} / {{ questions.length + pendingQuestions.length }})</span>
          </label>
          <div class="question-list-wrapper">
            <div class="question-list">
              <!-- 列表題目 -->
              <label v-for="q in questions" :key="q.id || q.order" class="question-item">
                <input type="checkbox" v-model="selectedQuestionIds" :value="q.id || q.question">
                <div class="question-info">
                  <div class="question-content">{{ q.question_content || q.content || q.pendingData?.content || '未命名題目' }}</div>
                  <div class="question-meta">
                    <span class="meta-id">ID: {{ q.id || q.question || q.order }}</span>
                    <span v-if="q.subject" class="meta-subject">{{ q.subject }}</span>
                  </div>
                  <div v-if="q.tags && q.tags.length > 0" class="question-tags">
                    <span v-for="tag in q.tags" :key="tag.id" class="question-tag">{{ tag.name }}</span>
                  </div>
                </div>
              </label>
              <!-- 暫存題目 -->
              <label v-for="(q, index) in pendingQuestions" :key="`pending-${index}`" class="question-item pending-item">
                <input type="checkbox" v-model="selectedPendingIndices" :value="index">
                <div class="question-info">
                  <div class="question-content">
                    <span class="pending-badge">暫存</span>
                    {{ q.content || '未命名題目' }}
                  </div>
                  <div class="question-meta">
                    <span class="meta-id">編號: {{ index + 1 }}</span>
                    <span v-if="q.subject" class="meta-subject">{{ q.subject }}</span>
                  </div>
                  <div v-if="q.tags && q.tags.length > 0" class="question-tags">
                    <span v-for="tag in q.tags" :key="tag.id" class="question-tag">{{ tag.name }}</span>
                  </div>
                </div>
              </label>
            </div>
            <div class="list-actions">
              <button type="button" class="text-btn" @click="selectAll">全選</button>
              <button type="button" class="text-btn" @click="deselectAll">取消全選</button>
            </div>
          </div>
        </div>

        <!-- 標籤操作 -->
        <div class="form-section">
          <label class="section-label">標籤操作</label>
          <div class="mode-selection">
            <div class="mode-card" :class="{ active: mode === 'add' }" @click="mode = 'add'">
              <div class="mode-radio"></div>
              <div class="mode-label">
                <div class="mode-label-title">➕ 新增標籤</div>
                <div class="mode-label-desc">將選定標籤加入題目</div>
              </div>
            </div>
            <div class="mode-card" :class="{ active: mode === 'remove' }" @click="mode = 'remove'">
              <div class="mode-radio"></div>
              <div class="mode-label">
                <div class="mode-label-title">➖ 移除標籤</div>
                <div class="mode-label-desc">從題目中移除選定標籤</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 標籤選擇 -->
        <div class="form-section">
          <label class="section-label">
            選擇標籤 
            <span class="required">*</span>
          </label>
          <div class="tags-input-card">
            <multiselect 
              v-model="selectedTags" 
              :options="tagOptions" 
              :multiple="true" 
              track-by="id" 
              label="name" 
              placeholder="點擊選擇標籤..."
              :disabled="processing"
            />
          </div>
          
          <!-- 新增標籤區塊 -->
          <div class="new-tag-section">
            <label class="section-label-small">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新增標籤
            </label>
            <div class="new-tag-input-group">
              <input 
                v-model="newTagName" 
                type="text" 
                class="new-tag-input" 
                placeholder="輸入新標籤名稱" 
                @keyup.enter="handleCreateTag"
                :disabled="processing"
              />
              <button 
                type="button" 
                class="btn-create-tag" 
                @click="handleCreateTag"
                :disabled="processing || !newTagName.trim()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                建立
              </button>
            </div>
          </div>
          
          <!-- 預覽變更 -->
          <div v-if="selectedTags.length > 0" class="preview-section">
            <div class="preview-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span class="preview-title">預覽變更</span>
            </div>
            <div class="preview-content">
              將 <strong>{{ mode === 'add' ? '新增' : '移除' }}</strong> 以下標籤：
              <div class="tag-preview-list">
                <span v-for="tag in selectedTags" :key="tag.id" class="tag-chip">{{ tag.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="close" :disabled="processing">
          取消
        </button>
        <button class="btn-apply" :disabled="processing || selectedTags.length === 0" @click="apply">
          <div v-if="processing" class="spinner"></div>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ processing ? '處理中...' : '套用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import tagService from '@/services/tagService'
import { useTagStore } from '@/stores/tagStore'
import questionService from '@/services/questionService'
import { useQuestionDetailStore } from '@/stores/questionDetailStore'

const props = defineProps({
  questions: { type: Array, required: true }, // examQuestions list
  pendingQuestions: { type: Array, required: true },
  examId: { type: Number, required: false },
  preselectedIds: { type: Array, default: () => [] },
  preselectedPendingIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'applied'])

const hasPreselection = props.preselectedIds.length > 0 || props.preselectedPendingIds.length > 0
const applyTo = ref(hasPreselection ? 'selected' : 'all')
const mode = ref('add')
const tagOptions = ref([])
const selectedTags = ref([])
const selectedQuestionIds = ref([...props.preselectedIds])
const selectedPendingIndices = ref([...props.preselectedPendingIds])
const processing = ref(false)
const newTagName = ref('')
const tagStore = useTagStore()
const questionDetailStore = useQuestionDetailStore()

onMounted(async () => {
  console.log('BulkTagEditor mounted. preselectedIds=', props.preselectedIds)
  try {
    const res = await tagStore.getTags()
    let items = res.data?.results || res.data
    if (!Array.isArray(items)) items = []
    tagOptions.value = items
  } catch (err) {
    console.error('載入標籤失敗', err)
  }
})

onUnmounted(() => {
  console.log('BulkTagEditor unmounted')
})

const getId = (q) => q.question ?? q.id
const contentOf = (q) => q.question_content ?? q.content ?? q.pendingData?.content

const targetQuestions = computed(() => {
  if (applyTo.value === 'all') {
    return props.questions
  }
  return props.questions.filter(q => selectedQuestionIds.value.includes(q.id) || selectedQuestionIds.value.includes(q.question))
})

const targetPendingIndices = computed(() => {
  if (applyTo.value === 'all') {
    return props.pendingQuestions.map((_, idx) => idx)
  }
  return selectedPendingIndices.value
})

const targetQuestionsCount = computed(() => targetQuestions.value.length + targetPendingIndices.value.length)

const selectAll = () => {
  selectedQuestionIds.value = props.questions.map(q => q.id || q.question)
  selectedPendingIndices.value = props.pendingQuestions.map((_, idx) => idx)
}

const deselectAll = () => {
  selectedQuestionIds.value = []
  selectedPendingIndices.value = []
}

const handleCreateTag = async () => {
  const name = newTagName.value?.trim()
  if (!name) return
  
  try {
    const resp = await tagService.createTag({ name })
    const createdTag = resp.data
    if (!createdTag || !createdTag.id) {
      throw new Error('Invalid tag returned')
    }
    
    // Add to local options if not exists
    if (!tagOptions.value.find(t => t.id === createdTag.id)) {
      tagOptions.value.push(createdTag)
      // sort by name
      tagOptions.value.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    // Add to selectedTags
    if (!selectedTags.value.find(t => t.id === createdTag.id)) {
      selectedTags.value.push(createdTag)
    }
    
    tagStore.clearCache()
    newTagName.value = ''
  } catch (err) {
    console.error('建立標籤失敗:', err)
    alert('建立標籤失敗')
  }
}

const apply = async () => {
  processing.value = true
  const errors = []
  let successCount = 0
  const pendingUpdates = []

  const savedUpdates = []
  
  // 處理暫存題目
  for (const idx of targetPendingIndices.value) {
    try {
      const current = props.pendingQuestions[idx]
      if (current) {
        const currentTagIds = current.tag_ids || []
        const currentTags = current.tags || []
        const tagIds = selectedTags.value.map(t => t.id)
        let newTagIds = []
        let newTags = []
        
        if (mode.value === 'add') {
          newTagIds = Array.from(new Set([...currentTagIds, ...tagIds]))
          // 合併標籤對象
          const existingTagMap = new Map(currentTags.map(t => [t.id, t]))
          selectedTags.value.forEach(t => existingTagMap.set(t.id, t))
          newTags = Array.from(existingTagMap.values())
        } else {
          newTagIds = currentTagIds.filter(id => !tagIds.includes(id))
          newTags = currentTags.filter(t => !tagIds.includes(t.id))
        }
        
        pendingUpdates.push({ 
          index: idx, 
          tag_ids: newTagIds,
          tags: newTags
        })
      }
    } catch (err) {
      console.error('更新暫存題目標籤失敗', idx, err)
      errors.push({ id: `pending-${idx}`, error: err.message })
    }
  }
  
  // 處理已保存的題目
  for (const q of targetQuestions.value) {
    try {
      const id = getId(q)
      let currentQuestion = q.questionDetail
      if (!currentQuestion) {
        currentQuestion = await questionDetailStore.getQuestion(id)
      }
      const currentTagIds = currentQuestion.tags ? currentQuestion.tags.map(t => t.id) : []
      const tagIdsToModify = selectedTags.value.map(t => t.id)
      let newTagIds
      if (mode.value === 'add') {
        newTagIds = Array.from(new Set([...currentTagIds, ...tagIdsToModify]))
      } else {
        newTagIds = currentTagIds.filter(id => !tagIdsToModify.includes(id))
      }
      savedUpdates.push({ id: id, tag_ids: newTagIds })
    } catch (err) {
      console.error('更新題目標籤失敗', q, err)
      errors.push({ id: q.question || q.id || q.order, error: err.response?.data || err.message })
    }
  }

  // Execute bulk update for saved questions if any
  if (savedUpdates.length > 0) {
    console.log('BulkTagEditor - savedUpdates payload:', savedUpdates)
    try {
      const res = await questionService.bulkUpdateQuestions(savedUpdates)
      console.log('BulkTagEditor - bulk update response:', res.data)
      const results = res.data?.results || res.data
      for (const r of results) {
        if (r.success) successCount++
        else errors.push({ id: r.index ?? r.id, error: r.errors })
      }
    } catch (err) {
      console.error('批次更新失敗', err)
      errors.push({ id: 'bulk-update', error: err.response?.data || err.message })
    }
  }

  processing.value = false
  emit('applied', { successCount, errors, pendingUpdates })
  close()
}

const close = () => emit('close')
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Container */
.modal-container {
  width: 90%;
  max-width: 720px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #CBD5E1;
}

.header-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex: 1;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary, #476996);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #111827;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Info Banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--primary-soft, #EEF2FF);
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
  color: var(--text-primary, #1E293B);
  font-size: 14px;
  margin-bottom: 24px;
}

.info-banner svg {
  color: var(--primary, #476996);
  flex-shrink: 0;
}

.info-banner strong {
  color: var(--primary, #476996);
  font-weight: 600;
}

/* Form Section */
.form-section {
  margin-bottom: 24px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin-bottom: 12px;
}

.label-hint {
  font-weight: 400;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
}

.required {
  color: #ef4444;
}

/* Radio Group */
.radio-group {
  display: grid;
  gap: 12px;
}

.radio-group-horizontal {
  display: flex;
  gap: 12px;
}

.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.radio-card:hover {
  border-color: var(--primary, #476996);
  background: #f8fafc;
}

.radio-card.active {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
}

.radio-card input[type="radio"] {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary, #476996);
}

.radio-content {
  flex: 1;
}

.radio-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin-bottom: 4px;
}

.radio-desc {
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

/* Mode Selection */
.mode-selection {
  display: flex;
  gap: 12px;
}

.mode-card {
  flex: 1;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-card:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mode-card.active {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.mode-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mode-card.active .mode-radio {
  border-color: var(--primary, #476996);
}

.mode-card.active .mode-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--primary, #476996);
  border-radius: 50%;
}

.mode-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-label-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.mode-label-desc {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

/* Question List */
.question-list-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.question-list {
  max-height: 300px;
  overflow-y: auto;
}

.question-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.15s;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background: #f9fafb;
}

.question-item input[type="checkbox"] {
  margin-top: 4px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary, #476996);
}

.question-info {
  flex: 1;
  min-width: 0;
}

.question-content {
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.question-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.meta-id {
  font-family: monospace;
}

.meta-subject {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.question-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary, #476996);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.pending-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fff7eb;
  color: #d89b32;
  border: 1px solid #d89b32;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 8px;
}

.pending-item {
  background: #fffbf5;
  border-color: #f7d7a8;
}

.list-actions {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.text-btn {
  border: none;
  background: none;
  color: var(--primary, #476996);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}

.text-btn:hover {
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary-hover, #35527a);
}

/* Tags Input */
.tags-input-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.tags-input-card:focus-within {
  border-color: var(--primary, #476996);
  background: white;
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

/* New Tag Section */
.new-tag-section {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
}

.section-label-small {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #64748B);
  margin-bottom: 10px;
}

.section-label-small svg {
  color: var(--primary, #476996);
}

.new-tag-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.new-tag-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  background: white;
  transition: all 0.2s ease;
}

.new-tag-input:focus {
  outline: none;
  border-color: var(--primary, #476996);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.new-tag-input::placeholder {
  color: #94a3b8;
}

.btn-create-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--primary, #476996);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-create-tag:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(71, 105, 150, 0.25);
}

.btn-create-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Multiselect styling */
:deep(.multiselect) {
  min-height: 44px;
}

:deep(.multiselect__tags) {
  border: none;
  background: transparent;
  padding: 4px;
  min-height: 40px;
}

:deep(.multiselect__tag) {
  background: var(--primary, #476996);
  color: white;
  border-radius: 6px;
  padding: 6px 26px 6px 10px;
  margin: 2px 4px 2px 0;
}

:deep(.multiselect__tag-icon:after) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.multiselect__tag-icon:hover) {
  background: var(--primary-hover, #35527a);
}

:deep(.multiselect__option--highlight) {
  background: var(--primary, #476996);
}

:deep(.multiselect__option--selected) {
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary, #476996);
}

/* Preview */
.preview-section {
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  margin-top: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 8px;
}

.preview-header svg {
  color: #16a34a;
}

.preview-content {
  font-size: 14px;
  color: #15803d;
  line-height: 1.6;
}

.preview-content strong {
  color: #14532d;
  font-weight: 600;
}

.tag-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.btn-cancel,
.btn-apply {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.btn-cancel {
  background: white;
  color: var(--text-secondary, #64748B);
  border: 1px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-apply {
  background: var(--primary, #476996);
  color: white;
  border: none;
}

.btn-apply:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.4);
  transform: translateY(-1px);
}

.btn-apply:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Scrollbar */
.question-list::-webkit-scrollbar {
  width: 8px;
}

.question-list::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.question-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.question-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Dark Mode */
:root[data-theme="dark"] .modal-container,
.dark .modal-container {
  background: #0f172a;
  border: 1px solid #334155;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

:root[data-theme="dark"] .modal-header,
.dark .modal-header {
  border-bottom-color: #334155;
}

:root[data-theme="dark"] .modal-title,
.dark .modal-title {
  color: #f8fafc;
}

:root[data-theme="dark"] .modal-subtitle,
.dark .modal-subtitle {
  color: #94a3b8;
}

:root[data-theme="dark"] .close-btn,
.dark .close-btn {
  background: #1e293b;
  color: #94a3b8;
}

:root[data-theme="dark"] .close-btn:hover:not(:disabled),
.dark .close-btn:hover:not(:disabled) {
  background: #334155;
  color: #f8fafc;
}

:root[data-theme="dark"] .modal-body,
.dark .modal-body {
  background: #0f172a;
}

:root[data-theme="dark"] .info-banner,
.dark .info-banner {
  background: #1e293b;
  border-color: #334155;
  color: #e2e8f0;
}

:root[data-theme="dark"] .info-banner strong,
.dark .info-banner strong {
  color: #bfdbfe;
}

:root[data-theme="dark"] .section-label,
.dark .section-label {
  color: #e2e8f0;
}

:root[data-theme="dark"] .label-hint,
.dark .label-hint {
  color: #94a3b8;
}

:root[data-theme="dark"] .radio-card,
.dark .radio-card {
  background: #0f172a;
  border-color: #334155;
}

:root[data-theme="dark"] .radio-card:hover,
.dark .radio-card:hover {
  background: #1e293b;
  border-color: #60a5fa;
}

:root[data-theme="dark"] .radio-card.active,
.dark .radio-card.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #60a5fa;
}

:root[data-theme="dark"] .radio-title,
.dark .radio-title {
  color: #f8fafc;
}

:root[data-theme="dark"] .radio-desc,
.dark .radio-desc {
  color: #94a3b8;
}

:root[data-theme="dark"] .question-list-wrapper,
.dark .question-list-wrapper {
  border-color: #334155;
}

:root[data-theme="dark"] .question-item,
.dark .question-item {
  border-bottom-color: #1f2937;
}

:root[data-theme="dark"] .question-item:hover,
.dark .question-item:hover {
  background: #1e293b;
}

:root[data-theme="dark"] .question-content,
.dark .question-content {
  color: #e2e8f0;
}

:root[data-theme="dark"] .question-meta,
.dark .question-meta {
  color: #94a3b8;
}

:root[data-theme="dark"] .meta-subject,
.dark .meta-subject {
  background: #334155;
  color: #e2e8f0;
}

:root[data-theme="dark"] .question-tag,
.dark .question-tag {
  background: rgba(59, 130, 246, 0.2);
  color: #bfdbfe;
}

:root[data-theme="dark"] .pending-badge,
.dark .pending-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border-color: #f59e0b;
}

:root[data-theme="dark"] .pending-item,
.dark .pending-item {
  background: #1f2937;
  border-color: #a16207;
}

:root[data-theme="dark"] .list-actions,
.dark .list-actions {
  background: #0f172a;
  border-top-color: #334155;
}

:root[data-theme="dark"] .text-btn,
.dark .text-btn {
  color: #93c5fd;
}

:root[data-theme="dark"] .text-btn:hover,
.dark .text-btn:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #bfdbfe;
}

:root[data-theme="dark"] .tags-input-card,
.dark .tags-input-card {
  background: #0f172a;
  border-color: #334155;
}

:root[data-theme="dark"] .tags-input-card:focus-within,
.dark .tags-input-card:focus-within {
  background: #0f172a;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

:root[data-theme="dark"] .new-tag-section,
.dark .new-tag-section {
  background: #0f172a;
  border-color: #334155;
}

:root[data-theme="dark"] .section-label-small,
.dark .section-label-small {
  color: #94a3b8;
}

:root[data-theme="dark"] .section-label-small svg,
.dark .section-label-small svg {
  color: #93c5fd;
}

:root[data-theme="dark"] .new-tag-input,
.dark .new-tag-input {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

:root[data-theme="dark"] .new-tag-input:focus,
.dark .new-tag-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

:root[data-theme="dark"] .new-tag-input::placeholder,
.dark .new-tag-input::placeholder {
  color: #64748b;
}

:root[data-theme="dark"] .preview-section,
.dark .preview-section {
  background: #052e1a;
  border-color: #14532d;
}

:root[data-theme="dark"] .preview-header,
.dark .preview-header {
  color: #bbf7d0;
}

:root[data-theme="dark"] .preview-header svg,
.dark .preview-header svg {
  color: #34d399;
}

:root[data-theme="dark"] .preview-content,
.dark .preview-content {
  color: #86efac;
}

:root[data-theme="dark"] .preview-content strong,
.dark .preview-content strong {
  color: #d1fae5;
}

:root[data-theme="dark"] .tag-chip,
.dark .tag-chip {
  background: rgba(34, 197, 94, 0.2);
  color: #bbf7d0;
}

:root[data-theme="dark"] .modal-footer,
.dark .modal-footer {
  background: #0f172a;
  border-top-color: #334155;
}

:root[data-theme="dark"] .btn-cancel,
.dark .btn-cancel {
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}

:root[data-theme="dark"] .btn-cancel:hover:not(:disabled),
.dark .btn-cancel:hover:not(:disabled) {
  background: #334155;
  border-color: #475569;
}

:root[data-theme="dark"] .question-list::-webkit-scrollbar-track,
.dark .question-list::-webkit-scrollbar-track {
  background: #1f2937;
}

:root[data-theme="dark"] .question-list::-webkit-scrollbar-thumb,
.dark .question-list::-webkit-scrollbar-thumb {
  background: #475569;
}

:root[data-theme="dark"] .question-list::-webkit-scrollbar-thumb:hover,
.dark .question-list::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
