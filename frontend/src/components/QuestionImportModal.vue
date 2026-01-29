<template>
<!-- Import Modal -->
<div v-if="showImportModal" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content modern-modal">
      <div class="modern-modal-header">
        <div class="header-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div class="header-content-wrapper">
          <h5 class="modern-modal-title">匯入題目</h5>
          <p class="modern-modal-subtitle">選擇匯入方式並檢視結果</p>
        </div>
        <button type="button" class="modern-close-btn" @click="closeImportModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body modern-modal-body">
        <div class="import-steps">
          <button type="button" class="step-item" :class="{ active: importStep >= 1, current: importStep === 1 }"
            @click="goToImportStep(1)">
            <span class="step-index">1</span>
            <span class="step-label">選擇方式</span>
          </button>
          <div class="step-divider"></div>
          <button type="button" class="step-item" :class="{ active: importStep >= 2, current: importStep === 2 }"
            :disabled="importStep < 2" @click="goToImportStep(2)">
            <span class="step-index">2</span>
            <span class="step-label">上傳檔案</span>
          </button>
          <div class="step-divider"></div>
          <button type="button" class="step-item" :class="{ active: importStep >= 3, current: importStep === 3 }"
            :disabled="importStep < 3" @click="goToImportStep(3)">
            <span class="step-index">3</span>
            <span class="step-label">匯入結果</span>
          </button>
        </div>

        <!-- Step 1: Choose type -->
        <div v-if="importStep === 1" class="import-step">
          <div class="import-options">
            <div class="import-option" @click="selectImportType('json')">
              <div class="option-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </div>
              <div class="option-content">
                <h6 class="option-title">JSON 檔案</h6>
                <p class="option-description">匯入符合格式的 JSON 題目檔案</p>
                <div class="option-hint">建議格式: .json</div>
              </div>
              <div class="option-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>

            <div class="import-option" @click="selectImportType('pdf')">
              <div class="option-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div class="option-content">
                <h6 class="option-title">PDF 檔案</h6>
                <p class="option-description">匯入考卷 PDF 自動解析題目與答案</p>
                <div class="option-hint">建議格式: .pdf</div>
              </div>
              <div class="option-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Upload -->
        <div v-else-if="importStep === 2" class="import-step">
          <div class="import-step-header">
            <div class="step-title">上傳 {{ importTypeLabel }} 檔案</div>
            <button type="button" class="link-btn" @click="goToImportStep(1)">返回選擇方式</button>
          </div>

          <!-- JSON Import Section -->
          <div v-if="importType === 'json'" class="import-section">
            <div class="upload-zone" @click="jsonFileInput?.click()" @dragover.prevent
              @drop.prevent="handleJsonDrop">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p class="upload-text">點擊或拖曳檔案到此</p>
              <p class="upload-hint">支援 JSON 檔案</p>
              <input ref="jsonFileInput" type="file" accept=".json,application/json" style="display: none"
                @change="handleJsonFileSelect" />
            </div>
            <div v-if="selectedJsonFile" class="selected-file">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
              <span>{{ selectedJsonFile.name }}</span>
              <button @click="clearJsonFile" class="btn-clear-file">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- PDF Import Section -->
          <div v-else-if="importType === 'pdf'" class="import-section">
            <PdfUploadSection ref="pdfUploadRef" :show-result="false" :show-header="false"
              @preview-ready="handlePdfPreview" @error="handlePdfError" />
            <div v-if="pdfErrorMessage" class="import-alert import-alert-error">
              {{ pdfErrorMessage }}
            </div>
          </div>
        </div>

        <!-- Step 3: Result -->
        <div v-else-if="importStep === 3" class="import-step">
          <div class="import-result-card">
            <div class="import-result-header">
              <div class="import-result-title">匯入結果預覽</div>
              <div class="import-result-subtitle">
                {{ importTypeLabel }} 共 {{ previewQuestions.length }} 題 </div>
            </div>
            <div class="import-result-body">
              <div class="import-info-grid">
                <div class="import-info-item">
                  <div class="import-info-label">題數</div>
                  <div class="import-info-value">{{ previewQuestions.length }}</div>
                </div>
                <div class="import-info-item">
                  <div class="import-info-label">科目</div>
                  <div class="import-info-value">{{ importPreview?.examData?.subject || '-' }}</div>
                </div>
                <div class="import-info-item">
                  <div class="import-info-label">分類</div>
                  <div class="import-info-value">{{ importPreview?.examData?.category || '-' }}</div>
                </div>
              </div>

              <div v-if="previewQuestions.length" class="import-preview">
                <div class="import-preview-header">題目預覽（前 {{ Math.min(previewQuestions.length, 5) }} 題）</div>
                <div class="import-preview-list">
                  <div v-for="(q, i) in previewQuestions.slice(0, 5)" :key="i" class="import-preview-item">
                    <span class="preview-index">{{ i + 1 }}</span>
                    <span class="preview-text">{{ previewText(q) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modern-modal-footer" v-if="importStep === 2 || importStep === 3">
        <div class="footer-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span v-if="importStep === 2">{{ importType === 'pdf' && pdfErrorMessage ? pdfErrorMessage :
            '上傳完成後可預覽匯入結果' }}</span>
          <span v-else>確認後將匯入至暫存區</span>
        </div>
        <div class="footer-actions">
          <button class="footer-btn footer-btn-secondary" @click="handleImportBack">
            上一步 </button>
          <button v-if="importStep === 2" class="footer-btn footer-btn-primary" @click="handleImportNext"
            :disabled="!canProceedStep2">
            {{ importType === 'json' ? (isImporting ? '解析中...' : '下一步') : '查看結果' }}
          </button>
          <button v-else class="footer-btn footer-btn-primary" @click="confirmImport" :disabled="isImporting">
            <svg v-if="!isImporting" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div v-else class="btn-spinner-small"></div>
            {{ isImporting ? '匯入中...' : '確認匯入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PdfUploadSection from '@/components/PdfUploadSection.vue'
import { QuestionModel } from '@/models/Question'

const emit = defineEmits(['import-questions'])

const showImportModal = ref(false)
const importType = ref(null) // 'json' or 'pdf'
const importStep = ref(1)
const importPreview = ref(null)
const pdfErrorMessage = ref('')
const selectedJsonFile = ref(null)
const jsonFileInput = ref(null)
const pdfUploadRef = ref(null)
const isImporting = ref(false)

const importTypeLabel = computed(() => {
  if (importType.value === 'json') return 'JSON'
  if (importType.value === 'pdf') return 'PDF'
  return '匯入'
})

const previewQuestions = computed(() => importPreview.value?.questions || [])

const normalizeImportQuestions = (list) => {
  if (!Array.isArray(list)) return []
  return list
    .map(item => QuestionModel.fromRpcWithExtras(item))
    .filter(item => item && item.content && item.question_type)
}

const canProceedStep2 = computed(() => {
  if (importType.value === 'json') {
    return !!selectedJsonFile.value && !isImporting.value
  }
  if (importType.value === 'pdf') {
    return !!importPreview.value && importPreview.value.source === 'pdf' && !pdfErrorMessage.value
  }
  return false
})

const openImportModal = () => {
  showImportModal.value = true
  importStep.value = 1
  importType.value = null
  importPreview.value = null
  pdfErrorMessage.value = ''
  selectedJsonFile.value = null
  isImporting.value = false
  if (jsonFileInput.value) {
    jsonFileInput.value.value = ''
  }
  if (pdfUploadRef.value?.reset) {
    pdfUploadRef.value.reset()
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 1
  importType.value = null
  importPreview.value = null
  pdfErrorMessage.value = ''
  selectedJsonFile.value = null
  isImporting.value = false
  if (jsonFileInput.value) {
    jsonFileInput.value.value = ''
  }
  if (pdfUploadRef.value?.reset) {
    pdfUploadRef.value.reset()
  }
}

const selectImportType = (type) => {
  importType.value = type
  importStep.value = 2
  importPreview.value = null
  pdfErrorMessage.value = ''
}

const handleJsonFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/json') {
    selectedJsonFile.value = file
    importPreview.value = null
  } else {
    alert('請選擇正確的 JSON 檔案')
  }
}

const handleJsonDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/json') {
    selectedJsonFile.value = file
    importPreview.value = null
  } else {
    alert('請選擇正確的 JSON 檔案')
  }
}

const clearJsonFile = () => {
  selectedJsonFile.value = null
  importPreview.value = null
  if (jsonFileInput.value) {
    jsonFileInput.value.value = ''
  }
}

const goToImportStep = (step) => {
  if (step >= importStep.value) return
  if (step === 1) {
    importStep.value = 1
    importType.value = null
    importPreview.value = null
    pdfErrorMessage.value = ''
    selectedJsonFile.value = null
    if (jsonFileInput.value) {
      jsonFileInput.value.value = ''
    }
    if (pdfUploadRef.value?.reset) {
      pdfUploadRef.value.reset()
    }
    return
  }
  if (step === 2) {
    importStep.value = 2
  }
}

const handleImportBack = () => {
  if (importStep.value === 3) {
    importStep.value = 2
    return
  }
  if (importStep.value === 2) {
    goToImportStep(1)
  }
}

const prepareJsonPreview = async () => {
  if (!selectedJsonFile.value) return

  isImporting.value = true
  try {
    const fileContent = await selectedJsonFile.value.text()
    const data = JSON.parse(fileContent)

    let questionsToImport = []
    if (Array.isArray(data)) {
      questionsToImport = data
    } else if (data.questions && Array.isArray(data.questions)) {
      questionsToImport = data.questions
    } else {
      throw new Error('JSON 格式錯誤，請確認有 questions 陣列')
    }

    const validQuestions = normalizeImportQuestions(questionsToImport)
    if (validQuestions.length === 0) {
      throw new Error('無有效的題目資料')
    }

    importPreview.value = {
      source: 'json',
      examData: {
        subject: data.subject || '',
        category: data.category || ''
      },
      questions: validQuestions,
      answers: null
    }
    importStep.value = 3
  } catch (err) {
    console.error('JSON 匯入失敗:', err)
    alert(`匯入失敗：${err.message}`)
  } finally {
    isImporting.value = false
  }
}

const handlePdfPreview = (payload) => {
  if (!payload?.questions?.length) return
  importPreview.value = { source: 'pdf', ...payload }
  pdfErrorMessage.value = ''
}

const handlePdfError = (message) => {
  if (message && message.includes('答案')) {
    return
  }
  pdfErrorMessage.value = message || 'PDF 解析失敗'
  importPreview.value = null
}

const handleImportNext = async () => {
  if (importStep.value !== 2) return
  if (importType.value === 'json') {
    await prepareJsonPreview()
    return
  }
  if (importType.value === 'pdf' && importPreview.value) {
    importStep.value = 3
  }
}

const confirmImport = async () => {
  if (!importPreview.value) return

  if (importType.value === 'json') {
    const questions = importPreview.value.questions || []
    if (questions.length > 0) {
      emit('import-questions', questions)
      alert(`已將 ${questions.length} 題加入暫存區`)
    }
    closeImportModal()
    return
  }

  if (importType.value === 'pdf') {
    handlePdfImportSuccess(importPreview.value)
  }
}

const previewText = (q) => {
  const text = q?.question || q?.content || ''
  return text.length > 100 ? `${text.slice(0, 100)}...` : text
}

const handlePdfImportSuccess = (data) => {
  if (data && data.questions && data.questions.length > 0) {
    const formattedQuestions = data.questions.map(q => {
      const correctAnswer = q.correct_answer || ''
      let formattedOptions = []

      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        formattedOptions = q.options.map((optionText, index) => {
          const optionLabel = String.fromCharCode(65 + index)
          return {
            content: optionText,
            is_correct: correctAnswer === optionLabel || correctAnswer === optionText
          }
        })
      }

      return QuestionModel.fromRpcWithExtras({
        content: q.question || q.content || '',
        subject: data.examData?.subject || '',
        category: data.examData?.category || '',
        options: formattedOptions,
        difficulty: data.examData?.level || 'medium',
        explanation: '',
        status: 'draft',
        tags: [],
        tag_ids: []
      })
    })

    emit('import-questions', formattedQuestions)
    alert(`已將 PDF 匯入 ${formattedQuestions.length} 題加入暫存區`)
    closeImportModal()
  }
}

defineExpose({
  open: openImportModal
})
</script>

<style scoped>
/* Modern Modal Styles */

.modern-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
}

.modern-modal-header {
  background: linear-gradient(135deg, var(--primary, #476996) 0%, var(--primary-hover, #35527a) 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.header-icon-wrapper svg {
  color: white;
}

.header-content-wrapper {
  flex: 1;
}

.modern-modal-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.modern-modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.modern-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modern-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.modern-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modern-close-btn svg {
  color: white;
}

.modern-modal-body {
  padding: 28px;
  max-height: calc(90vh - 250px);
  overflow-y: auto;
}

.modern-modal-footer {
  padding: 20px 28px;
  background: #f9fafb;
  border-top: 1px solid var(--border, #CBD5E1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

:root[data-theme="dark"] .modern-modal,
.dark .modern-modal {
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-dark, #334155);
}

:root[data-theme="dark"] .modern-modal-body,
.dark .modern-modal-body {
  background: var(--bg-primary, #0f172a);
}

:root[data-theme="dark"] .modern-modal-footer,
.dark .modern-modal-footer {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  flex: 1;
}

.footer-info svg {
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.footer-btn svg {
  flex-shrink: 0;
}

.footer-btn-secondary {
  background: white;
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #CBD5E1);
}

.footer-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  color: var(--text-primary, #1E293B);
  border-color: #94a3b8;
}

.footer-btn-pending {
  background: #fff7eb;
  color: #d89b32;
  border: 1px solid #f7d7a8;
}

.footer-btn-pending:hover:not(:disabled) {
  background: #fef3e2;
  border-color: #d89b32;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(216, 155, 50, 0.2);
}

.footer-btn-primary {
  background: var(--primary, #476996);
  color: white;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.footer-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(71, 105, 150, 0.3);
}

.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .modern-modal-header {
    padding: 20px;
  }

  .modern-modal-title {
    font-size: 18px;
  }

  .modern-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-info {
    order: -1;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .footer-btn {
    width: 100%;
  }
}

/* Import Modal Styles */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.import-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-option:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.15);
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary, #476996), var(--primary-hover, #35527a));
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.option-description {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

.option-hint {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

.option-arrow {
  color: var(--text-secondary, #64748B);
  flex-shrink: 0;
}

.import-option:hover .option-arrow {
  color: var(--primary, #476996);
  transform: translateX(4px);
}

.import-section {
  margin-top: 16px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: #f8fafc;
  border: 2px dashed var(--border, #CBD5E1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.upload-zone:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
}

.upload-zone svg {
  color: var(--primary, #476996);
  margin-bottom: 16px;
}

.upload-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.upload-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
}

.selected-file svg {
  color: var(--primary, #476996);
  flex-shrink: 0;
}

.selected-file span {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-clear-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-clear-file:hover {
  background: #fee;
  color: #dc2626;
}

@media (max-width: 768px) {
  .import-option {
    padding: 16px;
  }

  .option-icon {
    width: 48px;
    height: 48px;
  }

  .option-icon svg {
    width: 24px;
    height: 24px;
  }

  .option-title {
    font-size: 15px;
  }

  .option-description {
    font-size: 13px;
  }

  .upload-zone {
    padding: 32px 16px;
  }
}


.import-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.step-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.step-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-item.active {
  color: var(--primary, #476996);
}

.step-item.current {
  color: var(--text-primary, #1E293B);
}

.step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary, #476996);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.step-divider {
  width: auto;
  height: auto;
  background: transparent;
  min-width: auto;
  color: var(--text-secondary, #64748B);
}

.step-divider::before {
  content: "→";
  font-size: 14px;
  line-height: 1;
}

.import-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary, #476996);
  font-size: 13px;
  cursor: pointer;
}

.import-alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.import-result-card {
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.import-result-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border, #CBD5E1);
}

.import-result-title {
  font-weight: 700;
  color: var(--text-primary, #1E293B);
}

.import-result-subtitle {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
  margin-top: 4px;
}

.import-result-body {
  padding: 16px;
}

.import-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.import-info-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.import-info-label {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.import-info-value {
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.import-preview-header {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary, #1E293B);
}

.import-preview-list {
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
  overflow: hidden;
}

.import-preview-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #CBD5E1);
  background: white;
}

.import-preview-item:last-child {
  border-bottom: none;
}

.preview-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary, #476996);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.preview-text {
  font-size: 13px;
  color: var(--text-primary, #1E293B);
}

@media (max-width: 768px) {
  .import-info-grid {
    grid-template-columns: 1fr;
  }

  .step-divider {
    display: none;
  }
}

/* Dark Mode Styles for Import Modal */

:root[data-theme="dark"] .import-steps,
.dark .import-steps {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-item,
.dark .step-item {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-item.active,
.dark .step-item.active {
  color: #cbd5f5;
}

:root[data-theme="dark"] .step-item.current,
.dark .step-item.current {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .step-divider,
.dark .step-divider {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-title,
.dark .step-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-result-card,
.dark .import-result-card {
  background: #0f172a;
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-result-header,
.dark .import-result-header {
  background: #111827;
  border-bottom-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-result-title,
.dark .import-result-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-result-subtitle,
.dark .import-result-subtitle {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .import-info-item,
.dark .import-info-item {
  background: #111827;
}

:root[data-theme="dark"] .import-info-label,
.dark .import-info-label {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .import-info-value,
.dark .import-info-value {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-preview-header,
.dark .import-preview-header {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-preview-list,
.dark .import-preview-list {
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-preview-item,
.dark .import-preview-item {
  background: #0f172a;
  border-bottom-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .preview-text,
.dark .preview-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-alert-error,
.dark .import-alert-error {
  background: #2b1515;
  border-color: #7f1d1d;
  color: #fecaca;
}


:root[data-theme="dark"] .import-option,
.dark .import-option {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-option:hover,
.dark .import-option:hover {
  background: var(--bg-tertiary, #2d3a4f);
  border-color: var(--primary, #6b8fc7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .option-title,
.dark .option-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .option-description,
.dark .option-description {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .option-hint,
.dark .option-hint {
  background: var(--bg-tertiary, #334155);
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .option-arrow,
.dark .option-arrow {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .upload-zone,
.dark .upload-zone {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .upload-text,
.dark .upload-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .upload-hint,
.dark .upload-hint {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .selected-file,
.dark .selected-file {
  background: var(--bg-tertiary, #334155);
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .btn-clear-file:hover,
.dark .btn-clear-file:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}
</style>
