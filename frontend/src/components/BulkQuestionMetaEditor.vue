<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v18"></path>
              <path d="M3 12h18"></path>
              <path d="M7 3h10v4H7z"></path>
              <path d="M7 17h10v4H7z"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">批次編輯欄位</h3>
            <p class="modal-subtitle">一次更新類科、科目、年份、來源、難度</p>
          </div>
        </div>
        <button class="close-btn" @click="close" :disabled="processing">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="info-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>將套用到 <strong>{{ targetQuestionsCount }}</strong> 題</span>
        </div>

        <div class="form-section">
          <label class="section-label">套用範圍</label>
          <div class="radio-group">
            <label class="radio-card" :class="{ active: applyTo === 'all' }">
              <input type="radio" v-model="applyTo" value="all">
              <div class="radio-content">
                <div class="radio-title">全部題目</div>
                <div class="radio-desc">包含已存與待審題目 ({{ questions.length + pendingQuestions.length }} 題)</div>
              </div>
            </label>
            <label class="radio-card" :class="{ active: applyTo === 'selected' }">
              <input type="radio" v-model="applyTo" value="selected">
              <div class="radio-content">
                <div class="radio-title">已選取</div>
                <div class="radio-desc">只套用到勾選的題目</div>
              </div>
            </label>
          </div>
        </div>

        <div v-if="applyTo === 'selected'" class="form-section">
          <label class="section-label">
            選取題目
            <span class="label-hint">({{ selectedQuestionIds.length + selectedPendingIndices.length }} / {{ questions.length + pendingQuestions.length }})</span>
          </label>
          <div class="question-list-wrapper">
            <div class="question-list">
              <label v-for="q in questions" :key="q.id || q.order" class="question-item">
                <input type="checkbox" v-model="selectedQuestionIds" :value="q.id || q.question">
                <div class="question-info">
                  <div class="question-content">{{ q.question_content || q.content || q.pendingData?.content || '（無題幹）' }}</div>
                  <div class="question-meta">
                    <span class="meta-id">ID: {{ q.id || q.question || q.order }}</span>
                    <span v-if="q.subject" class="meta-subject">{{ q.subject }}</span>
                  </div>
                </div>
              </label>
              <label v-for="(q, index) in pendingQuestions" :key="`pending-${index}`" class="question-item pending-item">
                <input type="checkbox" v-model="selectedPendingIndices" :value="index">
                <div class="question-info">
                  <div class="question-content">
                    <span class="pending-badge">待審</span>
                    {{ q.content || '（無題幹）' }}
                  </div>
                  <div class="question-meta">
                    <span class="meta-id">序號: {{ index + 1 }}</span>
                    <span v-if="q.subject" class="meta-subject">{{ q.subject }}</span>
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

        <div class="form-section">
          <label class="section-label">要修改的欄位</label>
          <div class="field-grid">
            <div class="field-row">
              <label class="field-toggle">
                <input type="checkbox" v-model="applyCategory">
                <span>類科</span>
              </label>
              <input
                v-model="categoryValue"
                class="field-input"
                type="text"
                placeholder="留空則清空"
                :disabled="processing || !applyCategory"
              />
            </div>
            <div class="field-row">
              <label class="field-toggle">
                <input type="checkbox" v-model="applySubject">
                <span>科目</span>
              </label>
              <input
                v-model="subjectValue"
                class="field-input"
                type="text"
                placeholder="留空則清空"
                :disabled="processing || !applySubject"
              />
            </div>
            <div class="field-row">
              <label class="field-toggle">
                <input type="checkbox" v-model="applyYear">
                <span>年份</span>
              </label>
              <input
                v-model="yearValue"
                class="field-input"
                type="number"
                min="0"
                step="1"
                placeholder="留空則清空"
                :disabled="processing || !applyYear"
              />
            </div>
            <div class="field-row">
              <label class="field-toggle">
                <input type="checkbox" v-model="applySource">
                <span>來源</span>
              </label>
              <input
                v-model="sourceValue"
                class="field-input"
                type="text"
                placeholder="留空則清空"
                :disabled="processing || !applySource"
              />
            </div>
            <div class="field-row">
              <label class="field-toggle">
                <input type="checkbox" v-model="applyDifficulty">
                <span>難度</span>
              </label>
              <select v-model="difficultyValue" class="field-select" :disabled="processing || !applyDifficulty">
                <option value="easy">簡單</option>
                <option value="normal">普通</option>
                <option value="hard">困難</option>
                <option value="insane">超難</option>
              </select>
            </div>
          </div>
          <div class="field-hint">只會套用已勾選欄位；留空表示清空。</div>
        </div>

        <div v-if="hasChanges && targetQuestionsCount > 0" class="preview-section">
          <div class="preview-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            預覽
          </div>
          <div class="preview-content">
            將更新 <strong>{{ targetQuestionsCount }}</strong> 題的已勾選欄位
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close" :disabled="processing">取消</button>
        <button class="btn-apply" :disabled="processing || !hasChanges || targetQuestionsCount === 0" @click="apply">
          <span v-if="processing" class="spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ processing ? '更新中...' : '套用更新' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import questionService from '@/services/questionService'

const props = defineProps({
  questions: { type: Array, required: true },
  pendingQuestions: { type: Array, required: true },
  preselectedIds: { type: Array, default: () => [] },
  preselectedPendingIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'applied'])

const hasPreselection = props.preselectedIds.length > 0 || props.preselectedPendingIds.length > 0
const applyTo = ref(hasPreselection ? 'selected' : 'all')
const selectedQuestionIds = ref([...props.preselectedIds])
const selectedPendingIndices = ref([...props.preselectedPendingIds])
const processing = ref(false)

const applyCategory = ref(false)
const categoryValue = ref('')
const applySubject = ref(false)
const subjectValue = ref('')
const applyYear = ref(false)
const yearValue = ref('')
const applySource = ref(false)
const sourceValue = ref('')
const applyDifficulty = ref(false)
const difficultyValue = ref('normal')

const hasChanges = computed(() => (
  applyCategory.value ||
  applySubject.value ||
  applyYear.value ||
  applySource.value ||
  applyDifficulty.value
))

const getId = (q) => q.question ?? q.id

const targetQuestions = computed(() => {
  if (applyTo.value === 'all') return props.questions
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

const normalizeText = (value) => {
  if (value === null || value === undefined) return null
  const text = value.toString().trim()
  return text.length ? text : null
}

const normalizeYear = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const buildPatch = () => {
  const patch = {}
  if (applyCategory.value) patch.category = normalizeText(categoryValue.value)
  if (applySubject.value) patch.subject = normalizeText(subjectValue.value)
  if (applyYear.value) patch.year = normalizeYear(yearValue.value)
  if (applySource.value) patch.source = normalizeText(sourceValue.value)
  if (applyDifficulty.value) patch.difficulty = difficultyValue.value || 'normal'
  return patch
}

const apply = async () => {
  if (!hasChanges.value) return
  processing.value = true
  const errors = []
  let successCount = 0
  const pendingUpdates = []
  const patch = buildPatch()

  for (const idx of targetPendingIndices.value) {
    try {
      if (props.pendingQuestions[idx]) {
        pendingUpdates.push({ index: idx, ...patch })
      }
    } catch (err) {
      errors.push({ id: `pending-${idx}`, error: err.message })
    }
  }

  const savedUpdates = targetQuestions.value.map((q) => ({
    id: getId(q),
    ...patch
  }))

  if (savedUpdates.length > 0) {
    try {
      const res = await questionService.bulkUpdateQuestions(savedUpdates)
      const results = res.data?.results || res.data || []
      for (const r of results) {
        if (r.success) successCount++
        else errors.push({ id: r.index ?? r.id, error: r.errors })
      }
    } catch (err) {
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
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  width: 92%;
  max-width: 760px;
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

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #e5e7eb;
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

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

.radio-group {
  display: grid;
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

.question-list-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.question-list {
  max-height: 280px;
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

.field-grid {
  display: grid;
  gap: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
}

.field-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.field-input,
.field-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  background: white;
  transition: all 0.2s ease;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: var(--primary, #476996);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.field-input:disabled,
.field-select:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.field-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.preview-section {
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  margin-top: 8px;
}

.preview-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 8px;
}

.preview-content {
  font-size: 14px;
  color: #15803d;
}

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

@media (max-width: 768px) {
  .modal-container {
    width: 94%;
  }

  .field-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
