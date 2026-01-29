<template>
  <div class="question-editor">
    <div class="editor-card">
      <div class="form-body">
        <form @submit.prevent="handleSave">
          <!-- 科目 -->
          <div class="form-group">
            <label for="subject" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>科目 <span class="required">*</span></span>
            </label>
            <input
              id="subject"
              v-model="formData.subject"
              type="text"
              required
              placeholder="例：民法、刑法、公司法..."
              class="form-input"
            />
            <div v-if="!formValidation.subject" class="form-error">科目為必填</div>
          </div>
  
          <!-- 題型分類 -->
          <div class="form-group">
            <label for="category" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>題型分類</span>
            </label>
            <input
              id="category"
              v-model="formData.category"
              type="text"
              placeholder="例：選擇題、申論題、綜合題型..."
              class="form-input"
            />
          </div>

          <!-- 年份與來源 -->
          <div class="form-row">
            <div class="form-group">
              <label for="year" class="form-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>年份</span>
              </label>
              <input
                id="year"
                v-model.number="formData.year"
                type="number"
                min="0"
                step="1"
                placeholder="例：2024"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="source" class="form-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"></path>
                  <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"></path>
                </svg>
                <span>來源</span>
              </label>
              <input
                id="source"
                v-model="formData.source"
                type="text"
                placeholder="例：考古題、教科書..."
                class="form-input"
              />
            </div>
          </div>

          <!-- 題型 -->
          <div class="form-group">
            <label for="type" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              <span>題型</span>
            </label>
            <select id="type" v-model="formData.type" class="form-select">
              <option value="multipleChoice">選擇題</option>
              <option value="essay">申論題</option>
            </select>
          </div>

          <!-- 難度 -->
          <div class="form-group">
            <label for="difficulty" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>難度</span>
            </label>
            <select id="difficulty" v-model="formData.difficulty" class="form-select">
              <option value="easy">容易</option>
              <option value="normal">普通</option>
              <option value="hard">困難</option>
              <option value="insane">極難</option>
            </select>
          </div>
  
          <!-- 題目內容 -->
          <div class="form-group">
            <label for="content" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>題目內容 <span class="required">*</span></span>
            </label>
            <textarea
              id="content"
              v-model="formData.content"
              rows="5"
              required
              placeholder="請輸入完整的題目敘述與問題..."
              class="form-textarea"
            ></textarea>
            <div v-if="!formValidation.content" class="form-error">題目內容為必填</div>
          </div>
  
          <!-- 解析 -->
          <div class="form-group">
            <label for="explanation" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>解析</span>
            </label>
            <textarea
              id="explanation"
              v-model="formData.explanation"
              rows="4"
              placeholder="請輸入題目解析、相關法條或重點說明..."
              class="form-textarea"
            ></textarea>
          </div>
  
          <!-- 標籤 (Multiselect) -->
          <div class="form-group">
            <label for="tags" class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>標籤</span>
            </label>
            <div class="tag-controls">
              <multiselect
                v-model="selectedTags"
                :options="tagOptions"
                :multiple="true"
                :close-on-select="false"
                :clear-on-select="false"
                :preserve-search="true"
                :internal-search="false"
                placeholder="選擇或新增標籤"
                track-by="id"
                label="name"
                @search-change="onTagSearch"
                class="tag-multiselect"
              />
              <div class="tag-add-group">
                <input id="new-tag" v-model="newTagName" class="form-input" placeholder="新增標籤" @keyup.enter="handleCreateTag" />
                <button type="button" class="btn-add-tag" @click="handleCreateTag">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  新增
                </button>
              </div>
            </div>
          </div>
  
          <!-- 選項 -->
          <div class="form-group options-section">
            <label class="form-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>選項</span>
            </label>
            <div class="options-list">
              <div
                v-for="(option, index) in formData.options"
                :key="index"
                class="option-item"
              >
                <div class="option-number">{{ index + 1 }}</div>
                <input
                  v-model="option.content"
                  type="text"
                  :placeholder="`選項 ${index + 1} 內容`"
                  class="option-input"
                />
                <label class="checkbox-label">
                  <input
                    v-model="option.is_correct"
                    type="checkbox"
                  />
                  <span>正確答案</span>
                </label>
                <button
                  type="button"
                  class="btn-remove"
                  @click="removeOption(index)"
                  :title="`刪除選項 ${index + 1}`"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <button type="button" class="btn-add-option" @click="addOption">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新增選項
            </button>
          </div>
  
          <!-- 考卷中的順序和配分 (如果是從考卷編輯進來的) -->
          <div v-if="examQuestion" class="exam-settings">
            <div class="settings-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
              </svg>
              <h4>考卷設定</h4>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="order" class="form-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <span>順序</span>
                </label>
                <input
                  id="order"
                  v-model.number="examSettings.order"
                  type="number"
                  min="1"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label for="points" class="form-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>配分</span>
                </label>
                <input
                  id="points"
                  v-model.number="examSettings.points"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="saving || !isFormValid">
              <div v-if="saving" class="btn-spinner"></div>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{{ saving ? '儲存中...' : '儲存' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { QuestionModel } from '@/models/Question'

const props = defineProps({
  question: {
    type: Object,
    default: null
  },
  examQuestion: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'save-exam-settings', 'save-direct', 'save-pending'])

const formData = ref({
  subject: '',
  category: '',
  year: null,
  source: '',
  type: 'multipleChoice',
  difficulty: 'normal',
  content: '',
  explanation: '',
  options: [],
  tag_ids: []
})

const examSettings = ref({
  order: 1,
  points: 0
})

// Tag options for multi-select (定義在 watch 之前)
const tagOptions = ref([])
const selectedTags = ref([])

// 監聽 question prop 的變化
watch(() => props.question, (newQuestion) => {
  if (newQuestion) {
    const normalized = QuestionModel.fromRpcWithExtras(newQuestion)
    formData.value = {
      subject: normalized.subject || '',
      category: normalized.category || '',
      year: normalized.year ?? null,
      source: normalized.source || '',
      type: normalized.question_type || 'multipleChoice',
      difficulty: normalized.difficulty || 'normal',
      content: normalized.content || '',
      explanation: normalized.explanation || '',
      options: Array.isArray(normalized.options) ? normalized.options.map(option => ({ ...option })) : [],
      tag_ids: Array.isArray(normalized.tag_ids)
        ? normalized.tag_ids
        : Array.isArray(normalized.tags)
          ? normalized.tags.map(t => t.id)
          : []
    }
    // set selectedTags to match tag objects
    if (normalized.tags && Array.isArray(normalized.tags)) {
      selectedTags.value = normalized.tags
    } else if (normalized.tag_ids && Array.isArray(normalized.tag_ids) && tagOptions.value.length > 0) {
      selectedTags.value = tagOptions.value.filter(t => normalized.tag_ids.includes(t.id))
    } else {
      selectedTags.value = []
    }
  }
}, { immediate: true, deep: true })

// 監聯 tagOptions 載入完成後，重新設定 selectedTags
watch(() => tagOptions.value, (newTagOptions) => {
  if (newTagOptions.length > 0 && props.question?.tag_ids && Array.isArray(props.question.tag_ids)) {
    // 如果有 tag_ids 但 selectedTags 還是空的，重新設定
    if (selectedTags.value.length === 0 && props.question.tag_ids.length > 0) {
      selectedTags.value = newTagOptions.filter(t => props.question.tag_ids.includes(t.id))
    }
  }
}, { immediate: true })

// 監聽 examQuestion prop 的變化
watch(() => props.examQuestion, (newExamQuestion) => {
  if (newExamQuestion) {
    examSettings.value = {
      order: newExamQuestion.order || 1,
      points: newExamQuestion.points || 0
    }
  }
}, { immediate: true, deep: true })

const addOption = () => {
  formData.value.options.push({
    content: '',
    is_correct: false
  })
}

const removeOption = (index) => {
  formData.value.options.splice(index, 1)
}

const isFormValid = computed(() => {
  const content = (formData.value.content || '').toString().trim()
  const subject = (formData.value.subject || '').toString().trim()
  return content.length > 0 && subject.length > 0
})

const formValidation = computed(() => ({
  content: (formData.value.content || '').toString().trim().length > 0,
  subject: (formData.value.subject || '').toString().trim().length > 0
}))

const getQuestionPayload = () => {
  // Ensure tag_ids are taken from selectedTags
  formData.value.tag_ids = selectedTags.value.map(t => t.id)

  return {
    ...formData.value,
    content: formData.value.content?.toString().trim()
  }
}

const handleSave = () => {
  // 儲存題目基本資料
  // Final guard: trim and ensure content not empty
  if (!isFormValid.value) {
    alert('請填寫題目內容與科目後再儲存。')
    return
  }

  const payload = getQuestionPayload()

  emit('save', {
    questionData: payload,
    examSettings: props.examQuestion ? examSettings.value : null
  })
}

// New: Methods called by parent component
const requestSaveDirect = () => {
  if (!isFormValid.value) {
    alert('請填寫題目內容與科目後再儲存。')
    return
  }
  
  const payload = getQuestionPayload()
  emit('save-direct', { questionData: payload })
}

const requestSavePending = () => {
  if (!isFormValid.value) {
    alert('請填寫題目內容與科目後再加入暫存。')
    return
  }
  
  const payload = getQuestionPayload()
  emit('save-pending', { questionData: payload })
}

// Expose methods for parent component
defineExpose({
  requestSaveDirect,
  requestSavePending,
  isFormValid
})

// Tag service and components
import tagService from '../services/tagService'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { useDebounceFn } from '@vueuse/core'

// tagOptions 和 selectedTags 已在上方定義
const newTagName = ref('')
const tagSearchQuery = ref('')

// 用於在 tagOptions 載入完成後重新設定 selectedTags
const updateSelectedTagsFromIds = () => {
  if (props.question?.tag_ids && Array.isArray(props.question.tag_ids) && tagOptions.value.length > 0) {
    // 如果 selectedTags 還沒設定，根據 tag_ids 設定
    if (selectedTags.value.length === 0 && props.question.tag_ids.length > 0) {
      selectedTags.value = tagOptions.value.filter(t => props.question.tag_ids.includes(t.id))
    }
  }
}

onMounted(async () => {
  try {
    const res = await tagService.getTags()
    let items = res.data?.results || res.data
    if (!Array.isArray(items)) items = []
    tagOptions.value = items.filter(t => t != null)
    // tagOptions 載入完成後，重新設定 selectedTags
    updateSelectedTagsFromIds()
  } catch (err) {
    console.error('載入標籤失敗:', err)
  }
    tagSearchQuery.value = ''
})

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
    // Add to selectedTags (object) and keep formData.tag_ids in sync
    if (!selectedTags.value.find(t => t.id === createdTag.id)) {
      selectedTags.value.push(createdTag)
    }
    formData.value.tag_ids = selectedTags.value.map(t => t.id)
    newTagName.value = ''
  } catch (err) {
    console.error('建立標籤失敗:', err)
    alert('建立標籤失敗')
  }
}

// Debounced search for tags
const doTagSearch = useDebounceFn(async (query) => {
  try {
    const res = await tagService.getTags({ search: query })
    let items = res.data?.results || res.data
    if (!Array.isArray(items)) items = []
    tagOptions.value = items.filter(t => t != null)
  } catch (err) {
    console.error('搜尋標籤失敗: ', err)
  }
}, 250)

const onTagSearch = (query) => {
  tagSearchQuery.value = query
  doTagSearch(query)
}
</script>

<style scoped>
.question-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border, #CBD5E1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 2px solid var(--border, #CBD5E1);
  margin-top: 8px;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary, #476996);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.25);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(71, 105, 150, 0.3);
  border-top-color: var(--primary, #476996);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form Body */
.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  font-size: 14px;
}

.form-label svg {
  color: var(--primary, #476996);
  flex-shrink: 0;
}

.form-label .required {
  color: #ef4444;
  font-weight: 600;
}

/* Form Inputs */
.form-input,
.form-select,
.form-textarea {
  padding: 12px 14px;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  background: white;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary, #476996);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23476996' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: -4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Tag Controls */
.tag-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-multiselect {
  flex: 1;
}

.tag-add-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tag-add-group .form-input {
  flex: 1;
  min-width: 0;
}

.btn-add-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px;
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

.btn-add-tag:hover {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(71, 105, 150, 0.25);
}

/* Options Section */
.options-section {
  background: white;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 12px;
  padding: 20px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--bg-page, #F8FAFC);
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: var(--primary, #476996);
  background: white;
}

.option-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary, #476996);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.option-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.option-input:focus {
  outline: none;
  border-color: var(--primary, #476996);
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid var(--border, #CBD5E1);
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  border-color: var(--primary, #476996);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.btn-remove {
  width: 36px;
  height: 36px;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.btn-add-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  color: var(--primary, #476996);
  border: 2px dashed var(--border, #CBD5E1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.btn-add-option:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  color: var(--primary-hover, #35527a);
}

/* Exam Settings Section */
.exam-settings {
  background: white;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 12px;
  padding: 24px;
  margin-top: 8px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border, #CBD5E1);
}

.settings-header svg {
  color: var(--primary, #476996);
}

.settings-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Dark Mode */
.dark .editor-card {
  background: var(--surface, #1E293B);
  border-color: var(--border, #334155);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.dark .form-label {
  color: var(--text-primary, #F1F5F9);
}

.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  background: var(--surface-muted, #334155);
  border-color: var(--border, #334155);
  color: var(--text-primary, #F1F5F9);
}

.dark .form-input:focus,
.dark .form-select:focus,
.dark .form-textarea:focus {
  border-color: var(--primary, #60A5FA);
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.dark .form-actions {
  border-top-color: var(--border, #334155);
}

.dark .options-section,
.dark .exam-settings {
  background: var(--surface, #1E293B);
  border-color: var(--border, #334155);
}

.dark .option-item {
  background: var(--surface-muted, #334155);
}

.dark .option-item:hover {
  background: var(--surface, #1E293B);
}

.dark .option-input {
  background: var(--surface, #1E293B);
  border-color: var(--border, #334155);
  color: var(--text-primary, #F1F5F9);
}

.dark .checkbox-label {
  background: var(--surface, #1E293B);
  border-color: var(--border, #334155);
  color: var(--text-secondary, #94A3B8);
}

.dark .btn-add-option {
  background: var(--surface, #1E293B);
  border-color: var(--border, #334155);
  color: var(--primary, #60A5FA);
}

.dark .btn-add-option:hover {
  background: var(--surface-muted, #334155);
}

.dark .settings-header h4 {
  color: var(--text-primary, #F1F5F9);
}

.dark .form-body::-webkit-scrollbar-track {
  background: var(--surface-muted, #334155);
}

.dark .form-body::-webkit-scrollbar-thumb {
  background: var(--border, #475569);
}

.dark .form-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #94A3B8);
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-body {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-save {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .option-item {
    flex-wrap: wrap;
  }

  .option-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .checkbox-label {
    flex: 1;
  }

  .tag-controls {
    gap: 10px;
  }

  .tag-add-group {
    flex-direction: column;
  }

  .btn-add-tag {
    width: 100%;
    justify-content: center;
  }
}

/* Scrollbar Styling */
.form-body::-webkit-scrollbar {
  width: 8px;
}

.form-body::-webkit-scrollbar-track {
  background: var(--surface-muted, #E2E8F0);
  border-radius: 4px;
}

.form-body::-webkit-scrollbar-thumb {
  background: var(--border, #CBD5E1);
  border-radius: 4px;
}

.form-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #64748B);
}
</style>
