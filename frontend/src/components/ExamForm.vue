<template>
  <div class="exam-form-card">
    <div class="form-header">
      <div class="header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div class="header-content">
        <h2 class="header-title">{{ isEditMode ? '編輯考卷' : '新增考卷' }}</h2>
        <p class="header-subtitle">{{ isEditMode ? '修改考卷基本資訊' : '建立新的考試卷' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="exam-form">
      <div class="form-group">
        <label for="name" class="form-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>考卷名稱 <span class="required">*</span></span>
        </label>
        <input id="name" v-model="formData.name" type="text" required placeholder="例如：期中考、期末考、隨堂測驗..."
          class="form-input" />
      </div>

      <div class="form-group">
        <label for="description" class="form-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>考試說明</span>
        </label>
        <textarea id="description" v-model="formData.description" rows="3" placeholder="輸入考試相關說明、注意事項或範圍..."
          class="form-textarea"></textarea>
      </div>

      <div class="form-group">
        <label for="time_limit" class="form-label">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>考試時間限制（分鐘）</span>
        </label>
        <input id="time_limit" v-model.number="formData.time_limit" type="number" min="1" placeholder="設定考試時間限制，例如：60"
          class="form-input" />
      </div>

      <div v-if="formError" class="form-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {{ formError }}
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-submit" :disabled="saving">
          <svg v-if="!saving" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <div v-else class="btn-spinner"></div>
          {{ saving ? '儲存中...' : '儲存考卷' }}
        </button>
        <button type="button" class="btn-cancel" @click="handleCancel">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          取消
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  exam: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const isEditMode = ref(!!props.exam)

const formData = ref({
  name: '',
  description: '',
  time_limit: null
})

const formError = ref('')

// 定義函數（必須在 watch 之前）
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    time_limit: null
  }
}

const handleSubmit = () => {
  const trimmedName = formData.value.name.trim()
  if (!trimmedName) {
    formError.value = '請輸入考卷名稱'
    return
  }
  formError.value = ''

  const cleanedData = {
    name: trimmedName,
    description: formData.value.description?.trim() || '',
    ...(Number.isFinite(formData.value.time_limit) && formData.value.time_limit > 0
      ? { time_limit: formData.value.time_limit }
      : {})
  }
  emit('save', cleanedData)
}

const handleCancel = () => {
  emit('cancel')
}

// 監聽 exam prop 的變化
watch(() => props.exam, (newExam) => {
  if (newExam) {
    isEditMode.value = true
    formData.value = {
      name: newExam.name || '',
      description: newExam.description || '',
      time_limit: newExam.time_limit || null
    }
    formError.value = ''
  } else {
    isEditMode.value = false
    resetForm()
  }
}, { immediate: true })
</script>

<style scoped>
.exam-form-card {
  background: white;
  box-shadow: none;
  border: none;
  border-radius: 20px;
  margin: 20px;
  overflow: auto;
}

.form-header {
  background: linear-gradient(135deg, var(--primary, #476996) 0%, var(--primary-hover, #35527a) 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-icon {
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

.header-icon svg {
  color: white;
  width: 24px;
  height: 24px;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.exam-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin-bottom: 10px;
}

.form-label svg {
  color: var(--text-secondary, #64748B);
  flex-shrink: 0;
}

.form-label .required {
  color: #dc2626;
  font-weight: 700;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  color: var(--text-primary, #1E293B);
  background: #f9fafb;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #94a3b8;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #cbd5e1;
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary, #476996);
  background: white;
  box-shadow: 0 0 0 4px rgba(71, 105, 150, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.form-error svg {
  flex-shrink: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-submit,
.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-submit {
  background: var(--primary, #476996);
  color: white;
  flex: 1;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(71, 105, 150, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: var(--text-secondary, #64748B);
  min-width: 80px;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: var(--text-primary, #1E293B);
  transform: translateY(-2px);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .form-header {
    padding: 24px;
    flex-direction: column;
    text-align: center;
  }

  .header-title {
    font-size: 24px;
  }

  .header-subtitle {
    font-size: 14px;
  }

  .exam-form {
    padding: 24px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-submit,
  .btn-cancel {
    width: 100%;
  }
}
</style>
