<template>
  <div class="note-editor">
    <div class="editor-header">
      <input 
        v-model="formData.title" 
        class="form-control title-input" 
        placeholder="筆記標題 (選填)"
      />
      <div class="actions d-flex align-items-center gap-2">
         <!-- Docking Toggle -->
         <button 
           class="btn btn-sm btn-icon text-muted" 
           @click="$emit('toggle-position')"
           :title="position === 'left' ? '切換至右側' : '切換至左側'"
         >
           <i class="bi" :class="position === 'left' ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'"></i>
         </button>

         <!-- Context Menu -->
         <div class="dropdown" v-if="!isNew">
            <button class="btn btn-sm btn-icon text-muted p-0" style="width: 24px; height: 24px;" data-bs-toggle="dropdown">
              <i class="bi bi-three-dots"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
              <li><a class="dropdown-item text-danger" href="#" @click.prevent="$emit('delete', formData.id)">
                <i class="bi bi-trash me-2"></i> 刪除
              </a></li>
            </ul>
         </div>

         <!-- Close Button (Replaces Trash) -->
        <button 
          class="btn btn-icon btn-sm text-secondary" 
          @click="$emit('cancel')"
          title="關閉"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>

    <div class="editor-body">
      <textarea 
        v-model="formData.content" 
        class="form-control content-area" 
        placeholder="開始輸入筆記內容..."
      ></textarea>
    </div>

    <!-- Creative Features Toolbar -->
    <div class="creative-toolbar">
      <button 
        class="btn btn-sm btn-light-primary" 
        @click="handleAskAI"
        :disabled="!hasContent"
      >
        <i class="bi bi-stars"></i> Ask AI
      </button>
      <button 
        class="btn btn-sm btn-light-warning" 
        @click="handleGenerateFlashcard"
        :disabled="!hasContent || isGenerating"
      >
        <i v-if="isGenerating" class="spinner-border spinner-border-sm"></i>
        <i v-else class="bi bi-card-text"></i> 
        {{ isGenerating ? '生成中...' : '轉為Flashcard' }}
      </button>
    </div>

    <!-- Tags Input (Simple Implementation) -->
    <div class="tags-section">
      <label class="form-label text-muted small">標籤</label>
      <div class="d-flex gap-2 flex-wrap">
        <span 
          v-for="(tag, index) in formData.tags" 
          :key="index" 
          class="badge bg-secondary cursor-pointer"
          @click="removeTag(index)"
        >
          {{ tag }} &times;
        </span>
        <input 
          v-model="newTag"
          class="form-control form-control-sm tag-input" 
          placeholder="+ Tag"
          @keydown.enter.prevent="addTag"
        />
      </div>
    </div>

    <div class="editor-footer">
      <button class="btn btn-secondary me-2" @click="$emit('cancel')">取消</button>
      <button 
        class="btn btn-primary" 
        :disabled="!hasContent || isSaving" 
        @click="save"
      >
        <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
        儲存
      </button>
    </div>

    <!-- Flashcard Preview Modal (Mock) -->
    <div v-if="showFlashcardPreview" class="flashcard-preview-overlay">
      <div class="card flashcard-preview-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="m-0">✨ AI 生成單字卡</h6>
          <button class="btn-close" @click="showFlashcardPreview = false"></button>
        </div>
        <div class="card-body">
          <div v-for="(card, idx) in generatedCards" :key="idx" class="mb-3 p-3 border rounded bg-light">
            <div class="mb-2"><strong>Q:</strong> {{ card.front }}</div>
            <div class="text-success"><strong>A:</strong> {{ card.back }}</div>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-sm btn-primary" @click="saveFlashcards">加入字卡庫</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  note: {
    type: Object,
    default: () => ({ title: '', content: '', tags: [] })
  },
  isSaving: Boolean,
  position: {
    type: String,
    default: 'right'
  }
})

const emit = defineEmits(['save', 'cancel', 'delete', 'ask-ai', 'toggle-position'])

const formData = ref({
  id: null,
  title: '',
  content: '',
  tags: []
})

const newTag = ref('')
const isGenerating = ref(false)
const showFlashcardPreview = ref(false)
const generatedCards = ref([])

// Sync props to local data
watch(() => props.note, (newNote) => {
  if (newNote) {
    formData.value = JSON.parse(JSON.stringify(newNote))
  }
}, { immediate: true })

const isNew = computed(() => !formData.value.id)
const hasContent = computed(() => formData.value.content && formData.value.content.trim().length > 0)

function addTag() {
  const val = newTag.value.trim()
  if (val && !formData.value.tags.includes(val)) {
    formData.value.tags.push(val)
  }
  newTag.value = ''
}

function removeTag(index) {
  formData.value.tags.splice(index, 1)
}

function save() {
  emit('save', formData.value)
}

function handleAskAI() {
  emit('ask-ai', formData.value.content)
}

async function handleGenerateFlashcard() {
  isGenerating.value = true
  // Simulate AI call via parent or store, for now just mock in timeout
  setTimeout(() => {
    generatedCards.value = [
      { front: '這則筆記的重點是什麼？', back: formData.value.content.substring(0, 50) + '...' },
      { front: '相關關鍵字？', back: formData.value.tags.join(', ') || '無' }
    ]
    isGenerating.value = false
    showFlashcardPreview.value = true
  }, 1500)
}

function saveFlashcards() {
  alert('已加入單字卡庫 (Mock)')
  showFlashcardPreview.value = false
}
</script>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
}

.title-input {
  font-weight: 600;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 1.1rem;
}

.title-input:focus {
  box-shadow: none;
  background: transparent;
}

.editor-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.content-area {
  flex: 1;
  border: none;
  resize: none;
  padding: 0;
  background: transparent;
}

.content-area:focus {
  box-shadow: none;
  background: transparent;
}

.creative-toolbar {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-light-primary {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #dbeafe;
}

.btn-light-primary:hover {
  background: #dbeafe;
}

.btn-light-warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fef3c7;
}

.btn-light-warning:hover {
  background: #fef3c7;
}

.tags-section {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.tag-input {
  width: 80px;
}

.editor-footer {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

/* Flashcard Preview Overlay */
.flashcard-preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10;
}

.flashcard-preview-card {
  width: 100%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #000;
}
</style>
