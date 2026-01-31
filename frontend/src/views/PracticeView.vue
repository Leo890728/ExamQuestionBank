<template>
    <div class="split-view-container">
        <!-- Main Content Panel -->
        <div class="main-panel" :style="mainPanelStyle">
            <div class="container">
                <!-- Practice Modes -->
                <h2 class="section-title">選擇練習模式</h2>
                <div class="practice-modes">
                    <div class="mode-card historical-card" @click="startPractice('historical')">
                        <div class="mode-icon">題</div>
                        <div class="mode-title">歷屆考題</div>
                        <div class="mode-desc">按年度練習歷屆考題</div>
                    </div>
                    <div class="mode-card mock-exam-card" @click="openMockExamDialog">
                        <div class="mode-icon">模</div>
                        <div class="mode-title">模擬考題</div>
                        <div class="mode-desc">自訂題目組合模擬測驗</div>
                    </div>
                    <div class="mode-card wrong-card" @click="setTab('wrong')">
                        <div class="mode-icon">錯</div>
                        <div class="mode-title">錯題</div>
                        <div class="mode-desc">複習答錯的題目</div>
                    </div>
                    <div class="mode-card bookmark-card" @click="setTab('bookmarks')">
                        <div class="mode-icon">藏</div>
                        <div class="mode-title">收藏</div>
                        <div class="mode-desc">複習已收藏的題目</div>
                    </div>
                </div>

                <!-- Tabs (Moved above search) -->
                <div class="tabs">
                    <button :class="{ active: currentTab === 'questions' }" @click="setTab('questions')">題目列表</button>
                    <button :class="{ active: currentTab === 'exams' }" @click="setTab('exams')">考卷列表</button>
                    <button :class="{ active: currentTab === 'wrong' }" @click="setTab('wrong')">錯題本 ({{
                        wrongQuestions.length
                        }})</button>
                    <button :class="{ active: currentTab === 'bookmarks' }" @click="setTab('bookmarks')">收藏題目 ({{
                        bookmarks.length
                        }})</button>
                </div>

                <!-- Question List Tab Content -->
                <div v-if="currentTab === 'questions'">
                    <QuestionList ref="questionListRef" mode="practice" :show-header="false" :show-mode-toggle="false"
                        :show-source-filter="true" :tags="tagOptions" :search-results="searchResults"
                        :search-loading="isSearching" :total-search-count="searchTotalCount"
                        :external-filters="searchFilters" @search-questions="handleQuestionListSearch"
                        @load-tags="loadTags" @update:selected-ids="handleSelectedIdsChange"
                        @item-action="handleQuestionItemAction">
                        <!-- Custom toolbar buttons for practice mode -->
                        <template #toolbar-buttons="{ selectedIds, clearSelection }">
                            <button class="toolbar-btn toolbar-btn-accent" @click="batchPractice"
                                :disabled="selectedQuestionIds.length === 0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                練習選取 ({{ selectedQuestionIds.length }})
                            </button>

                            <button class="toolbar-btn toolbar-btn-primary" @click="batchAddToFlashcard">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z">
                                    </path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                儲存為快閃卡
                            </button>

                            <button class="toolbar-btn toolbar-btn-secondary" @click="batchAddToBookmark">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                                加入收藏
                            </button>

                            <button class="toolbar-btn toolbar-btn-secondary" @click="openAddToExamModal">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="12" y1="18" x2="12" y2="12"></line>
                                    <line x1="9" y1="15" x2="15" y2="15"></line>
                                </svg>
                                加入考卷
                            </button>

                            <button v-if="searchFilters.source === 'wrong'" class="toolbar-btn toolbar-btn-secondary"
                                @click="batchMarkReviewed">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                已複習
                            </button>
                        </template>

                        <!-- Custom item actions for practice mode -->
                        <template #item-actions="{ item }">
                            <button class="btn btn-sm" @click="startSingleQuizFromSearch(item)">練習</button>
                            <button class="btn btn-sm btn-outline" @click="openChatFromSearchQuestion(item)">Ask
                                AI</button>
                        </template>
                    </QuestionList>
                </div>

                <!-- Quiz Mode -->
                <div v-if="quizMode" class="quiz-panel">
                    <div class="quiz-header">
                        <span>第 {{ currentIndex + 1 }} / {{ quizQuestions.length }} 題</span>
                        <div class="quiz-tools">
                            <!-- Flag button to mark for later review -->
                            <button 
                                class="btn btn-icon" 
                                :class="{ 'flagged': isFlagged(currentQuestion?.id) }"
                                @click="toggleFlag(currentQuestion?.id)"
                                :title="isFlagged(currentQuestion?.id) ? '取消標記' : '標記待複習'"
                            >
                                <i :class="isFlagged(currentQuestion?.id) ? 'bi bi-flag-fill' : 'bi bi-flag'"></i>
                            </button>
                            <button v-if="showAnswer" class="btn btn-ghost"
                                @click="openChat(composeQuestionPrompt(currentQuestion, currentOptions))">Ask
                                AI</button>
                            <button class="btn btn-secondary" @click="exitQuiz">結束練習</button>
                        </div>
                    </div>
                    <div class="quiz-question">
                        <p class="question-content">{{ currentQuestion?.content || currentQuestion?.question_content }}
                        </p>
                        <div class="quiz-options">
                            <div v-for="[index, opt] in currentOptions.entries()" :key="opt.id" class="option-item"
                                :class="{
                                    selected: selectedAnswer === opt.id,
                                    correct: showAnswer && opt.is_correct,
                                    wrong: showAnswer && selectedAnswer === opt.id && !opt.is_correct
                                }" @click="!showAnswer && selectAnswer(opt.id)">
                                <span class="option-label">{{ getLabel(index + 1) }}.</span>
                                <span>{{ opt.content }}</span>
                            </div>
                        </div>
                        <div v-if="showAnswer" class="answer-feedback">
                            <p v-if="isCorrect" class="correct-msg">✓ 正確！</p>
                            <p v-else class="wrong-msg">✗ 錯誤，正確答案是：{{ correctAnswerLabel }}</p>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button v-if="!showAnswer" class="btn btn-primary" :disabled="!selectedAnswer"
                            @click="checkAnswer">確認答案</button>
                        <button v-else class="btn btn-primary" @click="nextQuestion">{{ currentIndex <
                            quizQuestions.length - 1 ? '下一題' : '完成' }}</button>
                                <button class="btn" @click="addCurrentToFlashcard">加入快閃卡</button>
                    </div>
                </div>

                <!-- Exams Tab -->
                <section v-if="currentTab === 'exams' && !quizMode" class="content-section">
                    <div v-if="loadingExams" class="loading">載入中...</div>
                    <div v-else-if="!practiceExams.length" class="empty">目前尚無考卷</div>
                    <div v-else>
                        <!-- 管理員建立的考卷 -->
                        <div v-if="adminExams.length" class="exam-section">
                            <div class="section-header">
                                <h3>歷屆考卷</h3>
                            </div>
                            <div class="exam-list">
                                <div v-for="exam in adminExams" :key="exam.id" class="exam-item">
                                    <div class="exam-info">
                                        <span class="exam-name">{{ exam.name }}</span>
                                        <span class="exam-meta">{{ exam.question_count }} 題</span>
                                    </div>
                                    <button class="btn btn-primary" @click="viewExam(exam.id)">開始測驗</button>
                                </div>
                            </div>
                        </div>

                        <!-- 我的考卷 -->
                        <div v-if="myExams.length" class="exam-section">
                            <div class="section-header">
                                <h3>我的考卷</h3>
                            </div>
                            <div class="exam-list">
                                <div v-for="exam in myExams" :key="exam.id" class="exam-item">
                                    <div class="exam-info">
                                        <span class="exam-name">{{ exam.name }}</span>
                                        <span class="exam-meta">{{ exam.question_count }} 題</span>
                                    </div>
                                    <button class="btn btn-primary" @click="viewExam(exam.id)">開始測驗</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Wrong Questions Tab -->
                <section v-if="currentTab === 'wrong' && !quizMode" class="content-section">
                    <div class="section-header">
                        <h3>錯題本</h3>
                        <div class="section-actions">
                            <button v-if="wrongQuestions.length" class="btn btn-primary"
                                @click="startQuiz(wrongQuestions, 'wrong')">全部重測</button>
                        </div>
                    </div>
                    <QuestionList 
                        mode="practice" 
                        list-mode="wrong"
                        :show-header="false" 
                        :show-mode-toggle="false"
                        :show-source-filter="false"
                        :loading="loadingWrong"
                        :search-results="wrongQuestionsForList"
                        :total-search-count="wrongQuestions.length"
                        @update:selected-ids="handleWrongSelectedIds"
                        @item-action="handleWrongItemAction">
                        <!-- Extra badges slot for wrong count -->
                        <template #item-extra-badges="{ item }">
                            <span v-if="item.wrong_count" class="search-badge search-badge-wrong">
                                錯 {{ item.wrong_count }} 次
                            </span>
                        </template>
                        <!-- Custom toolbar buttons -->
                        <template #toolbar-buttons="{ selectedIds, clearSelection }">
                            <button class="toolbar-btn toolbar-btn-accent" 
                                @click="batchWrongQuiz(selectedIds); clearSelection()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                重測 ({{ selectedIds.length }})
                            </button>
                            <button class="toolbar-btn toolbar-btn-secondary" 
                                @click="batchMarkReviewedFromWrong(selectedIds); clearSelection()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                已複習
                            </button>
                        </template>
                        <!-- Custom item actions -->
                        <template #item-actions="{ item }">
                            <button class="btn btn-sm" @click="startSingleQuiz(item)">重測</button>
                            <button class="btn btn-sm" 
                                :class="{ 'btn-flashcard-added': item.is_in_flashcard }"
                                @click="toggleFlashcard(item)">
                                <i :class="item.is_in_flashcard ? 'bi bi-bookmark-x-fill' : 'bi bi-bookmark-plus'"></i>
                                {{ item.is_in_flashcard ? '移除快閃卡' : '加入快閃卡' }}
                            </button>
                            <button class="btn btn-sm btn-secondary" @click="markReviewed(item.id)">已複習</button>
                            <button class="btn btn-sm btn-outline" @click="openChatFromQuestion(item)">Ask AI</button>
                        </template>
                    </QuestionList>
                </section>

                <!-- Bookmarks Tab -->
                <section v-if="currentTab === 'bookmarks' && !quizMode" class="content-section">
                    <div class="section-header">
                        <h3>收藏題目</h3>
                        <div class="section-actions">
                            <button v-if="bookmarks.length" class="btn btn-primary"
                                @click="startQuiz(bookmarks, 'bookmark')">全部練習</button>
                        </div>
                    </div>
                    <QuestionList 
                        mode="practice" 
                        list-mode="bookmark"
                        :show-header="false" 
                        :show-mode-toggle="false"
                        :show-source-filter="false"
                        :loading="loadingBookmarks"
                        :search-results="bookmarksForList"
                        :total-search-count="bookmarks.length"
                        @update:selected-ids="handleBookmarkSelectedIds"
                        @item-action="handleBookmarkItemAction">
                        <!-- Custom toolbar buttons -->
                        <template #toolbar-buttons="{ selectedIds, clearSelection }">
                            <button class="toolbar-btn toolbar-btn-accent" 
                                @click="batchBookmarkQuiz(selectedIds); clearSelection()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                練習 ({{ selectedIds.length }})
                            </button>
                            <button class="toolbar-btn toolbar-btn-danger" 
                                @click="batchRemoveBookmarks(selectedIds); clearSelection()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                移除
                            </button>
                        </template>
                        <!-- Custom item actions -->
                        <template #item-actions="{ item }">
                            <button class="btn btn-sm" @click="startSingleQuiz(item)">練習</button>
                            <button class="btn btn-sm" 
                                :class="{ 'btn-flashcard-added': item.is_in_flashcard }"
                                @click="toggleFlashcard(item)">
                                <i :class="item.is_in_flashcard ? 'bi bi-bookmark-x-fill' : 'bi bi-bookmark-plus'"></i>
                                {{ item.is_in_flashcard ? '移除快閃卡' : '加入快閃卡' }}
                            </button>
                            <button class="btn btn-sm btn-danger" @click="removeBookmark(item.question)">移除</button>
                            <button class="btn btn-sm btn-outline" @click="openChatFromQuestion(item)">Ask AI</button>
                        </template>
                    </QuestionList>
                </section>
            </div>
        </div>

        <!-- Draggable Divider -->
        <div v-if="isChatOpen" class="split-divider" @mousedown="startDrag" @touchstart="startDrag">
            <div class="divider-handle"></div>
        </div>

        <!-- AI Chat Panel (Split View / Mobile Overlay) -->
        <div v-if="isChatOpen" class="chat-panel-split" :class="{ 'mobile-open': isChatOpen }" :style="chatPanelStyle">
            <div class="chat-panel-header">
                <div class="chat-panel-title">
                    <span class="chat-icon">AI</span>
                    <span>Ask AI</span>
                </div>
                <button class="btn-close" @click="closeChat" aria-label="關閉">×</button>
            </div>
            <AIChatInterface :prefill="chatPrefill" class="chat-panel-content" />
        </div>

        <!-- Mobile Overlay Background -->
        <div v-if="isChatOpen" class="mobile-overlay" @click="closeChat"></div>

        <!-- Floating Ask AI Button (Draggable) - Hidden when CiteRight extension is present -->
        <button
            v-if="!isChatOpen && !isExtensionPresent"
            class="floating-ai-btn"
            :style="floatingBtnStyle"
            @mousedown="startFloatingDrag"
            @touchstart="startFloatingDrag"
            aria-label="Ask AI"
        >
            <svg class="floating-ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Magnifying glass -->
                <circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2"/>
                <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <!-- Sparkles -->
                <path d="M18 4L18.5 5.5L20 6L18.5 6.5L18 8L17.5 6.5L16 6L17.5 5.5L18 4Z" fill="currentColor"/>
                <path d="M4 2L4.35 3L5 3.35L4.35 3.7L4 4.7L3.65 3.7L3 3.35L3.65 3L4 2Z" fill="currentColor"/>
                <path d="M5 14L5.25 14.75L6 15L5.25 15.25L5 16L4.75 15.25L4 15L4.75 14.75L5 14Z" fill="currentColor"/>
            </svg>
        </button>

        <!-- Mock Exam Dialog -->
        <div v-if="showMockExamDialog" class="mock-exam-overlay" @click.self="closeMockExamDialog">
            <div class="mock-exam-dialog">
                <div class="dialog-header">
                    <h3>建立模擬考題</h3>
                    <button class="btn-close" @click="closeMockExamDialog" aria-label="關閉">×</button>
                </div>
                <div class="dialog-body">
                    <p class="dialog-desc">選擇題目來源並設定題數，系統將隨機抽取題目組成模擬測驗。</p>

                    <div class="source-options">
                        <h4>選擇題目來源</h4>
                        <label class="source-checkbox">
                            <input type="checkbox" v-model="mockExamSources.wrong"
                                :disabled="wrongQuestions.length === 0">
                            <span>錯題 ({{ wrongQuestions.length }} 題)</span>
                        </label>
                        <label class="source-checkbox">
                            <input type="checkbox" v-model="mockExamSources.bookmarks"
                                :disabled="bookmarks.length === 0">
                            <span>收藏 ({{ bookmarks.length }} 題)</span>
                        </label>
                        <label class="source-checkbox">
                            <input type="checkbox" v-model="mockExamSources.all">
                            <span>全部題庫</span>
                        </label>
                    </div>

                    <div class="question-count-setting">
                        <h4>設定題數</h4>
                        <div class="count-options">
                            <button v-for="count in [10, 20, 30, 50]" :key="count" class="count-btn"
                                :class="{ active: mockExamQuestionCount === count }"
                                @click="mockExamQuestionCount = count">
                                {{ count }} 題
                            </button>
                        </div>
                        <div class="custom-count">
                            <span>或自訂：</span>
                            <input type="number" v-model.number="mockExamQuestionCount" min="1" max="100"
                                class="count-input">
                            <span>題</span>
                        </div>
                    </div>

                    <div v-if="availableMockExamCount > 0" class="available-count">
                        可用題數：{{ availableMockExamCount }} 題
                    </div>
                    <div v-else class="no-questions-warning">
                        請至少選擇一個題目來源
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" @click="closeMockExamDialog">取消</button>
                    <button class="btn btn-primary" @click="startMockExam"
                        :disabled="availableMockExamCount === 0 || mockExamQuestionCount < 1">
                        開始模擬考 ({{ Math.min(mockExamQuestionCount, availableMockExamCount) }} 題)
                    </button>
                </div>
            </div>
        </div>

        <!-- Add to Exam Dialog -->
        <div v-if="showAddToExamModal" class="mock-exam-overlay" @click.self="closeAddToExamModal">
            <div class="mock-exam-dialog">
                <div class="dialog-header">
                    <h3>加入考卷</h3>
                    <button class="btn-close" @click="closeAddToExamModal" aria-label="關閉">×</button>
                </div>
                <div class="dialog-body">
                    <p class="dialog-desc">選擇要加入的考卷（可多選），已選取 {{ selectedQuestionIds.length }} 題</p>

                    <div v-if="loadingUserExams" class="loading-exams">
                        <div class="spinner"></div>
                        載入考卷中...
                    </div>

                    <div v-else-if="userExamsForAdd.length === 0" class="no-exams-warning">
                        <p>您目前沒有可加入題目的考卷</p>
                    </div>

                    <div v-else class="exam-select-list">
                        <label v-for="exam in userExamsForAdd" :key="exam.id" class="exam-select-item"
                            :class="{ selected: selectedExamIds.includes(exam.id) }">
                            <input type="checkbox" :value="exam.id" v-model="selectedExamIds">
                            <div class="exam-select-info">
                                <span class="exam-select-name">{{ exam.name }}</span>
                                <span class="exam-select-meta">{{ exam.question_count || 0 }} 題</span>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" @click="closeAddToExamModal">取消</button>
                    <div class="dialog-footer-right">
                        <button class="btn btn-outline" @click="goToCreateExamWithQuestions">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            建立新考卷
                        </button>
                        <button class="btn btn-primary" @click="batchAddToExams"
                            :disabled="selectedExamIds.length === 0 || isAddingToExam">
                            <span v-if="isAddingToExam">加入中...</span>
                            <span v-else>加入 {{ selectedExamIds.length }} 張考卷</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import examService from '@/services/examService'
import questionService from '@/services/questionService'
import flashcardService from '@/services/flashcardService'
import tagService from '@/services/tagService'
import AIChatInterface from '@/components/AIChatInterface.vue'
import QuestionList from '@/components/QuestionList.vue'
import QuestionFilterPanel from '@/components/common/QuestionFilterPanel.vue'
import PaginationControl from '@/components/common/PaginationControl.vue'
import SelectionToolbar from '@/components/common/SelectionToolbar.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const router = useRouter()
const route = useRoute()
// route-based tab, default to exams
const currentTab = computed(() => {
    const t = route.query.tab
    if (Array.isArray(t)) return t[0] || 'questions'
    return t || 'questions'
})

// Focus question ID from route query (used to highlight a specific question)
const focusQuestionId = computed(() => {
    const f = route.query.focus
    if (Array.isArray(f)) return parseInt(f[0]) || null
    return parseInt(f) || null
})

const setTab = (tab) => {
    router.push({ path: '/practice', query: { ...route.query, tab } })
}
const stats = reactive({ total_bank: 0, total_answered: 0, accuracy: 0, exam_count: 0, wrong_count: 0 })

// Data
const practiceExams = ref([])
const wrongQuestions = ref([])
const bookmarks = ref([])
const loadingExams = ref(false)
const loadingWrong = ref(false)
const loadingBookmarks = ref(false)

// QuestionList component ref
const questionListRef = ref(null)

// Focus question element ref (for scrolling into view)
const focusedQuestionEl = ref(null)

// Search state
const searchFilters = ref({
    subject: '',
    difficulty: '',
    search: '',
    tags: [],
    tag_mode: 'or',
    source: 'all'
})
const selectedQuestionIds = ref([])
const tagOptions = ref([])
const searchResults = ref([])
const showSearchResults = ref(false)
const isSearching = ref(false)
const searchPage = ref(1)
const searchPageSize = ref(20)
const searchTotalCount = ref(0)
const searchHasNext = ref(false)
const searchHasPrev = ref(false)

// Quiz state
const quizMode = ref(false)
const quizQuestions = ref([])
const currentIndex = ref(0)
const currentOptions = ref([])
const selectedAnswer = ref(null)
const showAnswer = ref(false)
const isCorrect = ref(false)
const flaggedQuestions = ref([]) // Client-side only: track flagged question IDs for "come back later"

// Flag helper functions
const isFlagged = (questionId) => {
    return flaggedQuestions.value.includes(questionId)
}

const toggleFlag = (questionId) => {
    if (!questionId) return
    const idx = flaggedQuestions.value.indexOf(questionId)
    if (idx === -1) {
        flaggedQuestions.value.push(questionId)
    } else {
        flaggedQuestions.value.splice(idx, 1)
    }
}

// Mock Exam state
const showMockExamDialog = ref(false)
const mockExamSources = reactive({
    wrong: false,
    bookmarks: false,
    all: false
})
const mockExamQuestionCount = ref(20)
const allQuestionsPool = ref([])  // For "all questions" source

// Add to Exam modal state
const showAddToExamModal = ref(false)
const userExamsForAdd = ref([])
const loadingUserExams = ref(false)
const selectedExamIds = ref([])
const isAddingToExam = ref(false)

const currentQuestion = computed(() => quizQuestions.value[currentIndex.value])
const correctAnswerLabel = computed(() => {
    const correct = currentOptions.value.find(o => o.is_correct)
    return correct ? `${getLabel(correct.order)}. ${correct.content}` : ''
})

// Computed: separate admin exams and user's own exams
const adminExams = computed(() => {
    return practiceExams.value.filter(exam => exam.created_by_admin)
})

const myExams = computed(() => {
    return practiceExams.value.filter(exam => !exam.created_by_admin)
})

// Computed: how many questions available for mock exam based on selected sources
const availableMockExamCount = computed(() => {
    let count = 0
    const questionIds = new Set()

    if (mockExamSources.wrong) {
        wrongQuestions.value.forEach(wq => questionIds.add(wq.question || wq.id))
    }
    if (mockExamSources.bookmarks) {
        bookmarks.value.forEach(bm => questionIds.add(bm.question || bm.id))
    }
    if (mockExamSources.all) {
        // When "all" is selected, we fetch from the entire question bank
        // For now we'll show stats.total_bank as a rough estimate
        return stats.total_bank || 100
    }

    return questionIds.size
})

// Computed: transform wrongQuestions for QuestionList component
const wrongQuestionsForList = computed(() => {
    return wrongQuestions.value.map(wq => ({
        ...wq,
        id: wq.id,
        content: wq.question_content,
        question_content: wq.question_content,
        question_subject: wq.question_subject,
        subject: wq.question_subject
    }))
})

// Computed: transform bookmarks for QuestionList component
const bookmarksForList = computed(() => {
    return bookmarks.value.map(bm => ({
        ...bm,
        id: bm.id,
        content: bm.question_content,
        question_content: bm.question_content,
        question_subject: bm.question_subject,
        subject: bm.question_subject
    }))
})

// Handler for wrong questions list selected IDs
const handleWrongSelectedIds = (ids) => {
    // Store selected wrong question IDs if needed
    console.log('Selected wrong question IDs:', ids)
}

// Handler for bookmark list selected IDs
const handleBookmarkSelectedIds = (ids) => {
    // Store selected bookmark IDs if needed
    console.log('Selected bookmark IDs:', ids)
}

// Handler for wrong questions item actions
const handleWrongItemAction = (action, item) => {
    if (action === 'practice') {
        startSingleQuiz(item)
    } else if (action === 'ask-ai') {
        openChatFromQuestion(item)
    } else if (action === 'flashcard') {
        toggleFlashcard(item)
    }
}

// Handler for bookmark item actions
const handleBookmarkItemAction = (action, item) => {
    if (action === 'practice') {
        startSingleQuiz(item)
    } else if (action === 'ask-ai') {
        openChatFromQuestion(item)
    } else if (action === 'flashcard') {
        toggleFlashcard(item)
    }
}

// Batch quiz for wrong questions
const batchWrongQuiz = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return
    const selected = wrongQuestions.value.filter(wq => selectedIds.includes(wq.id))
    if (selected.length > 0) {
        startQuiz(selected, 'wrong')
    }
}

// Batch mark reviewed from wrong questions
const batchMarkReviewedFromWrong = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return
    try {
        const promises = selectedIds.map(id => examService.markWrongQuestionReviewed(id))
        await Promise.all(promises)
        wrongQuestions.value = wrongQuestions.value.filter(wq => !selectedIds.includes(wq.id))
        alert(`成功標記 ${selectedIds.length} 題已複習！`)
    } catch (e) {
        console.error('Batch mark reviewed failed:', e)
        alert('標記失敗')
    }
}

// Batch quiz for bookmarks
const batchBookmarkQuiz = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return
    const selected = bookmarks.value.filter(bm => selectedIds.includes(bm.id))
    if (selected.length > 0) {
        startQuiz(selected, 'bookmark')
    }
}

// Batch remove bookmarks
const batchRemoveBookmarks = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return
    if (!confirm(`確定要移除 ${selectedIds.length} 個收藏嗎？`)) return
    try {
        // Get question IDs from bookmark IDs
        const questionIds = bookmarks.value
            .filter(bm => selectedIds.includes(bm.id))
            .map(bm => bm.question)
        
        const promises = questionIds.map(qid => examService.removeBookmark(qid))
        await Promise.all(promises)
        bookmarks.value = bookmarks.value.filter(bm => !selectedIds.includes(bm.id))
        alert(`成功移除 ${questionIds.length} 個收藏！`)
    } catch (e) {
        console.error('Batch remove bookmarks failed:', e)
        alert('移除失敗')
    }
}

const getLabel = (order) => String.fromCharCode(64 + (order || 1))

const loadData = async () => {
    loadingExams.value = true
    loadingWrong.value = true
    loadingBookmarks.value = true

    try {
        const [statsRes, examsRes, wrongRes, bookmarkRes] = await Promise.all([
            examService.getExamStats().catch(() => ({ data: {} })),
            examService.getPracticeExams({ page_size: 100 }).catch(() => ({ data: [] })),
            examService.getWrongQuestions().catch(() => ({ data: [] })),
            examService.getBookmarks().catch(() => ({ data: [] }))
        ])
        Object.assign(stats, statsRes.data || {})
        practiceExams.value = Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.results || []
        wrongQuestions.value = wrongRes.data || []
        bookmarks.value = bookmarkRes.data || []
    } catch (e) {
        console.error(e)
    } finally {
        loadingExams.value = false
        loadingWrong.value = false
        loadingBookmarks.value = false
    }
}

// Load tags for search filter
const loadTags = async () => {
    try {
        const res = await tagService.getTags()
        let items = res.data?.results || res.data
        if (!Array.isArray(items)) items = []
        tagOptions.value = items.filter(t => t != null)
    } catch (err) {
        console.error('載入標籤失敗:', err)
    }
}

// Search functions
const searchQuestions = async (page = 1) => {
    isSearching.value = true
    showSearchResults.value = true
    searchPage.value = page

    try {
        const params = {
            page: page,
            page_size: searchPageSize.value
        }

        // Add all filters
        if (searchFilters.value.search) params.keyword = searchFilters.value.search
        if (searchFilters.value.subject) params.subject = searchFilters.value.subject
        if (searchFilters.value.difficulty) params.difficulty = searchFilters.value.difficulty
        if (searchFilters.value.source && searchFilters.value.source !== 'all') {
            params.source = searchFilters.value.source
        }
        if (searchFilters.value.tags && searchFilters.value.tags.length > 0) {
            params.tags = searchFilters.value.tags.map(t => t.id).join(',')
            params.tag_mode = searchFilters.value.tag_mode
        }

        console.log('Search params:', params)
        const res = await questionService.getQuestions(params)

        if (res.data?.results) {
            searchResults.value = res.data.results
            searchTotalCount.value = res.data.count || 0
            searchHasNext.value = !!res.data.next
            searchHasPrev.value = !!res.data.previous
        } else {
            searchResults.value = Array.isArray(res.data) ? res.data : []
            searchTotalCount.value = searchResults.value.length
            searchHasNext.value = false
            searchHasPrev.value = false
        }

        // Reset selection on new search
        if (page === 1) selectedQuestionIds.value = []

    } catch (e) {
        console.error('搜尋題目失敗:', e)
        searchResults.value = []
        searchTotalCount.value = 0
    } finally {
        isSearching.value = false
    }
}

const goToSearchPage = (page) => {
    if (page >= 1) {
        searchQuestions(page)
    }
}

const handlePageSizeChange = (size) => {
    searchPageSize.value = size
    searchQuestions(1)
}

const searchPaginationState = computed(() => {
    const totalPages = Math.ceil(searchTotalCount.value / searchPageSize.value) || 1
    return {
        totalPages,
        totalCount: searchTotalCount.value,
        hasNext: searchPage.value < totalPages,
        hasPrev: searchPage.value > 1
    }
})

const resetSearch = () => {
    searchFilters.value = {
        subject: '',
        difficulty: '',
        search: '',
        tags: [],
        tag_mode: 'or',
        source: 'all'
    }
    selectedQuestionIds.value = []
    searchResults.value = []
    showSearchResults.value = false
    searchPage.value = 1
    searchTotalCount.value = 0
}

// Handler functions for QuestionList component
const handleQuestionListSearch = (filters, page, pageSize) => {
    // Update local filter state from component
    searchFilters.value = { ...searchFilters.value, ...filters }
    searchPageSize.value = pageSize
    searchQuestions(page)
}

const handleSelectedIdsChange = (ids) => {
    selectedQuestionIds.value = ids
}

const handleQuestionItemAction = (action, item) => {
    if (action === 'practice') {
        startSingleQuizFromSearch(item)
    } else if (action === 'ask-ai') {
        openChatFromSearchQuestion(item)
    } else if (action === 'flashcard') {
        addToFlashcard(item.id)
        // Refresh search results to update flashcard status
        searchQuestions(searchPage.value)
    }
}

const toggleCheck = (id) => {
    const idx = selectedQuestionIds.value.indexOf(id)
    if (idx === -1) {
        selectedQuestionIds.value.push(id)
    } else {
        selectedQuestionIds.value.splice(idx, 1)
    }
}

const isAllSelected = computed(() => {
    if (searchResults.value.length === 0) return false
    return searchResults.value.every(q => selectedQuestionIds.value.includes(q.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        // Deselect all visible
        const visibleIds = searchResults.value.map(q => q.id)
        selectedQuestionIds.value = selectedQuestionIds.value.filter(id => !visibleIds.includes(id))
    } else {
        // Select all visible
        const visibleIds = searchResults.value.map(q => q.id)
        const newIds = new Set([...selectedQuestionIds.value, ...visibleIds])
        selectedQuestionIds.value = Array.from(newIds)
    }
}

const clearSelection = () => {
    selectedQuestionIds.value = []
}

// Batch practice selected questions
const batchPractice = () => {
    if (selectedQuestionIds.value.length === 0) {
        alert('請先選擇題目')
        return
    }

    // Navigate to the question practice page with all selected question IDs
    router.push({
        name: 'QuestionPractice',
        query: { ids: selectedQuestionIds.value.join(',') }
    })
}

const batchAddToFlashcard = async () => {
    if (selectedQuestionIds.value.length === 0) return

    try {
        // Filter out questions that are already in flashcard
        const questionsToAdd = selectedQuestionIds.value.filter(id => {
            const question = searchResults.value.find(q => q.id === id)
            return !question?.is_in_flashcard
        })

        if (questionsToAdd.length === 0) {
            alert('選取的題目已全部在快閃卡中！')
            return
        }

        const promises = questionsToAdd.map(id => flashcardService.createFlashcard({ question: id }))
        await Promise.all(promises)

        const skipped = selectedQuestionIds.value.length - questionsToAdd.length
        let message = `成功加入 ${questionsToAdd.length} 題到快閃卡！`
        if (skipped > 0) {
            message += `（${skipped} 題已在快閃卡中，已略過）`
        }
        alert(message)
        clearSelection()

        // Refresh search results to update flashcard status
        if (searchResults.value.length > 0) {
            searchQuestions(searchPage.value)
        }
    } catch (e) {
        console.error('Batch add to flashcard failed:', e)
        alert('加入快閃卡失敗')
    }
}

const batchAddToBookmark = async () => {
    if (selectedQuestionIds.value.length === 0) return

    try {
        // Filter out questions that are already bookmarked
        const questionsToAdd = selectedQuestionIds.value.filter(id => {
            const question = searchResults.value.find(q => q.id === id)
            return !question?.is_bookmarked
        })

        if (questionsToAdd.length === 0) {
            alert('選取的題目已全部在收藏中！')
            return
        }

        await examService.addBookmark(questionsToAdd)

        // Refresh bookmarks list
        const bookmarkRes = await examService.getBookmarks().catch(() => ({ data: [] }))
        bookmarks.value = bookmarkRes.data || []

        const skipped = selectedQuestionIds.value.length - questionsToAdd.length
        let message = `成功加入 ${questionsToAdd.length} 題到收藏！`
        if (skipped > 0) {
            message += `（${skipped} 題已在收藏中，已略過）`
        }
        alert(message)
        clearSelection()

        // Refresh search results to update bookmark status
        if (searchResults.value.length > 0) {
            searchQuestions(searchPage.value)
        }
    } catch (e) {
        console.error('Batch add to bookmark failed:', e)
        alert('加入收藏失敗')
    }
}

const batchMarkReviewed = async () => {
    if (selectedQuestionIds.value.length === 0) return

    try {
        // Assuming we have wrong question IDs relative to questions
        // This part is tricky because we might have question IDs but need wrong_question IDs
        // If the source is 'wrong', likely the API returns wrong question objects or we need to find them
        // Assuming the search returns Question objects, we need to find corresponding WrongQuestion ID if possible
        // OR calling an API that accepts question ID for "mark reviewed" on current user

        // Since existing markReviewed takes wrongQuestionId, and search returns Questions...
        // We might need an endpoint to mark reviewed by question ID for current user
        // For now, let's try to pass question IDs and hope the backend logic handles it or we iterate

        // Let's iterate available wrongQuestions in memory to find matches?
        // Not reliable if paginated.

        // Better strategy: Call an endpoint "mark_reviewed_by_question_id"? 
        // Or assume the search result in "source=wrong" mode returns an ID we can use? 
        // Usually standard search returns Question. 
        // Let's just try loop calling existing service method properly if we have the ID.
        // However, existing markReviewed(wq.id) uses the ID of the WrongQuestion entry, NOT the Question ID.

        // If we are searching questions with source=wrong, backend ensures we get questions that are wrong.
        // But we need the WrongQuestion ID to mark it reviewed? 
        // Alternative: bulk-update wrong questions status by question_id list.

        // For this implementation, I will assume we can't easily get the WrongQuestion ID from a generic Question search result without extra data.
        // If the API allows passing question_id to "mark reviewed", that's best.
        // If not, I'll log a warning or try to match with `wrongQuestions.value` which is loaded in memory (if it contains all of them).

        // Let's try matching with loaded `wrongQuestions` for now.
        const promises = []
        const wrongQsInMem = wrongQuestions.value

        for (const qId of selectedQuestionIds.value) {
            const wq = wrongQsInMem.find(w => w.question === qId || w.id === qId) // handle both cases just in case
            if (wq) {
                promises.push(examService.markWrongQuestionReviewed(wq.id))
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises)

            // Refresh wrong questions list
            const wrongRes = await examService.getWrongQuestions().catch(() => ({ data: [] }))
            wrongQuestions.value = wrongRes.data || []

            // Also refresh search results to remove Reviewed ones if in wrong mode
            searchQuestions(searchPage.value)

            alert(`成功標記 ${promises.length} 題已複習！`)
            clearSelection()
        } else {
            alert('無法找到對應的錯題紀錄')
        }
    } catch (e) {
        console.error('Batch mark reviewed failed:', e)
        alert('標記失敗')
    }
}

// Add to Exam modal functions
const openAddToExamModal = async () => {
    if (selectedQuestionIds.value.length === 0) {
        alert('請先選擇題目')
        return
    }

    showAddToExamModal.value = true
    loadingUserExams.value = true
    selectedExamIds.value = []

    try {
        // Load user's exams
        const res = await examService.getExams({ page_size: 100 })
        const exams = res.data?.results || res.data || []
        console.log('Loaded exams for add modal:', exams)
        // Show all exams the user has access to
        userExamsForAdd.value = exams
    } catch (e) {
        console.error('Failed to load exams:', e)
        userExamsForAdd.value = []
    } finally {
        loadingUserExams.value = false
    }
}

const closeAddToExamModal = () => {
    showAddToExamModal.value = false
    selectedExamIds.value = []
}

const goToCreateExam = () => {
    closeAddToExamModal()
    router.push('/exams/create')
}

const goToCreateExamWithQuestions = () => {
    // Get question details to pass to create exam page
    const questionIds = selectedQuestionIds.value
    closeAddToExamModal()

    // Navigate to create exam page with question IDs in query params
    router.push({
        path: '/exams/create',
        query: { preload_questions: questionIds.join(',') }
    })
}

const batchAddToExams = async () => {
    if (selectedExamIds.value.length === 0 || selectedQuestionIds.value.length === 0) return

    isAddingToExam.value = true

    try {
        // First, fetch details of each selected exam to get existing question IDs
        const examDetailsPromises = selectedExamIds.value.map(id => examService.getExam(id))
        const examDetailsResponses = await Promise.all(examDetailsPromises)

        // Build a map of examId -> Set of existing question IDs
        const existingQuestionsMap = {}
        for (const res of examDetailsResponses) {
            const exam = res.data
            const existingIds = new Set()
            if (exam.exam_questions) {
                exam.exam_questions.forEach(eq => {
                    existingIds.add(eq.question)
                })
            }
            existingQuestionsMap[exam.id] = existingIds
        }

        let totalAdded = 0
        let totalSkipped = 0
        let errors = []

        for (const examId of selectedExamIds.value) {
            const existingQuestions = existingQuestionsMap[examId] || new Set()

            for (const questionId of selectedQuestionIds.value) {
                // Skip if question already exists in this exam
                if (existingQuestions.has(questionId)) {
                    totalSkipped++
                    continue
                }

                try {
                    await examService.addQuestionToExam(examId, { question: questionId })
                    totalAdded++
                } catch (e) {
                    // May fail for other reasons
                    errors.push(`題目 ${questionId} 加入考卷失敗`)
                }
            }
        }

        const examCount = selectedExamIds.value.length
        const questionCount = selectedQuestionIds.value.length

        if (totalAdded > 0 && totalSkipped === 0) {
            alert(`成功將 ${totalAdded} 題加入 ${examCount} 張考卷！`)
        } else if (totalAdded > 0 && totalSkipped > 0) {
            alert(`成功加入 ${totalAdded} 筆（${totalSkipped} 筆已存在於考卷中，已略過）`)
        } else if (totalSkipped > 0) {
            alert('選取的題目已全部存在於選擇的考卷中！')
        } else {
            alert('加入考卷失敗')
        }

        closeAddToExamModal()
        clearSelection()

        // Refresh exam list
        loadData()
    } catch (e) {
        console.error('Batch add to exams failed:', e)
        alert('加入考卷失敗')
    } finally {
        isAddingToExam.value = false
    }
}

const closeSearchResults = () => {
    showSearchResults.value = false
}

const getDifficultyLabel = (difficulty) => {
    const labels = { easy: '簡單', medium: '中等', hard: '困難' }
    return labels[difficulty] || difficulty
}

const startSingleQuizFromSearch = (question) => {
    // Navigate to the question practice page
    router.push({
        name: 'QuestionPractice',
        query: { ids: question.id.toString() }
    })
}

const openChatFromSearchQuestion = async (question) => {
    const content = question.content || ''
    const questionId = question.id

    try {
        const res = await questionService.getQuestionOptions(questionId)
        const options = res.data || []

        if (options.length > 0) {
            const optionsText = options.map((o, index) => `${getLabel(index + 1)}. ${o.content}`).join('\n')
            const correctOpt = options.find(o => o.is_correct)
            let order = options.indexOf(correctOpt) + 1
            const correctAnswer = correctOpt ? `\n\n正確答案：${getLabel(order)}. ${correctOpt.content}` : ''
            openChat(`題目：${content}\n\n選項：\n${optionsText}${correctAnswer}\n\n請幫我解析這道題目，解釋為什麼正確答案是對的？`)
        } else {
            openChat(`題目：${content}\n\n請幫我解析這道題目`)
        }
    } catch (e) {
        console.error('Failed to load question options for AI:', e)
        openChat(`題目：${content}\n\n請幫我解析這道題目`)
    }
}

const startPractice = (mode) => {
    if (mode === 'historical' && practiceExams.value.length) {
        viewExam(practiceExams.value[0].id)
    }
}

// Mock Exam Functions
const openMockExamDialog = () => {
    // Reset sources
    mockExamSources.wrong = false
    mockExamSources.bookmarks = false
    mockExamSources.all = false
    mockExamQuestionCount.value = 20
    showMockExamDialog.value = true
}

const closeMockExamDialog = () => {
    showMockExamDialog.value = false
}

const startMockExam = async () => {
    const questionPool = []
    const seenIds = new Set()

    // Helper to add questions without duplicates
    const addQuestion = (q) => {
        const id = q.question || q.id
        if (!seenIds.has(id)) {
            seenIds.add(id)
            questionPool.push({
                id,
                content: q.question_content || q.content,
                subject: q.question_subject || q.subject
            })
        }
    }

    // Collect from wrong questions
    if (mockExamSources.wrong) {
        wrongQuestions.value.forEach(addQuestion)
    }

    // Collect from bookmarks
    if (mockExamSources.bookmarks) {
        bookmarks.value.forEach(addQuestion)
    }

    // Collect from all questions (fetch random from server)
    if (mockExamSources.all) {
        try {
            const count = Math.min(mockExamQuestionCount.value, 100)
            const res = await questionService.getQuestions({ page_size: count, random: true })
            const questions = res.data?.results || res.data || []
            questions.forEach(q => addQuestion({ id: q.id, content: q.content, subject: q.subject }))
        } catch (e) {
            console.error('Failed to fetch all questions:', e)
        }
    }

    if (questionPool.length === 0) {
        alert('無可用題目')
        return
    }

    // Shuffle and pick the requested number
    const shuffled = questionPool.sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffled.slice(0, Math.min(mockExamQuestionCount.value, shuffled.length))

    closeMockExamDialog()
    await startQuiz(selectedQuestions, 'mock')
}

const viewExam = (examId) => router.push({ name: 'ExamPreview', params: { id: examId } })

const startQuiz = (questions, type) => {
    // Navigate to the question practice page with all question IDs
    const questionIds = questions.map(q => q.question || q.id).join(',')
    router.push({
        name: 'QuestionPractice',
        query: { ids: questionIds }
    })
}

const loadQuestionOptions = async (questionId) => {
    try {
        const res = await questionService.getQuestionOptions(questionId)
        currentOptions.value = res.data || []
    } catch (e) {
        console.error('Failed to load options:', e)
        currentOptions.value = []
    }
}

const selectAnswer = (optionId) => {
    selectedAnswer.value = optionId
}

const checkAnswer = async () => {
    const selected = currentOptions.value.find(o => o.id === selectedAnswer.value)
    isCorrect.value = selected?.is_correct || false
    showAnswer.value = true

    // Record answer
    try {
        await examService.recordAnswer({
            question: currentQuestion.value.id,
            selected_option: selectedAnswer.value,
            is_correct: isCorrect.value
        })
        // Refresh wrong questions if answer was wrong
        if (!isCorrect.value) {
            const wrongRes = await examService.getWrongQuestions().catch(() => ({ data: [] }))
            wrongQuestions.value = wrongRes.data || []
        }
    } catch (e) {
        console.error('Failed to record answer:', e)
    }
}

const nextQuestion = async () => {
    if (currentIndex.value < quizQuestions.value.length - 1) {
        currentIndex.value++
        selectedAnswer.value = null
        showAnswer.value = false
        await loadQuestionOptions(quizQuestions.value[currentIndex.value].id)
    } else {
        exitQuiz()
    }
}

const exitQuiz = () => {
    quizMode.value = false
    quizQuestions.value = []
    currentIndex.value = 0
    selectedAnswer.value = null
    showAnswer.value = false
    currentOptions.value = []
    loadData() // Refresh stats
}

const startSingleQuiz = (question) => {
    // Navigate to the question practice page
    const questionId = question.question || question.id
    router.push({
        name: 'QuestionPractice',
        query: { ids: questionId.toString() }
    })
}

const addToFlashcard = async (questionId) => {
    try {
        await flashcardService.createFlashcard({ question: questionId })
        // Refresh data to update is_in_flashcard status
        const bookmarkRes = await examService.getBookmarks().catch(() => ({ data: [] }))
        bookmarks.value = bookmarkRes.data || []
        const wrongRes = await examService.getWrongQuestions().catch(() => ({ data: [] }))
        wrongQuestions.value = wrongRes.data || []
    } catch (e) {
        const errorMsg = e.message || ''
        if (errorMsg.includes('已') || errorMsg.includes('already')) {
            alert('此題目已在快閃卡中')
        } else {
            console.error('Failed to add to flashcard:', e)
            alert('加入快閃卡失敗')
        }
    }
}

const removeFromFlashcard = async (questionId) => {
    try {
        // First, find the flashcard ID for this question
        const flashcards = await flashcardService.getFlashcards()
        const flashcard = flashcards.find(fc => fc.question === questionId)
        if (flashcard) {
            await flashcardService.deleteFlashcard(flashcard.id)
            // Refresh data to update is_in_flashcard status
            const bookmarkRes = await examService.getBookmarks().catch(() => ({ data: [] }))
            bookmarks.value = bookmarkRes.data || []
            const wrongRes = await examService.getWrongQuestions().catch(() => ({ data: [] }))
            wrongQuestions.value = wrongRes.data || []
        } else {
            alert('找不到對應的快閃卡')
        }
    } catch (e) {
        console.error('Failed to remove from flashcard:', e)
        alert('從快閃卡移除失敗')
    }
}

const toggleFlashcard = async (item) => {
    const questionId = item.question || item.id
    if (item.is_in_flashcard) {
        // Only one confirmation is needed
        if (confirm('確定要從快閃卡移除此題目嗎？')) {
            await removeFromFlashcard(questionId)
        }
    } else {
        await addToFlashcard(questionId)
    }
}

const addCurrentToFlashcard = () => {
    if (currentQuestion.value?.id) {
        addToFlashcard(currentQuestion.value.id)
    }
}

const markReviewed = async (wrongQuestionId) => {
    try {
        await examService.markWrongQuestionReviewed(wrongQuestionId)
        wrongQuestions.value = wrongQuestions.value.filter(wq => wq.id !== wrongQuestionId)
    } catch (e) {
        console.error('Failed to mark as reviewed:', e)
    }
}

const removeBookmark = async (questionId) => {
    try {
        await examService.removeBookmark(questionId)
        bookmarks.value = bookmarks.value.filter(bm => bm.question !== questionId)
    } catch (e) {
        console.error('Failed to remove bookmark:', e)
    }
}

const composeQuestionPrompt = (question, options = null) => {
    if (!question) return ''
    const content = question.content || question.question_content || ''
    const opts = options || currentOptions.value
    const optionsText = opts.map((o, index) => `${getLabel(index + 1)}. ${o.content}`).join('\n')
    const correctOpt = opts.find(o => o.is_correct)
    let order = opts.indexOf(correctOpt) + 1
    const correctAnswer = correctOpt ? `正確答案：${getLabel(order)}. ${correctOpt.content}` : ''
    return `題目：${content}\n\n選項：\n${optionsText}\n\n${correctAnswer}\n\n請解釋為什麼這個答案是正確的？`
}

const openChatFromQuestion = async (question) => {
    const content = question.question_content || question.content || ''
    const questionId = question.question || question.id

    try {
        // Load options for this question to provide full context to AI
        const res = await questionService.getQuestionOptions(questionId)
        const options = res.data || []

        if (options.length > 0) {
            // Compose full prompt with question and all options
            const optionsText = options.map((o, index) => `${getLabel(index + 1)}. ${o.content}`).join('\n')
            const correctOpt = options.find(o => o.is_correct)
            let order = options.indexOf(correctOpt) + 1
            const correctAnswer = correctOpt ? `\n\n正確答案：${getLabel(order)}. ${correctOpt.content}` : ''
            openChat(`題目：${content}\n\n選項：\n${optionsText}${correctAnswer}\n\n請幫我解析這道題目，解釋為什麼正確答案是對的？`)
        } else {
            // Fallback if no options available
            openChat(`題目：${content}\n\n請幫我解析這道題目`)
        }
    } catch (e) {
        console.error('Failed to load question options for AI:', e)
        openChat(`題目：${content}\n\n請幫我解析這道題目`)
    }
}

// Split View State
const isChatOpen = ref(false)
const chatPrefill = ref({ text: '', stamp: Date.now() })
const splitRatio = ref(0.6) // Main panel takes 60% by default
const isDragging = ref(false)
const minPanelWidth = 300 // Minimum width for each panel in pixels

// Extension detection - hide Ask AI button when CiteRight extension is present
const isExtensionPresent = ref(false)

// Floating button draggable state
const floatingBtnPos = ref({ x: null, y: null }) // null means use default position
const isFloatingDragging = ref(false)
const floatingDragStart = ref({ x: 0, y: 0 })
const floatingBtnStartPos = ref({ x: 0, y: 0 })
const hasDragged = ref(false)

// Computed style for floating button
const floatingBtnStyle = computed(() => {
    if (floatingBtnPos.value.x === null || floatingBtnPos.value.y === null) {
        return {} // Use default CSS position
    }
    return {
        left: `${floatingBtnPos.value.x}px`,
        top: `${floatingBtnPos.value.y}px`,
        right: 'auto',
        bottom: 'auto',
        transition: floatingBtnPos.value.snapping ? 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s ease' : 'none'
    }
})

// Computed styles for split view
const mainPanelStyle = computed(() => {
    if (!isChatOpen.value) {
        return { width: '100%' }
    }
    return { width: `calc(${splitRatio.value * 100}% - 4px)` }
})

const chatPanelStyle = computed(() => {
    if (!isChatOpen.value) {
        return { display: 'none' }
    }
    return { width: `calc(${(1 - splitRatio.value) * 100}% - 4px)` }
})

// Drag handlers for the divider
const startDrag = (e) => {
    isDragging.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
    if (!isDragging.value) return

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const containerWidth = window.innerWidth

    let newRatio = clientX / containerWidth

    // Enforce minimum panel widths
    const minRatio = minPanelWidth / containerWidth
    const maxRatio = 1 - minRatio

    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))
    splitRatio.value = newRatio
}

const stopDrag = () => {
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
}

// Floating AI button drag handlers
const startFloatingDrag = (e) => {
    e.preventDefault()
    isFloatingDragging.value = true
    hasDragged.value = false

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    floatingDragStart.value = { x: clientX, y: clientY }

    // Get current button position
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    floatingBtnStartPos.value = { x: rect.left, y: rect.top }

    // If this is first drag and position is null, initialize from current position
    if (floatingBtnPos.value.x === null) {
        floatingBtnPos.value = { x: rect.left, y: rect.top, side: 'right', snapping: false }
    }
    floatingBtnPos.value.snapping = false

    document.addEventListener('mousemove', onFloatingDrag)
    document.addEventListener('mouseup', stopFloatingDrag)
    document.addEventListener('touchmove', onFloatingDrag, { passive: false })
    document.addEventListener('touchend', stopFloatingDrag)
}

const onFloatingDrag = (e) => {
    if (!isFloatingDragging.value) return
    e.preventDefault()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - floatingDragStart.value.x
    const deltaY = clientY - floatingDragStart.value.y

    // Check if user has moved enough to count as a drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasDragged.value = true
    }

    const btnSize = 56
    const padding = 16

    // Allow free movement during drag
    let newX = floatingBtnStartPos.value.x + deltaX
    let newY = floatingBtnStartPos.value.y + deltaY

    // Constrain to viewport
    newX = Math.max(padding, Math.min(window.innerWidth - btnSize - padding, newX))
    newY = Math.max(padding, Math.min(window.innerHeight - btnSize - padding, newY))

    floatingBtnPos.value = { ...floatingBtnPos.value, x: newX, y: newY, snapping: false }
}

const stopFloatingDrag = () => {
    isFloatingDragging.value = false

    document.removeEventListener('mousemove', onFloatingDrag)
    document.removeEventListener('mouseup', stopFloatingDrag)
    document.removeEventListener('touchmove', onFloatingDrag)
    document.removeEventListener('touchend', stopFloatingDrag)

    // If not dragged, treat as click
    if (!hasDragged.value) {
        openChat()
        return
    }

    // Snap to nearest side with animation
    const btnSize = 56
    const padding = 16
    const currentX = floatingBtnPos.value.x
    const midPoint = window.innerWidth / 2

    // Determine which side to snap to
    const side = (currentX + btnSize / 2) < midPoint ? 'left' : 'right'
    const targetX = side === 'left' ? padding : window.innerWidth - btnSize - padding

    // Enable snapping animation and set target position
    floatingBtnPos.value = {
        ...floatingBtnPos.value,
        x: targetX,
        side,
        snapping: true
    }
}

const openChat = (prefillText = '') => {
    chatPrefill.value = { text: prefillText, stamp: Date.now() }
    isChatOpen.value = true
}

const closeChat = () => {
    isChatOpen.value = false
}

const handleResize = () => {
    // Ensure split ratio respects minimum widths on resize
    const containerWidth = window.innerWidth
    const minRatio = minPanelWidth / containerWidth
    const maxRatio = 1 - minRatio

    if (splitRatio.value < minRatio) splitRatio.value = minRatio
    if (splitRatio.value > maxRatio) splitRatio.value = maxRatio
}

// Watch for focused question and scroll to it when loaded
watch([focusedQuestionEl, () => loadingWrong.value], async ([el, loading]) => {
    if (el && !loading) {
        await nextTick()
        // Scroll to the focused question with some offset
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Clear the focus query param after a delay to prevent re-triggering
        setTimeout(() => {
            const newQuery = { ...route.query }
            delete newQuery.focus
            router.replace({ query: newQuery })
        }, 2000)
    }
}, { immediate: true })

onMounted(() => {
    loadData()
    loadTags()
    window.addEventListener('resize', handleResize)

    // Detect CiteRight extension by checking for its floating button injected into the DOM
    // Detect CiteRight extension by checking for its marker element
    const checkExtension = () => {
        const extensionMarker = document.querySelector('#citeright-extension-marker')
        const extensionBtn = document.querySelector('.floating-sidebar-btn')
        if (extensionMarker || extensionBtn) {
            isExtensionPresent.value = true
            console.log('[Practice] CiteRight extension detected, hiding Ask AI button')
        }
    }
    
    // Check immediately and also after a short delay (extension may inject later)
    checkExtension()
    setTimeout(checkExtension, 1000)
    setTimeout(checkExtension, 3000)

    // Trigger initial search if on questions tab
    if (currentTab.value === 'questions') {
        searchQuestions(1)
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    // Clean up any lingering drag state
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.split-view-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 140px);
    overflow: hidden;
    background: var(--bg-soft);
}

/* Main Content Panel */
.main-panel {
    height: 100%;
    overflow-y: auto;
    background: var(--bg-soft);
    transition: width 0.1s ease;
}

.container {
    max-width: 1180px;
    padding: 20px;
    margin: 0 auto;
}

/* Draggable Divider */
.split-divider {
    width: 8px;
    background: #e5e7eb;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
    position: relative;
}

.split-divider:hover,
.split-divider:active {
    background: #d3d8df;
}

.divider-handle {
    width: 4px;
    height: 40px;
    background: #9ca3af;
    border-radius: 2px;
    transition: background 0.2s;
}

.split-divider:hover .divider-handle,
.split-divider:active .divider-handle {
    background: #6b7280;
}

/* AI Chat Split Panel */
.chat-panel-split {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-left: 1px solid var(--border);
    overflow: hidden;
    transition: width 0.1s ease;
}

.chat-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: #f6f8fb;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
}

.chat-panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
}

.chat-icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
    font-size: 13px;
}

.btn-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    line-height: 1;
    transition: all 0.2s;
}

.btn-close:hover {
    background: #eef1f5;
    color: var(--text-primary);
}

.chat-panel-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.section-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 18px;
}

/* Search Section */
.search-section {
    background: var(--surface);
    margin-top: 20px;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    border: 1px solid var(--border);
}

.search-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 14px 0;
}

.search-filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}

.search-input {
    flex: 1;
    min-width: 200px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    background: #fbfcfd;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(47, 95, 144, 0.1);
}

.tag-filter {
    flex: 1;
    min-width: 250px;
}

.tag-multiselect {
    font-size: 14px;
}

/* Multiselect customization */
:deep(.multiselect) {
    min-height: 42px;
}

:deep(.multiselect__tags) {
    min-height: 42px;
    padding: 6px 40px 0 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fbfcfd;
}

:deep(.multiselect__tags:focus-within) {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(47, 95, 144, 0.1);
}

:deep(.multiselect__tag) {
    background: var(--primary);
    border-radius: 6px;
    padding: 4px 26px 4px 10px;
    margin-bottom: 4px;
}

:deep(.multiselect__tag-icon) {
    border-radius: 0 6px 6px 0;
}

:deep(.multiselect__tag-icon:after) {
    color: rgba(255, 255, 255, 0.7);
}

:deep(.multiselect__tag-icon:hover) {
    background: rgba(0, 0, 0, 0.1);
}

:deep(.multiselect__option--highlight) {
    background: var(--primary);
}

:deep(.multiselect__placeholder) {
    color: #9ca3af;
    padding-top: 2px;
}

/* Search Results */
.search-results {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
}

.results-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    font-size: 14px;
    color: var(--text-secondary);
}

.results-header span:first-child {
    flex: 1;
    font-weight: 600;
    color: var(--text-primary);
}



.question-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
}

.meta-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
}

.subject-badge {
    background: #e8f4fd;
    color: #1a5490;
    border: 1px solid #c8e1f5;
}

.difficulty-badge {
    border: 1px solid;
}

.difficulty-badge.easy {
    background: #ecf8f1;
    color: #1f6a3b;
    border-color: #c8ecd8;
}

.difficulty-badge.medium {
    background: #fef9e8;
    color: #9a7b1b;
    border-color: #f5e6b3;
}

.difficulty-badge.hard {
    background: #fdf1f1;
    color: #9a1b1b;
    border-color: #f3d6d6;
}

.tag-badge {
    background: #f3f4f6;
    color: #4b5563;
    border: 1px solid #e5e7eb;
}

/* Search Pagination */
.search-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
}

.search-pagination .page-info {
    font-size: 14px;
    color: var(--text-secondary);
    min-width: 100px;
    text-align: center;
}

.search-pagination .btn {
    min-width: 80px;
}

.search-pagination .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Practice Mode Cards */
.practice-modes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 26px;
}

.mode-card {
    background: var(--surface);
    padding: 22px 18px;
    border-radius: 12px;
    text-align: left;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.mode-card:hover {
    transform: translateY(-3px);
    border-color: rgba(47, 95, 144, 0.25);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.mode-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--primary-soft);
    color: var(--primary);
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 13px;
    margin-bottom: 10px;
    letter-spacing: 0.05em;
}

.mode-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 6px;
}

.mode-desc {
    font-size: 13px;
    color: var(--text-secondary);
}

/* Historical Exam Card - Blue theme */
.historical-card {
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.historical-card .mode-icon {
    background: rgba(59, 130, 246, 0.15);
    color: #2563eb;
}

.historical-card:hover {
    border-color: rgba(59, 130, 246, 0.5);
}

/* Mock Exam Card - Purple theme */
.mock-exam-card {
    background: linear-gradient(135deg, #f8f4ff 0%, #f3f7ff 100%);
    border: 1px solid rgba(128, 90, 200, 0.35);
}

.mock-exam-card .mode-icon {
    background: rgba(128, 90, 200, 0.15);
    color: #7c3aed;
}

.mock-exam-card:hover {
    border-color: rgba(128, 90, 200, 0.5);
}

/* Wrong Questions Card - Red/Orange theme */
.wrong-card {
    background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.wrong-card .mode-icon {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
}

.wrong-card:hover {
    border-color: rgba(239, 68, 68, 0.5);
}

/* Bookmark Card - Amber/Gold theme */
.bookmark-card {
    background: linear-gradient(135deg, #fffbeb 0%, #fef9e7 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
}

.bookmark-card .mode-icon {
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
}

.bookmark-card:hover {
    border-color: rgba(245, 158, 11, 0.55);
}

/* Floating AI Button */
.floating-ai-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: 0;
    background: linear-gradient(135deg, #4A90D9, #3B7FCC);
    color: #fff;
    border: none;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(74, 144, 217, 0.4);
    cursor: grab;
    touch-action: none;
    user-select: none;
    transition: box-shadow 0.2s, transform 0.2s;
    z-index: 100;
}

.floating-ai-btn:active {
    cursor: grabbing;
    transform: scale(1.05);
}

.floating-ai-btn:hover {
    box-shadow: 0 6px 24px rgba(74, 144, 217, 0.5);
}

.floating-ai-icon {
    width: 32px;
    height: 32px;
    color: #fff;
    pointer-events: none;
}


/* Mock Exam Dialog */
.mock-exam-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.mock-exam-dialog {
    background: #fff;
    border-radius: 16px;
    width: 90%;
    max-width: 480px;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
    overflow: hidden;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    background: #f8fafc;
}

.dialog-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
}

.dialog-body {
    padding: 24px;
}

.dialog-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 20px;
    line-height: 1.6;
}

.source-options {
    margin-bottom: 24px;
}

.source-options h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px;
}

.source-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 8px;
    background: #f8fafc;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
}

.source-checkbox:hover {
    background: #f1f5f9;
}

.source-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
}

.source-checkbox input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.source-checkbox input:disabled+span {
    opacity: 0.5;
}

.source-checkbox span {
    font-size: 14px;
    color: var(--text-primary);
}

.question-count-setting h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px;
}

.count-options {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.count-btn {
    padding: 8px 16px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
}

.count-btn:hover {
    background: #e2e8f0;
}

.count-btn.active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
}

.custom-count {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-secondary);
}

.count-input {
    width: 70px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
}

.count-input:focus {
    outline: none;
    border-color: var(--primary);
}

.available-count {
    margin-top: 16px;
    padding: 12px 16px;
    background: #ecfdf5;
    color: #059669;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
}

.no-questions-warning {
    margin-top: 16px;
    padding: 12px 16px;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid var(--border);
}

/* Tabs */
.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    background: var(--surface);
    padding: 6px;
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow-x: auto; /* Allow scrolling on very small screens */
    scrollbar-width: none; /* Hide scrollbar for Firefox */
}

.tabs::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome/Safari */
}

.tabs button {
    flex: 1;
    padding: 10px 16px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    white-space: nowrap;
    min-height: 44px; /* Touch target */
    display: flex;
    align-items: center;
    justify-content: center;
}

.tabs button.active {
    background: var(--primary);
    color: #f7f9fc;
    border-color: var(--primary);
    box-shadow: 0 10px 24px rgba(47, 95, 144, 0.16);
}

/* Content Section */
.content-section {
    background: var(--surface);
    padding: 22px;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    border: 1px solid var(--border);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
}

.section-header h3 {
    margin: 0;
    font-size: 17px;
    color: var(--text-primary);
    font-weight: 700;
}

.loading,
.empty {
    text-align: center;
    padding: 36px;
    color: var(--text-secondary);
}

.exam-section {
    margin-bottom: 32px;
}

.exam-section:last-child {
    margin-bottom: 0;
}

.exam-list,
.question-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.exam-item,
.question-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: #f7f9fb;
    border-radius: 10px;
    border: 1px solid var(--border);
    transition: all 0.3s ease;
}

/* Highlight flash animation for focused question */
.question-item.highlight-flash {
    animation: highlight-flash 2s ease-out;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

@keyframes highlight-flash {
    0% {
        background: rgba(37, 99, 235, 0.2);
        box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.3);
        transform: scale(1.01);
    }
    50% {
        background: rgba(37, 99, 235, 0.1);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
        transform: scale(1.005);
    }
    100% {
        background: #f7f9fb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        transform: scale(1);
    }
}

.exam-info,
.question-info {
    flex: 1;
}

.exam-name {
    font-weight: 700;
    color: var(--text-primary);
}

.exam-meta {
    font-size: 13px;
    color: var(--text-secondary);
    margin-left: 12px;
}

.question-text {
    margin: 6px 0;
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.5;
}

.question-subject {
    font-size: 13px;
    color: var(--text-secondary);
}

.wrong-badge {
    display: inline-block;
    background: #fdf1f1;
    color: #9a1b1b;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    border: 1px solid #f3d6d6;
}

.question-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* Buttons */
.btn {
    padding: 8px 14px;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    background: var(--primary);
    color: #f7f9fc;
    transition: all 0.2s;
}

.btn:hover {
    box-shadow: 0 10px 22px rgba(47, 95, 144, 0.18);
    transform: translateY(-1px);
}

.btn-sm {
    padding: 7px 12px;
    font-size: 13px;
}

.btn-secondary {
    background: #eef1f5;
    color: var(--text-primary);
    border-color: var(--border);
}

.btn-secondary:hover {
    background: #e3e8ef;
}

.btn-flashcard-added {
    background: #E0E7FF !important;
    color: #4338CA !important;
    border: 1px solid #C7D2FE !important;
    cursor: default;
}

.btn-flashcard-added:hover {
    transform: none;
    box-shadow: none;
}

.btn-danger {
    background: #c0392b;
}

.btn-danger:hover {
    background: #a83226;
}

.btn-primary {
    background: var(--primary);
}

.btn-outline {
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
}

.btn-outline:hover {
    background: var(--primary);
    color: #f7f9fc;
}

.btn-ghost {
    background: transparent;
    color: var(--primary);
}

.btn-ghost:hover {
    background: #eef3f9;
}

/* Quiz Panel */
.quiz-panel {
    background: var(--surface);
    padding: 22px;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
    border: 1px solid var(--border);
}

.quiz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
}

.quiz-tools {
    display: flex;
    gap: 8px;
}

.quiz-question {
    margin-bottom: 18px;
}

.question-content {
    font-size: 17px;
    color: var(--text-primary);
    margin-bottom: 18px;
    line-height: 1.6;
}

.quiz-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.option-item {
    display: flex;
    gap: 12px;
    padding: 16px; /* Larger tap area */
    border: 1.5px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface);
    font-size: 16px;
    line-height: 1.5;
    min-height: 52px; /* Ensure sufficient height */
}

.option-item:hover {
    border-color: rgba(47, 95, 144, 0.4);
    background: #f3f6fa;
}

.option-item.selected {
    border-color: var(--primary);
    background: #eef3f9;
}

.option-item.correct {
    border-color: #3b8c5a;
    background: #ecf8f1;
}

.option-item.wrong {
    border-color: #c0392b;
    background: #fdf3f1;
}

.option-label {
    font-weight: 700;
    min-width: 24px;
    color: var(--text-secondary);
}

.answer-feedback {
    margin-top: 14px;
    padding: 12px;
    border-radius: 10px;
}

.correct-msg {
    color: #1f6a3b;
    background: #ecf8f1;
    padding: 12px;
    border-radius: 10px;
    margin: 0;
}

.wrong-msg {
    color: #a83226;
    background: #fdf1f0;
    padding: 12px;
    border-radius: 10px;
    margin: 0;
}

.quiz-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    flex-wrap: wrap;
}

/* ========== RESPONSIVE DESIGN ========== */

/* Tablet 平板 */
@media (max-width: 1024px) {

    .stats-section,
    .practice-modes {
        grid-template-columns: repeat(2, 1fr);
    }

    .container {
        padding: 16px;
    }

    .chat-panel-split {
        min-width: 350px;
    }

    .mode-card {
        padding: 18px 14px;
    }

    .mode-icon {
        width: 32px;
        height: 32px;
        font-size: 12px;
    }

    .quiz-header {
        flex-wrap: wrap;
        gap: 10px;
    }

    .quiz-tools {
        width: 100%;
        justify-content: flex-end;
    }

    /* Search responsive */
    .filter-row {
        flex-wrap: wrap;
    }

    .search-input {
        min-width: 150px;
    }

    .tag-filter {
        min-width: 200px;
        flex-basis: 100%;
    }
}

/* Mobile Overlay for AI Chat */
.mobile-overlay {
    display: none;
}

/* Mobile 手機 */
@media (max-width: 768px) {
    .split-view-container {
        flex-direction: column; /* Stack vertically on mobile */
        height: auto;
        min-height: calc(100vh - 140px);
        position: relative;
        overflow-y: auto; /* Allow scrolling */
    }

    .main-panel {
        width: 100% !important;
        height: auto;
        overflow: visible; /* Let content determine height */
    }

    .split-divider {
        display: none;
    }

    .chat-panel-split {
        position: fixed !important;
        top: 0;
        right: 0;
        width: 85% !important;
        max-width: 400px;
        height: 100vh !important;
        border-left: 1px solid var(--border);
        border-top: none;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    }

    .chat-panel-split.mobile-open {
        transform: translateX(0);
    }

    .mobile-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 999;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    .chat-panel-header {
        padding: 12px 14px;
    }

    .chat-panel-title {
        font-size: 14px;
    }

    .chat-icon {
        width: 24px;
        height: 24px;
        font-size: 12px;
    }

    .btn-close {
        font-size: 18px;
    }

    .container {
        padding: 14px 10px;
    }

    .section-title {
        font-size: 16px;
        margin-bottom: 14px;
    }

    .stats-section,
    .practice-modes {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .mode-card {
        padding: 16px 12px;
    }

    .mode-icon {
        width: 28px;
        height: 28px;
        font-size: 11px;
        margin-bottom: 8px;
    }

    .mode-title {
        font-size: 14px;
        margin-bottom: 4px;
    }

    .mode-desc {
        font-size: 11px;
    }

    /* Search responsive for mobile */
    .search-section {
        padding: 14px;
    }

    .search-title {
        font-size: 15px;
        margin-bottom: 12px;
    }

    .filter-row {
        flex-direction: column;
        gap: 8px;
    }

    .search-input,
    .tag-filter {
        width: 100%;
        min-width: unset;
    }

    .filter-row .btn {
        flex: 1;
    }

    .results-header {
        flex-wrap: wrap;
        gap: 8px;
    }



    .question-meta {
        gap: 4px;
    }

    .meta-badge {
        font-size: 10px;
        padding: 2px 6px;
    }

    .tabs {
        gap: 6px;
        margin-bottom: 14px;
    }

    .tabs button {
        padding: 8px 12px;
        font-size: 13px;
        flex: 1;
    }

    .content-section {
        padding: 16px;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .section-header h3 {
        font-size: 15px;
    }

    .section-actions {
        width: 100%;
    }

    .section-actions .btn {
        width: 100%;
    }

    .exam-item,
    .question-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
    }

    .question-info {
        width: 100%;
    }

    .question-text {
        font-size: 14px;
        margin: 4px 0;
    }

    .question-subject {
        font-size: 12px;
    }

    .wrong-badge {
        font-size: 11px;
        padding: 2px 6px;
    }

    .question-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .question-actions .btn-sm {
        flex: 1;
        font-size: 12px;
        padding: 6px 10px;
    }

    /* Quiz Panel */
    .quiz-panel {
        padding: 16px;
    }

    .quiz-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        font-size: 14px;
    }

    .quiz-tools {
        width: 100%;
        gap: 6px;
    }

    .quiz-tools .btn {
        flex: 1;
        padding: 6px 10px;
        font-size: 13px;
    }

    .question-content {
        font-size: 15px;
        margin-bottom: 14px;
    }

    .quiz-options {
        gap: 12px;
    }

    .option-item {
        padding: 16px;
        font-size: 15px;
        min-height: 52px;
    }

    .option-label {
        min-width: 24px;
        font-weight: 600;
    }

    .answer-feedback {
        margin-top: 12px;
        padding: 10px;
        font-size: 14px;
    }

    .quiz-actions {
        flex-direction: column;
        gap: 8px;
    }

    .quiz-actions .btn {
        width: 100%;
    }
}

/* Small Mobile 小螢幕手機 */
@media (max-width: 480px) {
    .container {
        padding: 10px 8px;
    }

    .section-title {
        font-size: 15px;
    }

    .practice-modes {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .mode-card {
        padding: 14px 12px;
    }

    .tabs button {
        padding: 8px 12px;
        font-size: 13px;
        flex: 0 0 auto; /* Allow shrinking/growing but respect content */
        min-width: 80px; /* Minimum width for tap */
    }

    .content-section {
        padding: 12px;
    }

    .exam-item,
    .question-item {
        padding: 10px;
    }

    .question-text {
        font-size: 13px;
    }

    .question-actions {
        flex-direction: column;
    }

    .question-actions .btn-sm {
        width: 100%;
    }

    .quiz-panel {
        padding: 12px;
    }

    .question-content {
        font-size: 14px;
    }

    .option-item {
        padding: 10px;
        font-size: 13px;
    }

    .chat-panel-split {
        width: 90% !important;
        max-width: none;
    }

    .chat-panel-header {
        padding: 10px 12px;
    }
}

/* Landscape Mobile 橫向手機 */
@media (max-width: 768px) and (orientation: landscape) {
    .split-view-container {
        flex-direction: row;
    }

    .main-panel {
        width: 50% !important;
        height: 100%;
    }

    .split-divider {
        width: 8px;
        height: 100%;
        cursor: col-resize;
    }

    .divider-handle {
        width: 4px;
        height: 40px;
    }

    .chat-panel-split {
        width: 50% !important;
        height: 100%;
        border-left: 1px solid var(--border);
        border-top: none;
    }

    .practice-modes {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* Ensure AI Chat Interface fills the panel */
:deep(.ai-chat-interface) {
    height: 100%;
}

:deep(.ai-chat-interface .chat-panel) {
    height: 100%;
}

:deep(.ai-chat-interface .chat-input-container) {
    flex-shrink: 0;
}

/* List Header Actions */
.list-header-actions {
    display: flex;
    align-items: center;
    padding: 0 4px 12px 4px;
    /* Space before proper list */
}

.select-all-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    user-select: none;
}

.select-all-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
}

/* Search Results & Filter Styles */
.search-results-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 200px;
}

.search-item {
    cursor: pointer;
    transition: all 0.2s ease;
    flex-direction: row !important;
    /* Force row layout even on mobile for checkbox alignment */
    align-items: flex-start;
    gap: 12px;
}

.search-item:hover {
    background: #f1f5f9;
    border-color: var(--primary);
}

.search-item.selected {
    background: var(--primary-soft, #EEF2FF);
    border-color: var(--primary);
}

.item-checkbox {
    padding-top: 4px;
    flex-shrink: 0;
}

.item-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
}

.meta-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

.subject-badge {
    background: #e0f2fe;
    color: #0369a1;
}

.difficulty-badge.easy {
    background: #dcfce7;
    color: #15803d;
}

.difficulty-badge.medium {
    background: #fef9c3;
    color: #a16207;
}

.difficulty-badge.hard {
    background: #fee2e2;
    color: #b91c1c;
}

.tag-badge {
    background: #f3f4f6;
    color: #4b5563;
}

.status-badge {
    gap: 4px;
}

.status-badge svg {
    flex-shrink: 0;
}

.bookmark-status {
    background: #fef3c7;
    color: #b45309;
}

.flashcard-status {
    background: #dbeafe;
    color: #1d4ed8;
}

.empty-search,
.loading-search {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 12px;
    border: 1px dashed var(--border);
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Mobile adjustments for search item */
@media (max-width: 480px) {
    .search-item {
        flex-wrap: nowrap;
    }
}

/* Add to Exam Modal Styles */
.exam-select-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
}

.exam-select-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fbfcfd;
}

.exam-select-item:hover {
    border-color: var(--primary);
    background: #f3f6fa;
}

.exam-select-item.selected {
    border-color: var(--primary);
    background: var(--primary-soft, #EEF2FF);
}

.exam-select-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
    flex-shrink: 0;
}

.exam-select-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}

.exam-select-name {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.exam-select-meta {
    font-size: 12px;
    color: var(--text-secondary);
}

.loading-exams {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    color: var(--text-secondary);
}

.no-exams-warning {
    text-align: center;
    padding: 30px;
    color: var(--text-secondary);
}

.no-exams-warning p {
    margin: 0 0 16px 0;
}

.dialog-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dialog-footer-right .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

/* Flag button styles */
.btn-icon {
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--surface-muted);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-icon:hover {
    background: var(--primary-soft);
    color: var(--primary);
    border-color: var(--primary);
}

.btn-icon.flagged {
    background: var(--warning-soft, #fef3c7);
    color: var(--warning, #f59e0b);
    border-color: var(--warning, #f59e0b);
}

.btn-icon.flagged:hover {
    background: var(--warning, #f59e0b);
    color: #fff;
}

.btn-icon i {
    font-size: 16px;
}

/* Dark Mode Overrides */
:global(.dark) .mode-card,
:global(.dark) .subject-tab,
:global(.dark) .filter-section,
:global(.dark) .question-list-container,
:global(.dark) .pagination-container {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .mode-card:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .search-box,
:global(.dark) .filter-select,
:global(.dark) .filter-input {
    background: var(--surface-muted) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .quiz-container,
:global(.dark) .quiz-question-card,
:global(.dark) .quiz-header {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .option-card {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .option-card:hover {
    background: var(--surface-muted) !important;
    border-color: var(--primary) !important;
}

:global(.dark) .mock-exam-dialog-overlay .mock-exam-dialog {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Tablet/Medium screens (768px and below) */
@media (max-width: 768px) {
    /* Switch mode cards to 2-column layout */
    .practice-modes {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
    
    /* Reduce mode card padding */
    .mode-card {
        padding: 18px 14px;
    }
    
    .mode-icon {
        width: 32px;
        height: 32px;
        font-size: 12px;
    }
    
    .mode-title {
        font-size: 14px;
    }
    
    .mode-desc {
        font-size: 12px;
    }
    
    /* Make tabs wrap properly */
    .tabs {
        flex-wrap: wrap;
        gap: 6px;
    }
    
    .tabs button {
        flex: 0 1 auto;
        padding: 8px 12px;
        font-size: 13px;
        white-space: nowrap;
    }
    
    /* Adjust container padding and OVERRIDE global max-width constraint */
    .container {
        padding: 16px;
        max-width: 100% !important;
        width: 100% !important;
    }
    
    /* Add bottom padding for mobile nav bar */
    .main-panel {
        padding-bottom: 80px;
        width: 100% !important; /* Override split-view inline styles */
    }
    
    /* Hide split divider on tablet/mobile */
    .split-divider {
        display: none !important;
    }
    
    /* Force chat panel to be full-width overlay on tablet */
    .chat-panel-split {
        position: fixed !important;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100% !important;
        z-index: 1000;
    }
    
    /* Adjust filter section for smaller screens */
    .filter-row {
        flex-direction: column;
    }
    
    .search-input,
    .tag-filter {
        width: 100%;
        min-width: unset;
    }
}

/* Small screens (480px and below) */
@media (max-width: 480px) {
    /* Stack mode cards to single column on very small screens */
    .practice-modes {
        grid-template-columns: 1fr;
    }
    
    /* Make tabs scrollable horizontally */
    .tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
    }
    
    .tabs button {
        flex-shrink: 0;
    }
    
    .section-title {
        font-size: 16px;
    }
}
</style>
