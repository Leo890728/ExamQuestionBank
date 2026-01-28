<template>
  <div class="pdf-upload-container">
    <!-- 標題區 -->
    <div v-if="showHeader" class="upload-header">
      <div class="header-content">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div>
          <h5 class="title">PDF 匯入</h5>
          <p class="subtitle">支援考卷與答案檔分別上傳，自動識別題目與答案</p>
        </div>
      </div>
    </div>

    <!-- 上傳區域 -->
    <div class="upload-areas">
      <!-- 考卷上傳區 -->
      <div class="upload-card question-card">
        <div class="card-header-custom">
          <div class="card-icon question-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h6>考卷檔案</h6>
        </div>

        <div 
          class="dropzone"
          :class="{ 'dragging': isDraggingQuestion, 'uploaded': questionFileName, 'uploading': uploadingQuestions }"
          @drop.prevent="handleQuestionDrop"
          @dragover.prevent="isDraggingQuestion = true"
          @dragleave.prevent="isDraggingQuestion = false"
          @click="openQuestionPicker"
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            @change="handleQuestionPdfUpload"
            ref="questionFileInputEl"
            style="display: none"
          />

          <div v-if="uploadingQuestions" class="upload-state">
            <div class="spinner"></div>
            <p class="state-text">正在解析考卷...</p>
            <small class="state-subtext">請稍候</small>
          </div>

          <div v-else-if="questionFileName" class="upload-state success">
            <div class="success-icon">✓</div>
            <p class="state-text">{{ questionFileName }}</p>
            <small class="state-subtext">點擊重新上傳</small>
          </div>

          <div v-else class="upload-state">
            <div class="upload-icon">📄</div>
            <p class="state-text">拖放 PDF 檔案到這裡</p>
            <small class="state-subtext">或點擊選擇檔案</small>
          </div>
        </div>
      </div>

      <!-- 答案上傳區 -->
      <div class="upload-card answer-card">
        <div class="card-header-custom">
          <div class="card-icon answer-icon">✓</div>
          <h6>答案檔案</h6>
        </div>

        <div 
          class="dropzone"
          :class="{ 'dragging': isDraggingAnswer, 'uploaded': answerFileName, 'uploading': uploadingAnswers }"
          @drop.prevent="handleAnswerDrop"
          @dragover.prevent="isDraggingAnswer = true"
          @dragleave.prevent="isDraggingAnswer = false"
          @click="openAnswerPicker"
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            @change="handleAnswerPdfUpload"
            ref="answerFileInputEl"
            style="display: none"
          />

          <div v-if="uploadingAnswers" class="upload-state">
            <div class="spinner"></div>
            <p class="state-text">正在解析答案...</p>
          </div>

          <div v-else-if="answerFileName" class="upload-state success">
            <div class="success-icon">✓</div>
            <p class="state-text">{{ answerFileName }}</p>
            <small class="state-subtext">點擊重新上傳</small>
          </div>

          <div v-else class="upload-state">
            <div class="upload-icon">📄</div>
            <p class="state-text">拖放 PDF 檔案到這裡</p>
            <small class="state-subtext">選填</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 匯入結果 -->
    <div v-if="importResult && showResult" class="result-container">
      <div class="result-header">
        <span class="result-title">✓ 解析完成</span>
        <button class="close-btn" @click="clearResult">×</button>
      </div>

      <div class="result-body">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">科目</div>
            <div class="info-value">{{ importResult.subject || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">分類</div>
            <div class="info-value">{{ importResult.category || '-' }}</div>
          </div>
          <div class="info-item highlight">
            <div class="info-label">題目數量</div>
            <div class="info-value">{{ importResult.count || 0 }} 題</div>
          </div>
        </div>

        <!-- 題目預覽 -->
        <div v-if="importResult.questions?.length > 0" class="preview-section">
          <div class="preview-header" @click="showPreview = !showPreview">
            <span>題目預覽 ({{ importResult.questions.length }} 題)</span>
            <span :class="{ rotated: showPreview }">▼</span>
          </div>
          <div v-if="showPreview" class="preview-list">
            <div
              v-for="(q, i) in importResult.questions.slice(0, 5)"
              :key="i"
              :class="[
                'preview-item',
                { 'is-first': i === 0, 'is-last': i === importResult.questions.slice(0, 5).length - 1 }
              ]"
            >
              <span class="q-num">{{ i + 1 }}</span>
              <span class="q-text">{{ q.question?.substring(0, 100) }}...</span>
            </div>
            <div v-if="importResult.questions.length > 5" class="preview-more">
              還有 {{ importResult.questions.length - 5 }} 題...
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-confirm" @click="handleImportConfirm">確認使用此資料</button>
          <button class="btn-cancel" @click="clearResult">取消</button>
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="errorMessage" class="error-toast">
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''">×</button>
    </div>

    <!-- 警告訊息 -->
    <div v-if="warningMessage" class="warning-toast">
      <span>{{ warningMessage }}</span>
      <button @click="warningMessage = ''">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const { showResult, showHeader } = defineProps({
  showResult: { type: Boolean, default: true },
  showHeader: { type: Boolean, default: true }
})

const emit = defineEmits(['import-success', 'preview-ready', 'error'])

const questionFileInputEl = ref(null)
const answerFileInputEl = ref(null)

// Open file pickers
const openQuestionPicker = () => {
  if (!uploadingQuestions.value && questionFileInputEl.value) {
    questionFileInputEl.value.click()
  }
}

const openAnswerPicker = () => {
  if (!uploadingAnswers.value && answerFileInputEl.value) {
    answerFileInputEl.value.click()
  }
}
const questionFileName = ref('')
const answerFileName = ref('')

const uploadingQuestions = ref(false)
const uploadingAnswers = ref(false)

const importResult = ref(null)
const answersData = ref(null)
const errorMessage = ref('')
const warningMessage = ref('')

const isDraggingQuestion = ref(false)
const isDraggingAnswer = ref(false)
const showPreview = ref(false)

const buildPreviewPayload = () => {
  if (!importResult.value) return null
  return {
    source: 'pdf',
    examData: {
      name: `${importResult.value.subject || ''} ${importResult.value.category || ''}`.trim(),
      subject: importResult.value.subject,
      category: importResult.value.category,
      level: importResult.value.level,
      time_length: importResult.value.time_length
    },
    questions: importResult.value.questions || [],
    answers: answersData.value
  }
}

const emitPreviewIfReady = () => {
  const payload = buildPreviewPayload()
  if (payload) {
    emit('preview-ready', payload)
  }
}

const emitError = (message) => {
  if (message) {
    emit('error', message)
  }
}

// 處理考卷 PDF 上傳
const handleQuestionPdfUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  await uploadQuestionFile(file)
  event.target.value = ''
}

// 處理考卷拖放
const handleQuestionDrop = async (event) => {
  isDraggingQuestion.value = false
  const file = event.dataTransfer.files[0]
  if (!file?.name.toLowerCase().endsWith('.pdf')) {
    const message = '請上傳 PDF 檔案'
    errorMessage.value = message
    emitError(message)
    return
  }
  await uploadQuestionFile(file)
}

// 上傳考卷檔案 - 使用 FormData (不是 base64!)
const uploadQuestionFile = async (file) => {
  questionFileName.value = file.name
  uploadingQuestions.value = true
  errorMessage.value = ''
  warningMessage.value = ''

  try {
    // 使用 FormData 直接傳送檔案 - 記憶體處理，不儲存
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'questions')

    const { data: functionData, error } = await supabase.functions.invoke('extract-pdf', {
      method: 'POST',
      body: formData  // FormData - 不是 JSON!
    })

    if (error) {
      throw new Error(error.message || '解析失敗')
    }

    const parsedQuestions = functionData?.questions || []
    if (!parsedQuestions.length) {
      const message = '解析失敗：未找到題目'
      errorMessage.value = message
      emitError(message)
      importResult.value = null
      questionFileName.value = ''
      showPreview.value = false
      return
    }

    importResult.value = functionData
    showPreview.value = true
    console.log('考卷 PDF 解析成功:', functionData)
    emitPreviewIfReady()
  } catch (error) {
    console.error('考卷 PDF 上傳失敗:', error)
    errorMessage.value = error.message || '考卷 PDF 上傳失敗'
    questionFileName.value = ''
    emitError(errorMessage.value)
  } finally {
    uploadingQuestions.value = false
  }
}

const reset = () => {
  importResult.value = null
  answersData.value = null
  questionFileName.value = ''
  answerFileName.value = ''
  errorMessage.value = ''
  warningMessage.value = ''
  showPreview.value = false
  uploadingQuestions.value = false
  uploadingAnswers.value = false
  if (questionFileInputEl.value) {
    questionFileInputEl.value.value = ''
  }
  if (answerFileInputEl.value) {
    answerFileInputEl.value.value = ''
  }
}

// Expose for programmatic access
defineExpose({ openQuestionPicker, reset })

// 處理答案 PDF 上傳
const handleAnswerPdfUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  await uploadAnswerFile(file)
  event.target.value = ''
}

const handleAnswerDrop = async (event) => {
  isDraggingAnswer.value = false
  const file = event.dataTransfer.files[0]
  if (!file?.name.toLowerCase().endsWith('.pdf')) {
    const message = '請上傳 PDF 檔案'
    errorMessage.value = message
    emitError(message)
    return
  }
  await uploadAnswerFile(file)
}

const uploadAnswerFile = async (file) => {
  answerFileName.value = file.name
  uploadingAnswers.value = true
  errorMessage.value = ''
  warningMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'answers')

    const { data: functionData, error } = await supabase.functions.invoke('extract-pdf', {
      method: 'POST',
      body: formData
    })

    if (error) {
      throw new Error(error.message || '解析失敗')
    }

    answersData.value = functionData

    const parsedAnswers = answersData.value?.answers || []
    if (!parsedAnswers.length) {
      const message = '解析失敗：未找到答案'
      errorMessage.value = message
      emitError(message)
      answersData.value = null
      answerFileName.value = ''
      return
    }
    
    // 合併答案到題目
    if (importResult.value?.questions && answersData.value?.answers) {
      importResult.value.questions.forEach((q, i) => {
        if (answersData.value.answers[i]) {
          q.correct_answer = answersData.value.answers[i]
        }
      })
    }

    if (importResult.value?.questions) {
      const questionCount = importResult.value.questions.length
      const answerCount = parsedAnswers.length
      if (questionCount !== answerCount) {
        warningMessage.value = `警告：答案數量 (${answerCount}) 與題目數量 (${questionCount}) 不一致`
      }
    }
    emitPreviewIfReady()
  } catch (error) {
    console.error('答案 PDF 上傳失敗:', error)
    errorMessage.value = error.message || '答案 PDF 上傳失敗'
    answerFileName.value = ''
    emitError(errorMessage.value)
  } finally {
    uploadingAnswers.value = false
  }
}

// 確認匯入
const handleImportConfirm = () => {
  if (!importResult.value) return

  emit('import-success', {
    examData: {
      name: `${importResult.value.subject || ''} ${importResult.value.category || ''}`.trim(),
      subject: importResult.value.subject,
      category: importResult.value.category
    },
    questions: importResult.value.questions,
    answers: answersData.value
  })

  clearResult()
}

const clearResult = () => {
  importResult.value = null
  answersData.value = null
  questionFileName.value = ''
  answerFileName.value = ''
  errorMessage.value = ''
  warningMessage.value = ''
  showPreview.value = false
}
</script>

<style scoped>
.pdf-upload-container {
  background: var(--bg-secondary, #fff);
  border-radius: 12px;
  border: 1px solid var(--border, #e5e7eb);
  margin-bottom: 1.5rem;
}

.upload-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.header-content { display: flex; align-items: center; gap: 1rem; }
.icon-wrapper {
  width: 44px; height: 44px;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--primary, #476996);
}
.title { font-size: 1.125rem; font-weight: 600; margin: 0; }
.subtitle { font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0 0; }

.upload-areas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.upload-card {
  background: var(--bg-tertiary, #f9fafb);
  border-radius: 8px;
  border: 2px dashed var(--border, #e5e7eb);
  overflow: hidden;
}

.card-header-custom {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary, #fff);
  border-bottom: 1px solid var(--border);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}
.card-icon {
  width: 28px; height: 28px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 14px;
}
.question-icon { background: var(--primary, #476996); }
.answer-icon { background: #10b981; }
.card-header-custom h6 { margin: 0; font-size: 0.875rem; }

.dropzone {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.dropzone:hover { background: var(--primary-soft, #f0f4ff); }
.dropzone.uploading { opacity: 0.6; cursor: wait; }
.dropzone.uploaded { background: #f0fdf4; }

.upload-state { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.upload-icon { font-size: 2.5rem; opacity: 0.5; }
.success-icon { font-size: 2rem; color: #10b981; }
.state-text { font-weight: 500; margin: 0; }
.state-subtext { font-size: 0.75rem; color: var(--text-secondary); }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary, #476996);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.result-container {
  margin: 0 1.5rem 1.5rem;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  background: #f0fdf4;
  overflow: hidden;
}
.result-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #d1fae5;
}
.result-title { font-weight: 600; color: #065f46; }
.close-btn { border: none; background: none; font-size: 1.25rem; cursor: pointer; }
.result-body {
  padding: 1rem;
  height: 360px;
  overflow: auto;
}

.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
.info-item { padding: 0.75rem; background: #fff; border-radius: 6px; }
.info-item.highlight { background: #fef3c7; }
.info-label { font-size: 0.75rem; color: var(--text-secondary); }
.info-value { font-weight: 600; }

.preview-section { margin-bottom: 1rem; }
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0.75rem;
  background: #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.preview-header .rotated { transform: rotate(180deg); }
.preview-list {
  padding: 0.75rem 0;
  border-radius: 6px;
  background: #f8fafc;
}
.preview-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.preview-item.is-first {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}
.preview-item.is-last {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  border-bottom: none;
}
.q-num {
  width: 24px; height: 24px;
  background: var(--primary); color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; flex-shrink: 0;
}
.q-text { font-size: 0.875rem; }
.preview-more { font-size: 0.75rem; color: var(--text-secondary); padding-top: 0.5rem; }

.action-buttons { display: flex; gap: 0.75rem; }
.btn-confirm, .btn-cancel {
  padding: 0.625rem 1.25rem;
  border: none; border-radius: 6px;
  font-weight: 600; cursor: pointer;
}
.btn-confirm { background: var(--primary, #476996); color: #fff; }
.btn-cancel { background: #e5e7eb; }

.error-toast {
  position: fixed; bottom: 1rem; right: 1rem;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 6px; color: #991b1b;
}
.error-toast button { border: none; background: none; cursor: pointer; font-size: 1.25rem; }

.warning-toast {
  position: fixed; bottom: 1rem; right: 1rem;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 6px; color: #92400e;
  transform: translateY(-60px);
}
.warning-toast button { border: none; background: none; cursor: pointer; font-size: 1.25rem; }

/* Dark Mode Styles */
:root[data-theme="dark"] .pdf-upload-container,
.dark .pdf-upload-container {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .upload-header,
.dark .upload-header {
  background: linear-gradient(135deg, #1e3a5f, #0f172a);
}

:root[data-theme="dark"] .upload-card,
.dark .upload-card {
  background: var(--bg-tertiary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .card-header-custom h6,
.dark .card-header-custom h6 {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .card-header-custom,
.dark .card-header-custom {
  background: var(--bg-secondary, #1e293b);
  border-bottom: 1px solid var(--border-dark, #334155);
}

:root[data-theme="dark"] .dropzone,
.dark .dropzone {
  background: var(--bg-primary, #0f172a);
  border-color: var(--border-dark, #475569);
}

:root[data-theme="dark"] .dropzone:hover,
.dark .dropzone:hover {
  background: var(--bg-tertiary, #1e293b);
  border-color: var(--primary, #6b8fc7);
}

:root[data-theme="dark"] .state-text,
.dark .state-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .state-subtext,
.dark .state-subtext {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .info-item,
.dark .info-item {
  background: var(--bg-tertiary, #334155);
}

:root[data-theme="dark"] .info-label,
.dark .info-label {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .info-value,
.dark .info-value {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .preview-header,
.dark .preview-header {
  background: var(--bg-tertiary, #334155);
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .preview-item,
.dark .preview-item {
  border-color: var(--border-dark, #475569);
}

:root[data-theme="dark"] .preview-list,
.dark .preview-list {
  background: var(--bg-primary, #0f172a);
}

:root[data-theme="dark"] .q-text,
.dark .q-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .btn-cancel,
.dark .btn-cancel {
  background: var(--bg-tertiary, #334155);
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .result-container,
.dark .result-container {
  background: #0f172a;
  border-color: #1f4d3a;
}

:root[data-theme="dark"] .result-header,
.dark .result-header {
  border-bottom-color: #1f4d3a;
}

:root[data-theme="dark"] .result-title,
.dark .result-title {
  color: #d1fae5;
}

:root[data-theme="dark"] .close-btn,
.dark .close-btn {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .info-item.highlight,
.dark .info-item.highlight {
  background: #3f2d0e;
}

:root[data-theme="dark"] .error-toast,
.dark .error-toast {
  background: #2b1515;
  border-color: #7f1d1d;
  color: #fecaca;
}

:root[data-theme="dark"] .error-toast button,
.dark .error-toast button {
  color: inherit;
}

:root[data-theme="dark"] .warning-toast,
.dark .warning-toast {
  background: #2a1d0b;
  border-color: #92400e;
  color: #fcd34d;
}

:root[data-theme="dark"] .warning-toast button,
.dark .warning-toast button {
  color: inherit;
}

:root[data-theme="dark"] .result-header,
.dark .result-header {
  background: linear-gradient(135deg, #065f46, #064e3b);
}
</style>
