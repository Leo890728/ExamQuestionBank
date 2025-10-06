<template>
  <div class="practice-view">
    <h2 class="section-title">練習模式</h2>
    <p class="text-center text-gray-600 mb-8">
      選擇您的練習模式，開始學習之旅
    </p>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>考試別</label>
          <select v-model="filters.examSeries">
            <option :value="null">全部</option>
            <option value="judicial">司法官</option>
            <option value="lawyer">律師</option>
          </select>
        </div>
        <div class="filter-group">
          <label>年度</label>
          <select v-model="filters.year">
            <option :value="null">全部</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
        <div class="filter-group">
          <label>科目</label>
          <select v-model="filters.subject">
            <option :value="null">全部</option>
            <option value="civil">民法</option>
            <option value="criminal">刑法</option>
            <option value="administrative">行政法</option>
          </select>
        </div>
        <div class="filter-group">
          <label>難度</label>
          <select v-model="filters.difficulty">
            <option :value="null">全部</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="applyFilters">套用篩選</button>
        <button class="btn btn-secondary" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- Practice Modes -->
    <div class="practice-modes">
      <div class="mode-card">
        <div class="mode-icon">📚</div>
        <div class="mode-title">歷屆考題</div>
        <div class="mode-desc">按年度練習歷屆考題</div>
        <button class="btn-mode" @click="startPractice('historical')">開始練習</button>
      </div>
      <div class="mode-card">
        <div class="mode-icon">📝</div>
        <div class="mode-title">模擬考試</div>
        <div class="mode-desc">模擬真實考試情境</div>
        <button class="btn-mode" @click="startPractice('simulation')">開始測驗</button>
      </div>
      <div class="mode-card">
        <div class="mode-icon">🔀</div>
        <div class="mode-title">混合練習</div>
        <div class="mode-desc">隨機混合不同年度題目</div>
        <button class="btn-mode" @click="startPractice('mixed')">隨機練習</button>
      </div>
      <div class="mode-card">
        <div class="mode-icon">⭐</div>
        <div class="mode-title">收藏題庫</div>
        <div class="mode-desc">複習已收藏的題目</div>
        <button class="btn-mode" @click="startPractice('bookmarked')">查看收藏</button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ statistics.totalQuestions || 3247 }}</div>
        <div class="stat-label">題庫數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ statistics.attempted || 1582 }}</div>
        <div class="stat-label">已練習</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ statistics.correctRate || 73 }}%</div>
        <div class="stat-label">正確率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ statistics.toReview || 156 }}</div>
        <div class="stat-label">待複習</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useQuestionBankStore } from '@/stores/questionBank'
import { useRouter } from 'vue-router'

const router = useRouter()
const questionBankStore = useQuestionBankStore()

const filters = reactive({
  examSeries: null,
  year: null,
  subject: null,
  difficulty: null
})

const statistics = reactive({
  totalQuestions: 0,
  attempted: 0,
  correctRate: 0,
  toReview: 0
})

const applyFilters = async () => {
  Object.keys(filters).forEach(key => {
    questionBankStore.setFilter(key, filters[key])
  })
  await questionBankStore.fetchQuestions()
  alert('✅ 篩選已套用')
}

const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = null
  })
  questionBankStore.resetFilters()
  alert('🔄 篩選已重置')
}

const startPractice = (mode) => {
  alert(`開始${mode}模式練習`)
  // TODO: Implement practice session start
}
</script>

<style scoped>
@import '../style.css';
</style>
