<template>
  <div class="exam-edit-view">
    <!-- 上方：考卷資訊表單 -->
    <ExamForm :exam="exam" :saving="savingExam" @save="handleSaveExam" @cancel="handleCancel" />


    <!-- 下方：題目列表全寬 -->
    <div class="content-container">
      <QuestionList ref="questionListRef" :questions="allQuestions" :selected-question-id="selectedQuestionId"
        :loading="loadingQuestions" v-model:total-points="autoPointsTotal"
        :auto-distribute-loading="autoDistributeLoading" :pending-edits="pendingQuestionEdits"
        :show-auto-distribute="true" :show-add-question="isAdmin" :tags="tags" :search-results="searchQuestions"
        :search-loading="searchLoading" :total-search-count="searchTotalCount" @select-question="handleSelectQuestion"
        @add-question="handleAddQuestion" @add-existing-question="showAddModal = true"
        @remove-question="handleRemoveQuestion" @auto-distribute="autoDistributePoints"
        @update:selected-ids="handleSelectedIdsChange" @search-questions="handleSearchQuestions"
        @load-tags="handleLoadTags" @add-search-results="handleAddSearchResultsToExam" />
    </div>

    <!-- 編輯題目彈窗 -->
    <div v-if="isEditQuestionModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">編輯題目</h5>
            <button type="button" class="btn-close" @click="closeEditModal" :disabled="savingQuestion"></button>
          </div>
          <div class="modal-body">
            <QuestionEditor v-if="selectedQuestion" :question="selectedQuestion" :exam-question="selectedExamQuestion"
              :saving="savingQuestion" @save="handleSaveQuestion" />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增題目的彈窗 -->
    <AddQuestionModal v-if="showAddModal" :existing-question-ids="existingQuestionIds" @close="showAddModal = false"
      @add="handleAddQuestionToExam" />
    <!-- BulkTagEditor and BulkSubjectEditor are moved to AdminQuestionManagement -->

    <!-- 儲存進度 Modal -->
    <div v-if="isSavingProgressVisible" class="saving-overlay">
      <div class="saving-modal">
        <!-- Header -->
        <div class="saving-header">
          <div class="saving-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" class="saving-icon-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
          <div>
            <h3 class="saving-title">儲存進度</h3>
            <p class="saving-subtitle">{{ savingProgressMessage }}</p>
          </div>
        </div>

        <!-- Body -->
        <div class="saving-body">
          <!-- 進度資訊 -->
          <div v-if="savingTotalSteps > 0" class="saving-steps">
            <span class="saving-current">{{ savingCurrentStep }}</span>
            <span class="saving-divider">/</span>
            <span class="saving-total">{{ savingTotalSteps }}</span>
          </div>

          <!-- 進度條 -->
          <div class="saving-progress-container">
            <div class="saving-progress-bar" :style="{ width: savingProgressPercent + '%' }"></div>
          </div>
          <div class="saving-percent">{{ savingProgressPercent }}%</div>
        </div>
      </div>
    </div>

    <!-- 自動配分 Modal -->
    <div v-if="isAutoDistributeModalVisible" class="auto-distribute-overlay"
      @click.self="isAutoDistributeModalVisible = false">
      <div class="auto-distribute-modal">
        <!-- Header -->
        <div class="ad-modal-header">
          <div class="ad-header-content">
            <div class="ad-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </div>
            <div>
              <h3 class="ad-modal-title">自動配分試算</h3>
              <p class="ad-modal-subtitle">根據總分自動平均分配每題分數</p>
            </div>
          </div>
          <button class="ad-close-btn" @click="isAutoDistributeModalVisible = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="ad-modal-body">
          <!-- 滿分輸入 -->
          <div class="ad-input-section">
            <label for="autoDistributePointsInput" class="ad-input-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-4"></path>
              </svg>
              總分設定
            </label>
            <div class="ad-input-wrapper">
              <input id="autoDistributePointsInput" v-model.number="autoPointsTotal" type="number" min="1" step="0.01"
                class="ad-input" @input="calculateAutoDistribute" />
              <span class="ad-input-unit">分</span>
            </div>
          </div>

          <!-- 試算結果 -->
          <div v-if="autoDistributeQuotaList.length > 0" class="ad-result-section">
            <div class="ad-result-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              試算結果
            </div>
            <div class="ad-result-grid">
              <div class="ad-result-item">
                <div class="ad-result-label">題目數量</div>
                <div class="ad-result-value">{{ autoDistributeQuotaList.length }} <span class="ad-result-unit">題</span>
                </div>
              </div>
              <div class="ad-result-item">
                <div class="ad-result-label">平均配分</div>
                <div class="ad-result-value">{{ (autoPointsTotal / autoDistributeQuotaList.length).toFixed(2) }} <span
                    class="ad-result-unit">分/題</span></div>
              </div>
            </div>
          </div>

          <!-- 提示訊息 -->
          <div v-if="autoDistributeMessage" class="ad-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            {{ autoDistributeMessage }}
          </div>
        </div>

        <!-- Footer -->
        <div class="ad-modal-footer">
          <button class="ad-btn ad-btn-secondary" @click="isAutoDistributeModalVisible = false">
            取消
          </button>
          <button class="ad-btn ad-btn-primary" @click="applyAutoDistribute" :disabled="autoDistributeLoading">
            <svg v-if="!autoDistributeLoading" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div v-else class="ad-btn-spinner"></div>
            {{ autoDistributeLoading ? '套用中...' : '確認配分' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/examStore'
import ExamForm from '../components/ExamForm.vue'
import QuestionEditor from '../components/QuestionEditor.vue'
import QuestionList from '../components/QuestionList.vue'
import AddQuestionModal from '../components/AddQuestionModal.vue'
import questionService from '../services/questionService'
import tagService from '../services/tagService'
import { usePdfImportStore } from '../stores/pdfImport'

const currentUser = inject('currentUser', null)

const route = useRoute()
const router = useRouter()
const pdfImportStore = usePdfImportStore()

const examStore = useExamStore()

// 考卷資料
const exam = ref(null)
const examQuestions = ref([])
const autoPointsTotal = ref(100)
const autoDistributeLoading = ref(false)
const pendingQuestionEdits = ref({})

// 暫存的 PDF 解析題目（尚未儲存到資料庫）
const pendingQuestions = ref([])

// 暫存的現有題目連結（已存在的題目，只需建立考卷關聯）
// 格式: [{ questionId, questionContent, questionSubject, points }]
const pendingExamLinks = ref([])

// 選中的題目
const selectedQuestionId = ref(null)
const selectedQuestion = ref(null)
const selectedExamQuestion = ref(null)

// 多選的題目 IDs
const selectedQuestionIds = ref([])
const questionListRef = ref(null)

// 載入和儲存狀態
const loadingQuestions = ref(false)
const savingExam = ref(false)
const savingQuestion = ref(false)
const isEditQuestionModalVisible = ref(false)

// 儲存進度 Modal
const isSavingProgressVisible = ref(false)
const savingProgressMessage = ref('準備儲存...')
const savingProgressPercent = ref(0)
const savingCurrentStep = ref(0)
const savingTotalSteps = ref(0)
const savingStepType = ref('') // 'exam', 'questions', 'updates'

// 新增題目彈窗
const showAddModal = ref(false)

// 自動配分 Modal
const isAutoDistributeModalVisible = ref(false)
const autoDistributeQuotaList = ref([])
const autoDistributeMessage = ref('')

// 搜尋題目相關
const tags = ref([])
const searchQuestions = ref([])
const searchLoading = ref(false)
const searchTotalCount = ref(0)

// 計算 examId
const examId = computed(() => {
  return route.params.id ? parseInt(route.params.id) : null
})

// 檢查是否為管理員
const isAdmin = computed(() => {
  return currentUser?.value?.isAdmin || false
})

// 合併已儲存的題目和暫存的題目
const allQuestions = computed(() => {
  // 已儲存的題目
  const saved = examQuestions.value.map(eq => ({
    ...eq,
    isPending: false,
    isExistingLink: false
  }))

  // 暫存的新題目（需要建立題目 + 關聯）
  const pending = pendingQuestions.value.map((q, index) => ({
    id: `pending-${index}`,
    question: null,
    order: q.order !== undefined ? q.order : (saved.length + index + 1),
    points: q.points || 0,
    question_content: q.content || q.question || '',
    question_subject: q.subject || exam.value?.name || '',
    question_category: q.category || '',
    isPending: true,
    isExistingLink: false,
    pendingData: q // 保存完整的暫存資料
  }))

  // 暫存的現有題目連結（只需建立關聯）
  const links = pendingExamLinks.value.map((link, index) => ({
    id: `link-${index}`,
    question: link.questionId,
    order: link.order !== undefined ? link.order : (saved.length + pending.length + index + 1),
    points: link.points || 1,
    question_content: link.questionContent || '',
    question_subject: link.questionSubject || '',
    question_category: link.questionCategory || '',
    isPending: false,
    isExistingLink: true,
    linkData: link
  }))

  return [...saved, ...pending, ...links]
})

// 已存在的題目 IDs（用於排除）
const existingQuestionIds = computed(() => {
  const savedIds = examQuestions.value
    .filter(eq => eq.question)
    .map(eq => eq.question)

  // Also include pending exam links
  const pendingLinkIds = pendingExamLinks.value.map(link => link.questionId)

  return [...savedIds, ...pendingLinkIds]
})

// 載入考卷資料
const loadExam = async () => {
  if (!examId.value) {
    // 新建模式
    exam.value = null
    return
  }

  try {
    const response = await examStore.getExam(examId.value)
    exam.value = response.data
    examQuestions.value = response.data.exam_questions || []
  } catch (error) {
    console.error('載入考卷失敗:', error)
    alert('載入考卷失敗')
  }
}

// 儲存考卷
const handleSaveExam = async (examData) => {
  savingExam.value = true
  isSavingProgressVisible.value = true
  savingProgressMessage.value = '準備儲存...'
  savingProgressPercent.value = 0

  try {
    let currentExamId = examId.value

    savingProgressMessage.value = '儲存考卷資訊...'
    savingProgressPercent.value = 10

    if (currentExamId) {
      // 更新現有考卷
      const response = await examStore.updateExam(currentExamId, examData)
      exam.value = response.data
    } else {
      // 建立新考卷
      const response = await examStore.createExam(examData)
      exam.value = response.data
      currentExamId = response.data.id
      // 根據使用者角色導向不同頁面
      if (isAdmin.value) {
        // 管理員導向管理員編輯頁面
        await router.replace(`/admin/exams/${response.data.id}/edit`)
      } else {
        // 普通使用者導向普通編輯頁面
        await router.replace(`/exams/${response.data.id}/edit`)
      }
    }

    const summaryParts = []
    let shouldReload = false

    // 如果有暫存的題目，批次建立並加入考卷（改用 bulk API）
    if (pendingQuestions.value.length > 0) {
      savingProgressMessage.value = `建立題目中`
      savingProgressPercent.value = 20
      savingStepType.value = 'questions'
      savingTotalSteps.value = pendingQuestions.value.length
      savingCurrentStep.value = 0

      console.log(`開始批次建立 ${pendingQuestions.value.length} 個題目...`)
      const createPayload = []
      const meta = [] // keep mapping of index -> order & points for later adding to exam
      let skipCount = 0

      for (let i = 0; i < pendingQuestions.value.length; i++) {
        const questionData = pendingQuestions.value[i]
        const questionPayload = {
          subject: questionData.subject,
          category: questionData.category,
          question_type: questionData.question_type || '選擇題',
          difficulty: questionData.difficulty || 'medium',
          content: questionData.content,
          explanation: questionData.explanation,
          status: 'published',
          options: questionData.options,
          tag_ids: questionData.tag_ids || []
        }

        // basic validation: ensure required fields exist
        if (!questionPayload.content || !questionPayload.content.trim() || !questionPayload.subject || !questionPayload.subject.trim()) {
          console.warn(`跳過建立題目 #${i + 1}: content or subject 為空`)
          skipCount++
          continue
        }

        createPayload.push(questionPayload)
        meta.push({ index: i, order: questionData.order !== undefined ? questionData.order : (examQuestions.value.length + i + 1), points: questionData.points })
      }

      let successCount = 0
      let failCount = 0
      if (createPayload.length > 0) {
        try {
          const res = await questionService.bulkCreateQuestions(createPayload)
          const results = res.data?.results || res.data
          for (let i = 0; i < results.length; i++) {
            const r = results[i]
            const m = meta[i]

            // 更新進度
            savingCurrentStep.value = i + 1
            savingProgressMessage.value = `建立題目中 (${i + 1}/${results.length}題)`
            savingProgressPercent.value = 20 + Math.floor((i / results.length) * 30)

            if (r.success) {
              // Add created question to exam
              try {
                await examStore.addQuestionToExam(currentExamId, {
                  question: r.id,
                  order: m.order,
                  points: m.points
                })
                successCount++
              } catch (err) {
                console.error('加入考卷失敗', err)
                failCount++
              }
            } else {
              failCount++
              const detail = r.errors
              summaryParts.push(`${r.index !== undefined ? `第 ${r.index + 1} 題` : '某題'} 建立失敗: ${JSON.stringify(detail)}`)
            }
          }
        } catch (err) {
          // fallback: if bulk create failed entirely, try single create to get more info - but for now, treat as failed
          console.error('批次建立題目失敗', err)
          summaryParts.push(`批次建立題目失敗: ${err.response?.data || err.message}`)
          failCount += createPayload.length
        }
      }

      // 清空暫存列表（已加入或嘗試加入）
      pendingQuestions.value = []
      shouldReload = true
      summaryParts.push(`題目建立：成功 ${successCount} 題，失敗 ${failCount} 題，略過 ${skipCount} 題`)
    }

    // 處理暫存的現有題目連結（不需建立題目，只需建立關聯）
    if (pendingExamLinks.value.length > 0) {
      savingProgressMessage.value = `加入現有題目中`
      savingProgressPercent.value = 45

      let linkSuccessCount = 0
      let linkFailCount = 0
      const currentOrder = examQuestions.value.length + (pendingQuestions.value.length || 0)

      for (let i = 0; i < pendingExamLinks.value.length; i++) {
        const link = pendingExamLinks.value[i]
        savingCurrentStep.value = i + 1
        savingProgressMessage.value = `加入現有題目中 (${i + 1}/${pendingExamLinks.value.length}題)`

        try {
          await examStore.addQuestionToExam(currentExamId, {
            question: link.questionId,
            order: link.order !== undefined ? link.order : (currentOrder + i + 1),
            points: link.points || 1
          })
          linkSuccessCount++
        } catch (err) {
          console.error('加入現有題目失敗', err)
          linkFailCount++
        }
      }

      // 清空暫存連結列表
      pendingExamLinks.value = []
      shouldReload = true
      if (linkSuccessCount > 0 || linkFailCount > 0) {
        summaryParts.push(`現有題目加入：成功 ${linkSuccessCount} 題，失敗 ${linkFailCount} 題`)
      }
    }

    savingProgressMessage.value = '更新題目設定中'
    savingProgressPercent.value = 50
    savingStepType.value = 'updates'

    const { questionUpdates, settingUpdates, errors: editErrors } = await applyPendingQuestionEdits(currentExamId)
    if (questionUpdates || settingUpdates || (editErrors && editErrors.length)) {
      shouldReload = true
      savingProgressPercent.value = 75
      summaryParts.push(`暫存更新：題目內容 ${questionUpdates} 題、配分/順序 ${settingUpdates} 題`)
      if (editErrors && editErrors.length) {
        editErrors.forEach(err => {
          summaryParts.push(`更新失敗：${JSON.stringify(err)}`)
        })
      }
    }

    if (shouldReload) {
      savingProgressMessage.value = '重新載入資料...'
      savingProgressPercent.value = 85
      await loadExam()
    }

    savingProgressMessage.value = '完成！'
    savingProgressPercent.value = 100

    const baseMessage = summaryParts.length
      ? `考卷儲存成功！\n${summaryParts.join('\n')}`
      : '考卷儲存成功'

    // 1 秒後關閉 Modal
    setTimeout(() => {
      isSavingProgressVisible.value = false
      savingProgressPercent.value = 0
      savingProgressMessage.value = '準備儲存...'
      savingCurrentStep.value = 0
      savingTotalSteps.value = 0
      savingStepType.value = ''
      alert(baseMessage)
    }, 1000)
  } catch (error) {
    console.error('儲存考卷失敗:', error)
    console.error('錯誤詳情:', error.response?.data)
    console.error('發送的資料:', examData)
    isSavingProgressVisible.value = false
    savingProgressPercent.value = 0
    savingProgressMessage.value = '準備儲存...'
    alert('儲存考卷失敗：' + JSON.stringify(error.response?.data || error.message))
  } finally {
    savingExam.value = false
  }
}

// PDF import dialog trigger removed from toolbar.

// 取消編輯
const handleCancel = () => {
  router.push('/admin/exams')
}

const closeEditModal = () => {
  isEditQuestionModalVisible.value = false
  // 可選：延遲清除選中題目以避免 modal 關閉時閃爍
  setTimeout(() => {
    if (!isEditQuestionModalVisible.value) {
      selectedQuestionId.value = null
      selectedQuestion.value = null
      selectedExamQuestion.value = null
    }
  }, 300)
}

const handleSelectQuestion = async (examQuestion) => {
  // If it's a search result, don't allow editing (they need to be added to exam first)
  if (examQuestion.isSearchResult) {
    alert('請先將題目加入考卷後再進行編輯')
    return
  }

  selectedQuestionId.value = examQuestion.question
  selectedExamQuestion.value = {
    ...examQuestion,
    ...(pendingQuestionEdits.value[examQuestion.id]?.examSettings || {})
  }

  // 如果是暫存題目，直接使用暫存的資料
  if (examQuestion.isPending && examQuestion.pendingData) {
    selectedQuestion.value = {
      id: null,
      subject: examQuestion.pendingData.subject,
      category: examQuestion.pendingData.category,
      question_type: examQuestion.pendingData.question_type || '選擇題',
      difficulty: examQuestion.pendingData.difficulty || 'medium',
      content: examQuestion.pendingData.content,
      explanation: examQuestion.pendingData.explanation,
      status: 'draft',
      options: examQuestion.pendingData.options || [],
      tag_ids: examQuestion.pendingData.tag_ids || [],
      tags: null // 標籤從 tag_ids 解析，讓 QuestionEditor 自行處理
    }
    isEditQuestionModalVisible.value = true
    return
  }

  // 載入完整的題目資料（已儲存的題目）
  if (!examQuestion.question) return

  loadingQuestions.value = true
  try {
    const response = await questionService.getQuestion(examQuestion.question)
    const pendingEdit = pendingQuestionEdits.value[examQuestion.id]
    selectedQuestion.value = pendingEdit?.questionData
      ? { ...response.data, ...pendingEdit.questionData }
      : response.data
    // 打開編輯 modal
    isEditQuestionModalVisible.value = true
  } catch (error) {
    console.error('載入題目失敗:', error)
    alert('載入題目失敗')
  } finally {
    loadingQuestions.value = false
  }
}

// 重新排序暫存題目（當修改 order 時自動調整其他暫存題目）
// 注意：已保存的題目會由後端 API 自動重排序
const reorderPendingQuestions = (currentId, newOrder, oldOrder) => {
  // 獲取所有題目（已保存的和暫存的）
  const allQs = allQuestions.value

  // 如果順序沒變，不需要重排
  if (newOrder === oldOrder) return

  // 只調整暫存題目的順序（已保存的題目會由後端自動處理）
  allQs.forEach(q => {
    if (q.id === currentId) return // 跳過當前題目
    if (!q.isPending) return // 跳過已保存的題目（後端會處理）

    const qOrder = q.order || 0

    if (newOrder < oldOrder) {
      // 向前移動：原本在 [newOrder, oldOrder) 之間的題目順序 +1
      if (qOrder >= newOrder && qOrder < oldOrder) {
        const idx = parseInt(q.id.replace('pending-', ''))
        if (pendingQuestions.value[idx]) {
          pendingQuestions.value[idx].order = qOrder + 1
        }
      }
    } else {
      // 向後移動：(oldOrder, newOrder] 之間的題目順序 -1
      if (qOrder > oldOrder && qOrder <= newOrder) {
        const idx = parseInt(q.id.replace('pending-', ''))
        if (pendingQuestions.value[idx]) {
          pendingQuestions.value[idx].order = qOrder - 1
        }
      }
    }
  })
}

const queueExamQuestionEdit = (examQuestionId, payload) => {
  const current = pendingQuestionEdits.value[examQuestionId] || {}

  pendingQuestionEdits.value = {
    ...pendingQuestionEdits.value,
    [examQuestionId]: {
      questionId: payload.questionId || current.questionId,
      questionData: payload.questionData || current.questionData,
      examSettings: payload.examSettings
        ? { ...(current.examSettings || {}), ...payload.examSettings }
        : current.examSettings
    }
  }
}

const applyPendingQuestionEdits = async (currentExamId) => {
  if (!currentExamId) {
    return { questionUpdates: 0, settingUpdates: 0 }
  }

  const entries = Object.entries(pendingQuestionEdits.value)
  if (!entries.length) {
    return { questionUpdates: 0, settingUpdates: 0 }
  }

  let questionUpdates = 0
  let settingUpdates = 0
  const errors = []

  for (let idx = 0; idx < entries.length; idx++) {
    const [examQuestionId, edit] = entries[idx]

    // 更新進度
    savingCurrentStep.value = idx + 1
    savingProgressMessage.value = `更新題目設定中 (${idx + 1}/${entries.length}題)`
    savingProgressPercent.value = 50 + Math.floor((idx / entries.length) * 25)

    if (edit.questionData && edit.questionId) {
      try {
        await questionService.updateQuestion(edit.questionId, edit.questionData)
        questionUpdates += 1
      } catch (err) {
        console.error('更新題目失敗:', err)
        errors.push({ id: edit.questionId, error: err.response?.data || err.message })
      }
    }

    if (edit.examSettings) {
      const payload = {}
      if (edit.examSettings.order !== undefined) {
        payload.order = edit.examSettings.order
      }
      if (edit.examSettings.points !== undefined) {
        payload.points = edit.examSettings.points
      }

      if (Object.keys(payload).length > 0) {
        try {
          await examStore.updateExamQuestion(currentExamId, {
            exam_question_id: Number(examQuestionId),
            ...payload
          })
          settingUpdates += 1
        } catch (err) {
          console.error('更新考卷題目設定失敗:', err)
          errors.push({ exam_question_id: Number(examQuestionId), error: err.response?.data || err.message })
        }
      }
    }
  }

  pendingQuestionEdits.value = {}
  return { questionUpdates, settingUpdates, errors }
}

// 儲存題目
const handleSaveQuestion = async ({ questionData, examSettings }) => {
  savingQuestion.value = true
  try {
    // 如果是暫存題目，只更新暫存資料
    if (selectedExamQuestion.value?.isPending) {
      const pendingId = selectedExamQuestion.value.id
      const index = parseInt(pendingId.replace('pending-', ''))

      if (pendingQuestions.value[index]) {
        const oldOrder = pendingQuestions.value[index].order || (examQuestions.value.length + index + 1)
        const newOrder = examSettings?.order || oldOrder

        // 如果順序改變了，重新排序其他暫存題目
        if (newOrder !== oldOrder) {
          reorderPendingQuestions(pendingId, newOrder, oldOrder)
        }

        // 更新暫存題目的資料
        pendingQuestions.value[index] = {
          ...pendingQuestions.value[index],
          subject: questionData.subject,
          category: questionData.category,
          question_type: questionData.question_type,
          difficulty: questionData.difficulty,
          tag_ids: questionData.tag_ids || pendingQuestions.value[index].tag_ids || [],
          content: questionData.content,
          explanation: questionData.explanation,
          options: questionData.options,
          points: examSettings?.points || pendingQuestions.value[index].points,
          order: newOrder
        }

        alert('暫存題目已更新\n請儲存考卷以建立此題目')

        // 重新選擇這個題目以刷新顯示
        await handleSelectQuestion(selectedExamQuestion.value)
      }
      return
    }

    if (!selectedExamQuestion.value || !selectedQuestionId.value) return

    queueExamQuestionEdit(selectedExamQuestion.value.id, {
      questionId: selectedQuestionId.value,
      questionData,
      examSettings: examSettings || undefined
    })

    const eqIndex = examQuestions.value.findIndex(eq => eq.id === selectedExamQuestion.value.id)
    if (eqIndex !== -1) {
      const current = examQuestions.value[eqIndex]
      examQuestions.value[eqIndex] = {
        ...current,
        question_content: questionData.content,
        question_subject: questionData.subject,
        question_category: questionData.category,
        points: examSettings?.points ?? current.points,
        order: examSettings?.order ?? current.order
      }
    }

    selectedExamQuestion.value = {
      ...selectedExamQuestion.value,
      points: examSettings?.points ?? selectedExamQuestion.value.points,
      order: examSettings?.order ?? selectedExamQuestion.value.order,
      question_content: questionData.content,
      question_subject: questionData.subject,
      question_category: questionData.category
    }

    selectedQuestion.value = selectedQuestion.value
      ? { ...selectedQuestion.value, ...questionData }
      : { ...questionData }

    alert('變更已暫存，請於儲存考卷後套用至資料庫。')
  } catch (error) {
    console.error('儲存題目失敗:', error)
    alert('儲存題目失敗：' + (error.response?.data?.message || error.message))
  } finally {
    savingQuestion.value = false
  }
}

// 新增空白題目
const handleAddQuestion = () => {
  // 創建一個新的空白題目到 pending 列表
  const newQuestion = {
    content: '',
    subject: exam.value?.name || '未分類',
    category: '選擇題',
    question_type: '選擇題',
    difficulty: 'medium',
    tag_ids: [],
    explanation: '',
    options: [
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false }
    ],
    points: 1
  }

  // 加入到暫存列表
  pendingQuestions.value.push(newQuestion)

  // 自動選中這個新題目
  const newIndex = pendingQuestions.value.length - 1
  const newExamQuestion = {
    id: `pending-${newIndex}`,
    question: null,
    order: examQuestions.value.length + newIndex + 1,
    points: newQuestion.points,
    question_content: newQuestion.content,
    question_subject: newQuestion.subject,
    question_category: newQuestion.category,
    isPending: true,
    pendingData: newQuestion
  }

  handleSelectQuestion(newExamQuestion)
}

// 將題目新增到考卷（支援多選）
const handleAddQuestionToExam = async (questionIds, points) => {
  if (!examId.value) return

  // 確保 questionIds 是陣列
  const ids = Array.isArray(questionIds) ? questionIds : [questionIds]

  try {
    let successCount = 0
    let failCount = 0
    const currentOrder = examQuestions.value.length

    for (let i = 0; i < ids.length; i++) {
      try {
        await examStore.addQuestionToExam(examId.value, {
          question: ids[i],
          order: currentOrder + i + 1,
          points: points
        })
        successCount++
      } catch (err) {
        console.error(`新增題目 ${ids[i]} 失敗:`, err)
        failCount++
      }
    }

    showAddModal.value = false

    if (failCount === 0) {
      alert(`成功新增 ${successCount} 題`)
    } else {
      alert(`新增完成：成功 ${successCount} 題，失敗 ${failCount} 題`)
    }

    // 重新載入考卷資料
    await loadExam()
  } catch (error) {
    console.error('新增題目失敗:', error)
    alert('新增題目失敗：' + (error.response?.data?.message || error.message))
  }
}

// 處理多選變更
const handleSelectedIdsChange = (ids) => {
  selectedQuestionIds.value = ids
}

// 從搜尋結果加入題目到暫存（不直接儲存）
const handleAddSearchResultsToExam = async (questionIds, points) => {
  if (!questionIds || questionIds.length === 0) return

  try {
    // 獲取搜尋結果中對應的題目詳細資料
    const questionsToAdd = []

    for (const qid of questionIds) {
      try {
        // 從 API 獲取完整的題目資料（包括 options）
        const response = await questionService.getQuestion(qid)
        const q = response.data

        questionsToAdd.push({
          content: q.content || q.question_content,
          subject: q.subject_name || q.subject,
          category: q.category,
          question_type: q.question_type || '選擇題',
          difficulty: q.difficulty || 'medium',
          explanation: q.explanation || '',
          options: q.options || [],
          tag_ids: (q.tags || []).map(t => t.id),
          points: points || 1,
          order: examQuestions.value.length + pendingQuestions.value.length + questionsToAdd.length + 1
        })
      } catch (error) {
        console.error(`獲取題目 ${qid} 失敗:`, error)
        // 繼續處理其他題目
      }
    }

    if (questionsToAdd.length > 0) {
      // 加入到 pendingQuestions
      pendingQuestions.value.push(...questionsToAdd)
      alert(`已加入 ${questionsToAdd.length} 題到暫存，請記得儲存考卷`)
    } else {
      alert('無法找到選擇的題目')
    }
  } catch (error) {
    console.error('加入題目失敗:', error)
    alert('加入題目失敗：' + (error.message || '未知錯誤'))
  }
}

// 載入標籤
const handleLoadTags = async () => {
  try {
    const { data } = await tagService.getTags({ limit: 200 })
    tags.value = Array.isArray(data) ? data : (data?.results || [])
  } catch (error) {
    console.error('載入標籤失敗:', error)
    tags.value = []
  }
}
// 搜尋題目
const handleSearchQuestions = async (filters, page = 1, pageSize = 20) => {
  searchLoading.value = true
  try {
    const { data } = await questionService.getQuestions({
      subject: filters.subject || null,
      difficulty: filters.difficulty || null,
      keyword: filters.search || null,
      page,
      page_size: pageSize
    })

    let results = Array.isArray(data) ? data : (data?.results || [])

    if (filters.source) {
      results = results.filter(q => (q.source || '') === filters.source)
    }

    if (filters.tags && filters.tags.length > 0) {
      const selectedTagIds = filters.tags.map(t => t.id)
      const tagMode = filters.tag_mode === 'and' ? 'and' : 'or'
      results = results.filter((q) => {
        const tagIds = Array.isArray(q.tags) ? q.tags.map(tag => tag.id) : []
        if (tagMode === 'and') {
          return selectedTagIds.every(id => tagIds.includes(id))
        }
        return selectedTagIds.some(id => tagIds.includes(id))
      })
    }

    // Transform search results to match exam question format
    searchQuestions.value = results.map(q => ({
      id: `search-${q.id}`,
      question: q.id,
      question_content: q.content || q.question_content,
      question_subject: q.subject_name || q.subject,
      question_category: q.category,
      difficulty: q.difficulty,
      tags: q.tags,
      points: 1,
      order: 0,
      isSearchResult: true,
      originalQuestion: q
    }))
    searchTotalCount.value = (filters.tags && filters.tags.length > 0)
      ? results.length
      : (data?.count || results.length)
  } catch (error) {
    console.error('搜尋題目失敗:', error)
    searchQuestions.value = []
    searchTotalCount.value = 0
  } finally {
    searchLoading.value = false
  }
}

// Bulk tag/subject handlers removed; feature moved to AdminQuestionManagement

// 從考卷移除題目
const handleRemoveQuestion = async (examQuestionId) => {
  if (!confirm('確定要移除這個題目嗎？')) return

  try {
    // 如果是暫存題目，直接從陣列中移除
    if (typeof examQuestionId === 'string' && examQuestionId.startsWith('pending-')) {
      const index = parseInt(examQuestionId.replace('pending-', ''))
      pendingQuestions.value.splice(index, 1)

      // 如果移除的是當前選中的題目，清空選擇
      if (selectedExamQuestion.value?.id === examQuestionId) {
        selectedQuestionId.value = null
        selectedQuestion.value = null
        selectedExamQuestion.value = null
      }

      alert('暫存題目已移除')
      return
    }

    // 如果是暫存的現有題目連結，從陣列中移除
    if (typeof examQuestionId === 'string' && examQuestionId.startsWith('link-')) {
      const index = parseInt(examQuestionId.replace('link-', ''))
      pendingExamLinks.value.splice(index, 1)

      // 如果移除的是當前選中的題目，清空選擇
      if (selectedExamQuestion.value?.id === examQuestionId) {
        selectedQuestionId.value = null
        selectedQuestion.value = null
        selectedExamQuestion.value = null
      }

      alert('題目已從暫存列表移除')
      return
    }

    // 已儲存的題目，呼叫 API 移除
    if (pendingQuestionEdits.value[examQuestionId]) {
      const nextEdits = { ...pendingQuestionEdits.value }
      delete nextEdits[examQuestionId]
      pendingQuestionEdits.value = nextEdits
    }

    await examStore.removeQuestionFromExam(examId.value, examQuestionId)
    alert('題目移除成功')

    // 如果移除的是當前選中的題目，清空選擇
    if (selectedExamQuestion.value?.id === examQuestionId) {
      selectedQuestionId.value = null
      selectedQuestion.value = null
      selectedExamQuestion.value = null
    }

    // 重新載入考卷資料
    await loadExam()
  } catch (error) {
    console.error('移除題目失敗:', error)
    alert('移除題目失敗：' + (error.response?.data?.message || error.message))
  }
}

// 批次移除題目
const handleBulkRemove = async () => {
  if (selectedQuestionIds.value.length === 0) return
  if (!confirm(`確定要移除選取的 ${selectedQuestionIds.value.length} 個題目嗎？`)) return

  let successCount = 0
  let failCount = 0

  for (const id of selectedQuestionIds.value) {
    try {
      if (typeof id === 'string' && id.startsWith('pending-')) {
        const index = parseInt(id.replace('pending-', ''))
        pendingQuestions.value.splice(index, 1)
        successCount++
      } else if (typeof id === 'string' && id.startsWith('link-')) {
        const index = parseInt(id.replace('link-', ''))
        pendingExamLinks.value.splice(index, 1)
        successCount++
      } else {
        if (pendingQuestionEdits.value[id]) {
          const nextEdits = { ...pendingQuestionEdits.value }
          delete nextEdits[id]
          pendingQuestionEdits.value = nextEdits
        }
        await examStore.removeQuestionFromExam(examId.value, id)
        successCount++
      }
    } catch (err) {
      console.error(`移除題目 ${id} 失敗:`, err)
      failCount++
    }
  }

  // 清空選擇
  selectedQuestionIds.value = []
  selectedQuestionId.value = null
  selectedQuestion.value = null
  selectedExamQuestion.value = null

  if (failCount === 0) {
    alert(`成功移除 ${successCount} 題`)
  } else {
    alert(`移除完成：成功 ${successCount} 題，失敗 ${failCount} 題`)
  }

  await loadExam()
}

const startAutoDistribute = async () => {
  calculateAutoDistribute()
}

const calculateAutoDistribute = () => {
  const questions = [...allQuestions.value].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (orderA === orderB) {
      return String(a.id).localeCompare(String(b.id))
    }
    return orderA - orderB
  })

  if (!questions.length) {
    autoDistributeMessage.value = '目前尚無題目可配分'
    autoDistributeQuotaList.value = []
    return
  }

  const total = Number(autoPointsTotal.value)
  if (!Number.isFinite(total) || total <= 0) {
    autoDistributeMessage.value = '請輸入大於 0 的滿分'
    autoDistributeQuotaList.value = []
    return
  }

  const totalCents = Math.round(total * 100)
  const count = questions.length
  const base = Math.floor(totalCents / count)
  let remainder = totalCents - base * count

  autoDistributeQuotaList.value = questions.map((question) => {
    let cents = base
    if (remainder > 0) {
      cents += 1
      remainder -= 1
    }
    const points = cents / 100

    return {
      id: question.id,
      content: question.question_content || question.pendingData?.content || '（暫存題目）',
      points: points
    }
  })

  autoDistributeMessage.value = `將自動均勻分配 ${total} 分至 ${count} 題`
}

const applyAutoDistribute = async () => {
  if (autoDistributeQuotaList.value.length === 0) {
    alert('請先計算配分試算')
    return
  }

  autoDistributeLoading.value = true

  try {
    const questions = [...allQuestions.value].sort((a, b) => {
      const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
      const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
      if (orderA === orderB) {
        return String(a.id).localeCompare(String(b.id))
      }
      return orderA - orderB
    })

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const quotaItem = autoDistributeQuotaList.value[i]
      const points = quotaItem.points

      if (question.isPending) {
        const pendingIndex = parseInt(String(question.id).replace('pending-', ''), 10)
        if (!Number.isNaN(pendingIndex) && pendingQuestions.value[pendingIndex]) {
          pendingQuestions.value[pendingIndex].points = points
        }
      } else if (question.id) {
        queueExamQuestionEdit(question.id, {
          examSettings: { points }
        })

        const eqIndex = examQuestions.value.findIndex(eq => eq.id === question.id)
        if (eqIndex !== -1) {
          examQuestions.value[eqIndex] = {
            ...examQuestions.value[eqIndex],
            points
          }
        }

        if (selectedExamQuestion.value?.id === question.id) {
          selectedExamQuestion.value = {
            ...selectedExamQuestion.value,
            points
          }
        }
      }
    }

    isAutoDistributeModalVisible.value = false
    autoDistributeQuotaList.value = []
    autoDistributeMessage.value = ''
    alert(`已配分完成！請記得儲存考卷以套用變更。`)
  } catch (error) {
    console.error('應用配分失敗:', error)
    alert('應用配分失敗，請稍後再試。')
  } finally {
    autoDistributeLoading.value = false
  }
}

const autoDistributePoints = async () => {
  // 打開配分試算 Modal
  isAutoDistributeModalVisible.value = true
  calculateAutoDistribute()
}

// 處理 PDF 匯入
const handlePdfImport = ({ examData, questions, answers }) => {
  console.log('處理 PDF 匯入:', { examData, questions, answers })

  // 1. 自動填寫考卷欄位
  if (examData) {
    exam.value = {
      name: examData.name || exam.value?.name || '',
      description: examData.description || exam.value?.description || '',
      time_limit: examData.time_limit || exam.value?.time_limit || null
    }
  }

  // 2. 將解析的題目加入暫存列表
  const processedQuestions = questions.map((q, index) => {
    // 取得此題目的答案
    const correctAnswer = answers?.answers?.[index] || q.correct_answer
    const hasModifiedAnswer = correctAnswer === '*'

    // 處理選項：將字串陣列轉換為物件陣列，並根據答案標記正確選項
    const options = (q.options || []).map((optionText, optIndex) => {
      const optionLabel = String.fromCharCode(65 + optIndex) // A, B, C, D...
      return {
        content: typeof optionText === 'string' ? optionText : (optionText.content || ''),
        is_correct: !hasModifiedAnswer && correctAnswer === optionLabel // 如果答案是 *，則不標記任何選項為正確
      }
    })

    return {
      content: q.content || q.question || `題目 ${index + 1}`,
      subject: examData?.subject || '未分類',
      category: examData?.category || '選擇題',
      explanation: q.explanation || '',
      options: options,
      points: q.points || 0,
      correct_answer: correctAnswer,
      has_modified_answer: hasModifiedAnswer
    }
  })

  // 將新題目加入暫存列表
  pendingQuestions.value = [...pendingQuestions.value, ...processedQuestions]

  console.log(`已加入 ${processedQuestions.length} 個暫存題目`)
  alert(`已匯入 ${processedQuestions.length} 題到暫存列表\n請儲存考卷以建立這些題目`)
}

const consumePendingPdfImport = () => {
  const payload = pdfImportStore.consumePayload()
  if (payload) {
    handlePdfImport(payload)
  }
}

// Preload questions from query params (when coming from "建立新考卷" with selected questions)
const preloadQuestionsFromQuery = async () => {
  console.log('preloadQuestionsFromQuery called')
  console.log('route.query:', route.query)
  console.log('examId.value:', examId.value)

  const preloadParam = route.query.preload_questions
  if (!preloadParam || examId.value) {
    // Only preload when creating new exam, not editing existing one
    console.log('Skipping preload - no param or editing existing exam')
    return
  }

  const questionIds = preloadParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  console.log('Parsed question IDs:', questionIds)
  if (questionIds.length === 0) return

  console.log('Preloading questions:', questionIds)

  try {
    // Fetch question details for each ID
    const fetchPromises = questionIds.map(id => questionService.getQuestion(id).catch(err => {
      console.error(`Failed to fetch question ${id}:`, err)
      return null
    }))
    const responses = await Promise.all(fetchPromises)
    console.log('Fetched responses:', responses)

    let addedCount = 0
    for (const res of responses) {
      if (!res || !res.data) {
        console.log('Skipping null response')
        continue
      }

      const q = res.data
      console.log('Adding question to pendingExamLinks:', q)
      // Add to pendingExamLinks (existing questions to be linked, not create new)
      pendingExamLinks.value.push({
        questionId: q.id,
        questionContent: q.content,
        questionSubject: q.subject || '未分類',
        questionCategory: q.category || '',
        points: 1
      })
      addedCount++
    }

    console.log('pendingExamLinks after preload:', pendingExamLinks.value)

    if (addedCount > 0) {
      console.log(`Preloaded ${addedCount} questions to pendingExamLinks`)
    }
  } catch (error) {
    console.error('Failed to preload questions:', error)
  }
}

onMounted(async () => {
  await loadExam()
  consumePendingPdfImport()
  await preloadQuestionsFromQuery()
})
</script>

<style scoped>
.exam-edit-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8fafc;
  min-height: 100vh;
}

.question-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid var(--border, #CBD5E1);
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn svg {
  flex-shrink: 0;
}

.toolbar-btn-primary {
  background: var(--primary, #476996);
  color: white;
}

.toolbar-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.3);
}

.toolbar-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toolbar-btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.toolbar-btn-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.toolbar-btn-danger:active {
  transform: translateY(0);
}

.content-container {
  height: auto;
}

.left-panel,
.right-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: 1fr;
    height: auto;
  }

  .left-panel,
  .right-panel {
    height: 600px;
    display: flex;
    flex-direction: column;
  }
}

.question-list-wrapper {
  flex: 1;
  min-height: 0;
  /* for proper scrolling in flex container */
  display: flex;
  flex-direction: column;
  padding: 8px;
  /* give space so shadows and rounded corners don't get clipped */
}

.question-list-wrapper>* {
  height: 100%;
  width: 100%;
}

.right-actions {
  padding: 12px 0 0 0;
  display: flex;
  gap: 8px;
}

/* Saving Progress Modal */
.saving-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1060;
  animation: savingFadeIn 0.2s ease-out;
}

@keyframes savingFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.saving-modal {
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: savingSlideUp 0.3s ease-out;
  overflow: hidden;
}

@keyframes savingSlideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.saving-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--border, #E2E8F0);
}

.saving-icon-wrapper {
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

.saving-icon-spin {
  animation: savingSpin 1s linear infinite;
}

@keyframes savingSpin {
  to {
    transform: rotate(360deg);
  }
}

.saving-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin: 0 0 4px 0;
}

.saving-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.saving-body {
  padding: 24px;
  text-align: center;
}

.saving-steps {
  margin-bottom: 16px;
  font-size: 14px;
}

.saving-current {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary, #476996);
}

.saving-divider {
  margin: 0 4px;
  color: var(--text-secondary, #64748B);
}

.saving-total {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-secondary, #64748B);
}

.saving-progress-container {
  height: 8px;
  background: var(--border, #E2E8F0);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.saving-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary, #476996), var(--primary-hover, #35527a));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.saving-percent {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

/* Auto Distribute Modal */
.auto-distribute-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1050;
  animation: adFadeIn 0.2s ease-out;
}

@keyframes adFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.auto-distribute-modal {
  width: 90%;
  max-width: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: adSlideUp 0.3s ease-out;
}

@keyframes adSlideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ad-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--border, #E2E8F0);
}

.ad-header-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.ad-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.ad-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin: 0 0 4px 0;
}

.ad-modal-subtitle {
  font-size: 14px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

.ad-close-btn {
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

.ad-close-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.ad-modal-body {
  padding: 24px;
}

.ad-input-section {
  margin-bottom: 24px;
}

.ad-input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin-bottom: 12px;
}

.ad-input-label svg {
  color: var(--primary, #476996);
}

.ad-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ad-input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid var(--border, #E2E8F0);
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s;
}

.ad-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.ad-input-unit {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary, #64748B);
}

.ad-result-section {
  margin-bottom: 16px;
}

.ad-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin-bottom: 16px;
}

.ad-result-header svg {
  color: var(--primary, #476996);
}

.ad-result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.ad-result-item {
  text-align: center;
}

.ad-result-label {
  font-size: 13px;
  color: var(--text-secondary, #64748B);
  margin-bottom: 4px;
}

.ad-result-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #1E293B);
}

.ad-result-unit {
  font-size: 14px;
  font-weight: 500;
}

.ad-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--primary-soft, #EEF2FF);
  border-radius: 10px;
  font-size: 14px;
  color: var(--primary, #476996);
}

.ad-message svg {
  flex-shrink: 0;
}

.ad-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border, #E2E8F0);
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.ad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ad-btn-secondary {
  background: white;
  color: var(--text-secondary, #64748B);
  border: 2px solid var(--border, #E2E8F0);
}

.ad-btn-secondary:hover {
  background: #f9fafb;
  color: var(--text-primary, #1E293B);
  border-color: #94a3b8;
}

.ad-btn-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.ad-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.ad-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ad-btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: adSpin 0.8s linear infinite;
}

@keyframes adSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
