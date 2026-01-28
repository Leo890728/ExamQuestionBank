<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div>
            <h3 class="modal-title">批次編輯科目</h3>
            <p class="modal-subtitle">為選定的題目統一設定科目名稱</p>
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
          <span>將為 <strong>{{ targetQuestionsCount }}</strong> 個題目設定科目</span>
        </div>

        <!-- Scope Selection -->
        <div class="form-section">
          <label class="section-label">套用範圍</label>
          <div class="radio-group">
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
                <div class="radio-title">已選取題目</div>
                <div class="radio-desc">僅套用至已勾選的題目 ({{ preselectedIds.length + preselectedPendingIds.length }} 題)</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Question List (when selected scope) -->
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
                    <span class="meta-id">ID: {{ q.id || q.question }}</span>
                    <span v-if="q.subject" class="meta-subject">{{ q.subject }}</span>
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
                </div>
              </label>
            </div>
            <div class="list-actions">
              <button type="button" class="text-btn" @click="selectAll">全選</button>
              <button type="button" class="text-btn" @click="deselectAll">取消全選</button>
            </div>
          </div>
        </div>

        <!-- Subject Input -->
        <div class="form-section">
          <label class="section-label" for="subject-input">
            科目名稱
            <span class="required">*</span>
          </label>
          <input 
            id="subject-input"
            v-model="selectedSubject" 
            type="text" 
            class="subject-input" 
            placeholder="例如：數學、英文、國文..."
            :disabled="processing"
            @keyup.enter="!processing && selectedSubject && apply()"
          >
          <div v-if="!selectedSubject" class="field-hint">請輸入要設定的科目名稱</div>
        </div>

        <!-- Preview -->
        <div v-if="selectedSubject && targetQuestionsCount > 0" class="preview-section">
          <div class="preview-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            預覽
          </div>
          <div class="preview-content">
            將 {{ targetQuestionsCount }} 個題目的科目設定為：
            <span class="preview-subject">「{{ selectedSubject }}」</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="close" :disabled="processing">
          取消
        </button>
        <button 
          class="btn-apply" 
          :disabled="processing || !selectedSubject || targetQuestionsCount === 0" 
          @click="apply"
        >
          <span v-if="processing" class="spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ processing ? '處理中...' : '確認套用' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import questionService from '@/services/questionService'

const props = defineProps({
  questions: { type: Array, required: true },
  pendingQuestions: { type: Array, required: true },
  examId: { type: Number, required: false },
  preselectedIds: { type: Array, default: () => [] },
  preselectedPendingIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'applied'])

const hasPreselection = props.preselectedIds.length > 0 || props.preselectedPendingIds.length > 0
const applyTo = ref(hasPreselection ? 'selected' : 'all')
const selectedSubject = ref('')
const selectedQuestionIds = ref([...props.preselectedIds])
const selectedPendingIndices = ref([...props.preselectedPendingIds])
const processing = ref(false)

onMounted(() => {
  console.log('BulkSubjectEditor mounted. preselectedIds=', props.preselectedIds)
  // 不需要載入科目選項，使用者直接輸入
})

onUnmounted(() => {
  console.log('BulkSubjectEditor unmounted')
})

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

const getId = (q) => q.question ?? q.id
const apply = async () => {
  processing.value = true
  const errors = []
  let successCount = 0
  const pendingUpdates = []

  // 處理暫存題目
  for (const idx of targetPendingIndices.value) {
    try {
      const current = props.pendingQuestions[idx]
      if (current) {
        pendingUpdates.push({ 
          index: idx, 
          subject: selectedSubject.value,
          category: current.category // 保留原有的 category
        })
      }
    } catch (err) {
      console.error('更新暫存題目科目失敗', idx, err)
      errors.push({ id: `pending-${idx}`, error: err.message })
    }
  }

  // 處理已保存的題目
  const savedUpdates = []
  for (const q of targetQuestions.value) {
    try {
      const id = getId(q)
      savedUpdates.push({ id: id, subject: selectedSubject.value })
    } catch (err) {
      console.error('更新題目科目失敗', q, err)
      errors.push({ id: q.question || q.id || q.order, error: err.response?.data || err.message })
    }
  }

  // Execute bulk update for saved questions if any
  if (savedUpdates.length > 0) {
    try {
      const res = await questionService.bulkUpdateQuestions(savedUpdates)
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
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 700px;
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
  color: #111827;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: #6b7280;
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
  flex-shrink: 0;
}

.info-banner strong {
  color: #1e3a8a;
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
  color: #374151;
  margin-bottom: 12px;
}

.label-hint {
  font-weight: 400;
  color: #9ca3af;
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
  color: #111827;
  margin-bottom: 4px;
}

.radio-desc {
  font-size: 13px;
  color: #6b7280;
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
  color: #374151;
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
  color: #9ca3af;
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

/* Subject Input */
.subject-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
}

.subject-input:focus {
  outline: none;
  border-color: var(--primary, #476996);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.subject-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.field-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #9ca3af;
}

/* Preview */
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

.preview-subject {
  font-weight: 600;
  color: #14532d;
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
  color: #6b7280;
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

:root[data-theme="dark"] .subject-input,
.dark .subject-input {
  background: #0f172a;
  border-color: #334155;
  color: #e2e8f0;
}

:root[data-theme="dark"] .subject-input:focus,
.dark .subject-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

:root[data-theme="dark"] .subject-input:disabled,
.dark .subject-input:disabled {
  background: #0b1220;
}

:root[data-theme="dark"] .field-hint,
.dark .field-hint {
  color: #94a3b8;
}

:root[data-theme="dark"] .preview-section,
.dark .preview-section {
  background: #052e1a;
  border-color: #14532d;
}

:root[data-theme="dark"] .preview-label,
.dark .preview-label {
  color: #bbf7d0;
}

:root[data-theme="dark"] .preview-content,
.dark .preview-content {
  color: #86efac;
}

:root[data-theme="dark"] .preview-subject,
.dark .preview-subject {
  color: #d1fae5;
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
