<template>
  <div class="analytics-view">
    <div class="container">
      <div class="analytics-header">
        <h2><i class="bi bi-graph-up-arrow"></i> 學習追蹤分析</h2>
        <p class="header-subtitle">追蹤您的學習進度與表現</p>
      </div>

      <div v-if="loading" class="loading">載入中...</div>

      <template v-else>
        <!-- Analytics Overview Cards -->
        <div class="overview-cards">
          <div class="overview-card card-hover">
            <div class="overview-icon blue"><i class="bi bi-clipboard-check"></i></div>
            <div class="overview-content">
              <span class="overview-value">{{ stats.total_answered || 0 }}</span>
              <span class="overview-label">總練習題數</span>
              <span class="overview-change positive" v-if="weeklyStats.questionsChange">
                +{{ weeklyStats.questionsChange }} 本週
              </span>
            </div>
          </div>
          <div class="overview-card card-hover">
            <div class="overview-icon green"><i class="bi bi-bullseye"></i></div>
            <div class="overview-content">
              <span class="overview-value">{{ stats.accuracy || 0 }}%</span>
              <span class="overview-label">平均正確率</span>
              <span class="overview-change" :class="weeklyStats.accuracyChange >= 0 ? 'positive' : 'negative'" v-if="weeklyStats.accuracyChange !== null">
                {{ weeklyStats.accuracyChange >= 0 ? '+' : '' }}{{ weeklyStats.accuracyChange }}% vs 上週
              </span>
            </div>
          </div>
          <div class="overview-card card-hover">
            <div class="overview-icon purple"><i class="bi bi-fire"></i></div>
            <div class="overview-content">
              <span class="overview-value">{{ weeklyStats.streakDays || 0 }}</span>
              <span class="overview-label">連續學習天數</span>
              <span class="overview-change neutral" v-if="weeklyStats.streakRecord">
                最高紀錄: {{ weeklyStats.streakRecord }}天
              </span>
            </div>
          </div>
          <div class="overview-card card-hover">
            <div class="overview-icon amber"><i class="bi bi-graph-up-arrow"></i></div>
            <div class="overview-content">
              <span class="overview-value">+{{ weeklyStats.weeklyImprovement || 0 }}</span>
              <span class="overview-label">本週進步</span>
              <span class="overview-change positive" v-if="weeklyStats.improvementPercent">
                較上週增加 {{ weeklyStats.improvementPercent }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="analytics-card heatmap-card">
            <ActivityHeatmap :data="chartData" />
          </div>
          <div class="charts-row">
            <div class="analytics-card chart-card">
              <AccuracyTrendChart :data="chartData" />
            </div>
            <div class="analytics-card chart-card">
              <MonthlyPracticeChart :data="chartData" />
            </div>
          </div>
        </div>

        <!-- Accuracy Trend Card - List View -->
        <div class="analytics-card trend-card">
          <div class="card-header">
            <div class="card-title-row">
              <h3><i class="bi bi-bar-chart-line"></i> 正確率趨勢</h3>
            </div>
            <div class="card-controls">
              <!-- Search/Filter -->
              <div class="search-filter">
                <i class="bi bi-search"></i>
                <input type="text" v-model="trendSearch" placeholder="搜尋考卷名稱、年度 (如 114、113)..." class="search-input">
              </div>
              <!-- Sort Options -->
              <div class="sort-control">
                <label>排序：</label>
                <select v-model="trendSort">
                  <option value="date-desc">最新優先</option>
                  <option value="date-asc">最舊優先</option>
                  <option value="accuracy-desc">正確率高→低</option>
                  <option value="accuracy-asc">正確率低→高</option>
                  <option value="delta-desc">進步幅度大→小</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="displayedTrend.length" class="trend-list">
            <div class="trend-list-header">
              <span class="col-name">考卷名稱</span>
              <span class="col-accuracy">正確率</span>
              <span class="col-delta">與前次比較</span>
              <span class="col-date">測驗日期</span>
              <span class="col-action">操作</span>
            </div>
            <div v-for="(item, index) in displayedTrend" :key="item.key" class="trend-item clickable-row"
              :class="{ 'glow-pulse': glowTarget === item.key }"
              @click="drillToPractice(item)" title="點擊前往練習">
              <div class="col-name">
                <span class="trend-rank">{{ (trendPage - 1) * trendPageSize + index + 1 }}</span>
                <div class="trend-info">
                  <span class="trend-title">{{ item.exam_name || '未命名考卷' }}</span>
                  <span class="trend-subject" v-if="item.subject">{{ item.subject }}</span>
                </div>
              </div>
              <div class="col-accuracy">
                <div class="accuracy-bar-container">
                  <div class="accuracy-bar" :style="{ width: item.accuracy + '%' }"
                    :class="getAccuracyClass(item.accuracy)"></div>
                </div>
                <span class="accuracy-value" :class="getAccuracyClass(item.accuracy)">{{ item.accuracy }}%</span>
              </div>
              <div class="col-delta">
                <span v-if="item.delta !== null"
                  :class="['delta-badge', { up: item.delta > 0, down: item.delta < 0, neutral: item.delta === 0 }]">
                  <i
                    :class="item.delta > 0 ? 'bi bi-arrow-up' : item.delta < 0 ? 'bi bi-arrow-down' : 'bi bi-dash'"></i>
                  {{ item.delta > 0 ? '+' : '' }}{{ item.delta }}%
                </span>
                <span v-else class="delta-badge new">首次</span>
              </div>
              <div class="col-date">{{ formatDate(item.date) }}</div>
              <div class="col-action trend-action">
                <i class="bi bi-arrow-right-circle"></i>
              </div>
            </div>
          </div>
          <div v-else class="empty-chart">
            <i class="bi bi-inbox"></i>
            <p>{{ trendSearch ? '找不到符合的測驗記錄' : '尚無測驗記錄' }}</p>
          </div>

          <!-- Pagination for trend -->
          <div v-if="filteredTrend.length > trendPageSize" class="pagination-controls">
            <span class="pagination-info">共 {{ filteredTrend.length }} 筆記錄</span>
            <div class="pagination-buttons">
              <button class="btn-page" :disabled="trendPage === 1" @click="trendPage = 1" title="第一頁">
                <i class="bi bi-chevron-double-left"></i>
              </button>
              <button class="btn-page" :disabled="trendPage === 1" @click="trendPage--">
                <i class="bi bi-chevron-left"></i>
              </button>
              <span class="page-info">{{ trendPage }} / {{ trendTotalPages }}</span>
              <button class="btn-page" :disabled="trendPage >= trendTotalPages" @click="trendPage++">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button class="btn-page" :disabled="trendPage >= trendTotalPages" @click="trendPage = trendTotalPages"
                title="最後一頁">
                <i class="bi bi-chevron-double-right"></i>
              </button>
            </div>
            <select v-model="trendPageSize" class="page-size-select">
              <option :value="5">5 筆/頁</option>
              <option :value="10">10 筆/頁</option>
              <option :value="20">20 筆/頁</option>
              <option :value="50">50 筆/頁</option>
            </select>
          </div>
        </div>

        <div class="analytics-grid">
          <!-- Recent Results Card with Tabs -->
          <div class="analytics-card results-card">
            <div class="card-header">
              <div class="card-title-row">
                <h3><i class="bi bi-clock-history"></i> 最近測驗記錄</h3>
              </div>
              <div class="results-tabs">
                <button :class="{ active: resultsTab === 'all' }" @click="resultsTab = 'all'">全部</button>
                <button :class="{ active: resultsTab === 'passed' }" @click="resultsTab = 'passed'">及格</button>
                <button :class="{ active: resultsTab === 'failed' }" @click="resultsTab = 'failed'">待加強</button>
              </div>
            </div>
            <div v-if="paginatedResults.length > 0" class="results-table">
              <div class="results-table-header">
                <span class="rtbl-rank">#</span>
                <span class="rtbl-name">考卷名稱</span>
                <span class="rtbl-score">分數</span>
                <span class="rtbl-date">測驗時間</span>
                <span class="rtbl-action"></span>
              </div>
              <div v-for="(result, index) in paginatedResults" :key="result.id" class="results-table-row clickable-row"
                :class="{ 'row-pass': result.score >= 60, 'row-fail': result.score < 60 }"
                @click="goToExam(result)" title="點擊前往此考卷">
                <div class="rtbl-rank">
                  <span class="rank-badge" :class="result.score >= 60 ? 'pass' : 'fail'">
                    {{ (resultsPage - 1) * resultsPageSize + index + 1 }}
                  </span>
                </div>
                <div class="rtbl-name">
                  <div class="name-content">
                    <span class="exam-name">{{ result.exam_name }}</span>
                    <span class="status-tag" :class="result.score >= 60 ? 'pass' : 'fail'">
                      {{ result.score >= 60 ? '及格' : '待加強' }}
                    </span>
                  </div>
                </div>
                <div class="rtbl-score">
                  <div class="score-display">
                    <div class="score-bar-container">
                      <div class="score-bar" :style="{ width: result.score + '%' }"
                        :class="result.score >= 80 ? 'high' : result.score >= 60 ? 'medium' : 'low'"></div>
                    </div>
                    <span class="score-num" :class="result.score >= 60 ? 'pass' : 'fail'">{{ result.score }}分</span>
                  </div>
                </div>
                <div class="rtbl-date">
                  <i class="bi bi-calendar3"></i>
                  {{ formatDate(result.completed_at) }}
                </div>
                <div class="rtbl-action">
                  <i class="bi bi-arrow-right-circle"></i>
                </div>
              </div>
            </div>
            <div v-else class="empty-results">
              <i class="bi bi-journal-x"></i>
              <p>尚無測驗記錄</p>
            </div>

            <!-- Pagination for results -->
            <div v-if="filteredResults.length > resultsPageSize" class="pagination-controls compact">
              <span class="pagination-info">共 {{ filteredResults.length }} 筆</span>
              <div class="pagination-buttons">
                <button class="btn-page" :disabled="resultsPage === 1" @click="resultsPage--">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <span class="page-info">{{ resultsPage }} / {{ resultsTotalPages }}</span>
                <button class="btn-page" :disabled="resultsPage >= resultsTotalPages" @click="resultsPage++">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Top Wrong Items Card with Pagination -->
          <div class="analytics-card wrong-card">
            <div class="card-header">
              <div class="card-title-row">
                <h3><i class="bi bi-exclamation-triangle"></i> 常錯題目</h3>
              </div>
              <div class="card-controls">
                <div class="search-filter small">
                  <i class="bi bi-search"></i>
                  <input type="text" v-model="wrongSearch" placeholder="搜尋..." class="search-input">
                </div>
                <div class="sort-control">
                  <select v-model="wrongSort">
                    <option value="count-desc">錯誤次數多→少</option>
                    <option value="count-asc">錯誤次數少→多</option>
                    <option value="name-asc">名稱 A-Z</option>
                  </select>
                </div>
              </div>
            </div>
            <div v-if="displayedWrong.length" class="hot-list">
              <div v-for="(item, index) in displayedWrong" :key="item.key" class="hot-item"
                :class="{ 'glow-pulse': glowTarget === item.key }" @click="goToWrongQuestions(item)"
                title="點擊前往錯題本查看此題">
                <div class="hot-left">
                  <div class="hot-rank">{{ (wrongPage - 1) * wrongPageSize + index + 1 }}</div>
                  <div class="hot-info">
                    <div class="hot-title">{{ item.label }}</div>
                    <div class="hot-tag">{{ item.tag }}</div>
                  </div>
                </div>
                <div class="hot-right">
                  <div class="hot-count">
                    <i class="bi bi-x-lg"></i> {{ item.count }} 次
                  </div>
                  <i class="bi bi-arrow-right-circle hot-arrow"></i>
                </div>
              </div>
            </div>
            <div v-else class="empty-results">
              <i class="bi bi-emoji-smile"></i>
              <p>{{ wrongSearch ? '找不到符合的錯題' : '目前沒有常錯統計' }}</p>
            </div>

            <!-- Pagination for wrong items -->
            <div v-if="filteredWrong.length > wrongPageSize" class="pagination-controls compact">
              <span class="pagination-info">共 {{ filteredWrong.length }} 筆</span>
              <div class="pagination-buttons">
                <button class="btn-page" :disabled="wrongPage === 1" @click="wrongPage--">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <span class="page-info">{{ wrongPage }} / {{ wrongTotalPages }}</span>
                <button class="btn-page" :disabled="wrongPage >= wrongTotalPages" @click="wrongPage++">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" @click="$router.push('/practice')">
            <i class="bi bi-play-fill"></i> 前往練習
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '@/stores/examStore'
import ActivityHeatmap from '@/components/charts/ActivityHeatmap.vue'
import AccuracyTrendChart from '@/components/charts/AccuracyTrendChart.vue'
import MonthlyPracticeChart from '@/components/charts/MonthlyPracticeChart.vue'

const loading = ref(true)
const examStore = useExamStore()
const stats = ref({
  total_answered: 0, correct_answered: 0, total_bank: 0, exam_count: 0,
  average_score: 0, accuracy: 0, accuracy_trend: [], top_wrong: [], wrong_count: 0
})
const recentResults = ref([])
const glowTarget = ref(null)
const router = useRouter()

// Trend state
const trendPage = ref(1)
const trendPageSize = ref(10)
const trendSearch = ref('')
const trendSort = ref('date-desc')

// Wrong items state
const wrongPage = ref(1)
const wrongPageSize = 10
const wrongSearch = ref('')
const wrongSort = ref('count-desc')

// Results state
const resultsPage = ref(1)
const resultsPageSize = 5
const resultsTab = ref('all')

// Aggregate exam results by date for charts
const chartData = computed(() => {
  const dataMap = new Map()

  recentResults.value.forEach(result => {
    const dateStr = result.completed_at?.split('T')[0]
    if (!dateStr) return

    const existing = dataMap.get(dateStr) || { date: dateStr, attempts: 0, correct: 0, total: 0 }
    existing.attempts += 1
    existing.correct += result.correct_count || 0
    existing.total += result.total_count || 0
    dataMap.set(dateStr, existing)
  })

  // Convert to array and calculate accuracy
  return Array.from(dataMap.values())
    .map(item => ({
      date: item.date,
      attempts: item.attempts,
      correct: item.correct,
      accuracy: item.total > 0 ? Math.round(item.correct / item.total * 100 * 10) / 10 : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
})

// Weekly stats with comparison metrics
const weeklyStats = computed(() => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  
  // Filter results by time period
  const thisWeekResults = recentResults.value.filter(r => {
    const date = new Date(r.completed_at)
    return date >= oneWeekAgo
  })
  
  const lastWeekResults = recentResults.value.filter(r => {
    const date = new Date(r.completed_at)
    return date >= twoWeeksAgo && date < oneWeekAgo
  })
  
  // Calculate this week's questions answered
  const thisWeekQuestions = thisWeekResults.reduce((sum, r) => sum + (r.total_count || 0), 0)
  const lastWeekQuestions = lastWeekResults.reduce((sum, r) => sum + (r.total_count || 0), 0)
  
  // Calculate accuracy comparison
  const thisWeekCorrect = thisWeekResults.reduce((sum, r) => sum + (r.correct_count || 0), 0)
  const thisWeekTotal = thisWeekResults.reduce((sum, r) => sum + (r.total_count || 0), 0)
  const lastWeekCorrect = lastWeekResults.reduce((sum, r) => sum + (r.correct_count || 0), 0)
  const lastWeekTotal = lastWeekResults.reduce((sum, r) => sum + (r.total_count || 0), 0)
  
  const thisWeekAccuracy = thisWeekTotal > 0 ? (thisWeekCorrect / thisWeekTotal * 100) : 0
  const lastWeekAccuracy = lastWeekTotal > 0 ? (lastWeekCorrect / lastWeekTotal * 100) : 0
  const accuracyChange = lastWeekTotal > 0 ? Math.round((thisWeekAccuracy - lastWeekAccuracy) * 10) / 10 : null
  
  // Calculate streak days (consecutive days with activity)
  const dates = chartData.value.map(d => d.date).sort().reverse()
  let streakDays = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)
  
  for (const dateStr of dates) {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    const diffDays = Math.round((checkDate - date) / (24 * 60 * 60 * 1000))
    
    if (diffDays <= 1) {
      streakDays++
      checkDate = date
    } else {
      break
    }
  }
  
  // Weekly improvement (extra questions vs last week)
  const weeklyImprovement = thisWeekQuestions - (lastWeekQuestions > 0 ? lastWeekQuestions : 0)
  const improvementPercent = lastWeekQuestions > 0 
    ? Math.round((weeklyImprovement / lastWeekQuestions) * 100) 
    : null
  
  return {
    questionsChange: thisWeekQuestions > 0 ? thisWeekQuestions : null,
    accuracyChange,
    streakDays,
    streakRecord: Math.max(streakDays, dates.length > 0 ? dates.length : 0),
    weeklyImprovement: Math.max(0, weeklyImprovement),
    improvementPercent: improvementPercent > 0 ? improvementPercent : null
  }
})


// Process trend data
const processedTrend = computed(() => {
  const trend = stats.value.accuracy_trend || []
  const map = new Map()
  trend.forEach((entry) => {
    const key = entry.exam_id || entry.exam_name || entry.id || entry.index
    if (!map.has(key)) {
      map.set(key, { ...entry, key, previous: null })
    } else {
      const current = map.get(key)
      if (current.previous === null) current.previous = current.accuracy
      current.accuracy = entry.accuracy
      current.date = entry.date || entry.completed_at || current.date
      map.set(key, current)
    }
  })
  return Array.from(map.values()).map(item => ({
    ...item,
    delta: item.previous === null ? null : Math.round((item.accuracy - item.previous) * 10) / 10
  }))
})

// Filter and sort trend
const filteredTrend = computed(() => {
  let items = [...processedTrend.value]

  // Search filter
  if (trendSearch.value.trim()) {
    const search = trendSearch.value.toLowerCase()
    items = items.filter(item => {
      const name = (item.exam_name || '').toLowerCase()
      const subject = (item.subject || '').toLowerCase()
      return name.includes(search) || subject.includes(search)
    })
  }

  // Sort
  switch (trendSort.value) {
    case 'date-asc':
      items.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      break
    case 'accuracy-desc':
      items.sort((a, b) => b.accuracy - a.accuracy)
      break
    case 'accuracy-asc':
      items.sort((a, b) => a.accuracy - b.accuracy)
      break
    case 'delta-desc':
      items.sort((a, b) => (b.delta || 0) - (a.delta || 0))
      break
    default: // date-desc
      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }

  return items
})

const trendTotalPages = computed(() => Math.ceil(filteredTrend.value.length / trendPageSize.value) || 1)
const displayedTrend = computed(() => {
  const start = (trendPage.value - 1) * trendPageSize.value
  return filteredTrend.value.slice(start, start + trendPageSize.value)
})

// Reset page when filter/sort/pageSize changes
watch([trendSearch, trendSort, trendPageSize], () => { trendPage.value = 1 })

// Process wrong items
const allWrongItems = computed(() => {
  const list = stats.value.top_wrong || []
  return list.map((item, idx) => ({
    key: item.exam_id || item.question_id || idx,
    exam_id: item.exam_id,
    question_id: item.question_id,
    label: item.exam_name || item.question_content || '未命名',
    tag: item.question_subject || '考卷',
    count: item.wrong_count ?? item.count ?? 0
  }))
})

// Filter and sort wrong items
const filteredWrong = computed(() => {
  let items = [...allWrongItems.value]

  // Search filter
  if (wrongSearch.value.trim()) {
    const search = wrongSearch.value.toLowerCase()
    items = items.filter(item => {
      return item.label.toLowerCase().includes(search) || item.tag.toLowerCase().includes(search)
    })
  }

  // Sort
  switch (wrongSort.value) {
    case 'count-asc':
      items.sort((a, b) => a.count - b.count)
      break
    case 'name-asc':
      items.sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'))
      break
    default: // count-desc
      items.sort((a, b) => b.count - a.count)
  }

  return items
})

const wrongTotalPages = computed(() => Math.ceil(filteredWrong.value.length / wrongPageSize) || 1)
const displayedWrong = computed(() => {
  const start = (wrongPage.value - 1) * wrongPageSize
  return filteredWrong.value.slice(start, start + wrongPageSize)
})

watch([wrongSearch, wrongSort], () => { wrongPage.value = 1 })

// Filtered and paginated results
const filteredResults = computed(() => {
  if (resultsTab.value === 'passed') return recentResults.value.filter(r => r.score >= 60)
  if (resultsTab.value === 'failed') return recentResults.value.filter(r => r.score < 60)
  return recentResults.value
})

const resultsTotalPages = computed(() => Math.ceil(filteredResults.value.length / resultsPageSize) || 1)
const paginatedResults = computed(() => {
  const start = (resultsPage.value - 1) * resultsPageSize
  return filteredResults.value.slice(start, start + resultsPageSize)
})

watch(resultsTab, () => { resultsPage.value = 1 })

// Helper for backwards compat
const topWrongItems = computed(() => displayedWrong.value)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

const getAccuracyClass = (accuracy) => {
  if (accuracy >= 80) return 'high'
  if (accuracy >= 60) return 'medium'
  return 'low'
}

const loadData = async () => {
  loading.value = true
  try {
      const [statsRes, resultsRes] = await Promise.all([
        examStore.getExamStats(),
        examStore.getExamResults()
      ])
    stats.value = statsRes.data
    recentResults.value = resultsRes.data || []
  } catch (error) {
    console.error('Failed to load analytics:', error)
  } finally {
    loading.value = false
  }
}

const triggerGlow = (key) => {
  glowTarget.value = key
  setTimeout(() => { if (glowTarget.value === key) glowTarget.value = null }, 900)
}

const drillToPractice = (item) => {
  triggerGlow(item.key)
  if (item.exam_id) {
    router.push({ name: 'ExamPreview', params: { id: item.exam_id } })
    return
  }
  router.push({ path: '/practice', query: { focus: item.question_id || item.key } })
}

// Navigate to exam preview from recent results
const goToExam = (result) => {
  if (result.exam_id || result.exam) {
    router.push({ name: 'ExamPreview', params: { id: result.exam_id || result.exam } })
  }
}

// Navigate to 錯題本 with focus on specific question
const goToWrongQuestions = (item) => {
  triggerGlow(item.key)
  // Navigate to practice page's wrong questions tab with focus parameter
  router.push({
    path: '/practice',
    query: {
      tab: 'wrong',
      focus: item.question_id || item.key
    }
  })
}

onMounted(loadData)
</script>

<style scoped>
.analytics-view {
  min-height: calc(100vh - 140px);
  background: var(--bg-soft, #f8fafc);
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.analytics-header {
  text-align: center;
  margin-bottom: 32px;
}

.analytics-header h2 {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.analytics-header h2 i {
  color: var(--primary);
}

.header-subtitle {
  color: var(--text-secondary);
  margin-top: 6px;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
}

/* Overview Cards */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-elegant);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.overview-card:hover .overview-icon {
  transform: scale(1.1);
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 20px;
  transition: transform 0.3s ease;
}

.overview-icon.blue {
  background: var(--icon-blue-bg);
  color: var(--icon-blue-fg);
}

.overview-icon.green {
  background: var(--icon-green-bg);
  color: var(--icon-green-fg);
}

.overview-icon.purple {
  background: var(--icon-purple-bg);
  color: var(--icon-purple-fg);
}

.overview-icon.amber {
  background: var(--icon-amber-bg);
  color: var(--icon-amber-fg);
}

.overview-content {
  display: flex;
  flex-direction: column;
}

.overview-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.overview-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.overview-change {
  font-size: 12px;
  margin-top: 4px;
}

.overview-change.positive {
  color: #059669;
}

.overview-change.negative {
  color: #dc2626;
}

.overview-change.neutral {
  color: var(--text-secondary);
}

.analytics-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: var(--shadow-elegant);
  border: 1px solid var(--glass-border);
  margin-bottom: 20px;
}

/* Charts Section */
.charts-section {
  margin-bottom: 24px;
}

.heatmap-card {
  margin-bottom: 20px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  margin-bottom: 0;
}

@media (max-width: 900px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}


.card-header {
  margin-bottom: 16px;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.card-header h3 i {
  color: var(--primary);
  font-size: 18px;
}

/* Card Controls */
.card-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  flex: 1;
  min-width: 200px;
}

.search-filter.small {
  min-width: 120px;
  flex: 0;
}

.search-filter i {
  color: #94a3b8;
  font-size: 14px;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: #94a3b8;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-control label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.sort-control select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
  color: var(--text-primary);
}

/* Trend List View */
.trend-list {
  margin-top: 12px;
}

.trend-list-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 60px;
  gap: 12px;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.trend-item {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 60px;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e6e8ed;
  border-radius: 10px;
  margin-bottom: 8px;
  align-items: center;
  transition: all 0.2s;
  background: #fff;
}

.trend-item.clickable-row {
  cursor: pointer;
}

.trend-item.clickable-row:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(71, 105, 150, 0.12);
  transform: translateX(4px);
}

/* Trend action arrow - hidden until hover */
.trend-action {
  text-align: center;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  font-size: 18px;
}

.trend-item.clickable-row:hover .trend-action {
  opacity: 1;
  color: var(--primary);
}

.col-name {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}

.trend-rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #2563eb;
  font-weight: 700;
  font-size: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.trend-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trend-subject {
  font-size: 12px;
  color: var(--text-secondary);
}

.col-accuracy {
  display: flex;
  align-items: center;
  gap: 10px;
}

.accuracy-bar-container {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.accuracy-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.accuracy-bar.high {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.accuracy-bar.medium {
  background: linear-gradient(90deg, #eab308, #ca8a04);
}

.accuracy-bar.low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.accuracy-value {
  font-weight: 700;
  font-size: 14px;
  min-width: 45px;
}

.accuracy-value.high {
  color: #16a34a;
}

.accuracy-value.medium {
  color: #ca8a04;
}

.accuracy-value.low {
  color: #dc2626;
}

.col-delta,
.col-date,
.col-action {
  text-align: center;
}

.col-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.delta-badge.up {
  background: #ecfdf5;
  color: #059669;
}

.delta-badge.down {
  background: #fef2f2;
  color: #dc2626;
}

.delta-badge.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.delta-badge.new {
  background: #eff6ff;
  color: #2563eb;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--primary);
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.empty-chart,
.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  text-align: center;
}

.empty-chart i,
.empty-results i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e6e8ed;
  flex-wrap: wrap;
}

.pagination-controls.compact {
  justify-content: center;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.pagination-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-page {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-size: 12px;
}

.btn-page:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: center;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
}

.analytics-grid .analytics-card {
  margin-bottom: 0;
}

/* Hot List (Wrong Items) */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.hot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin: 0 10px;
  border: 1px solid #e6e8ed;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-item:hover {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
}

.hot-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.hot-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
  font-weight: 800;
  font-size: 13px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.hot-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.hot-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hot-tag {
  font-size: 12px;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hot-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.hot-count {
  font-weight: 700;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  background: #fef2f2;
  padding: 6px 12px;
  border-radius: 20px;
  flex-shrink: 0;
}

.hot-arrow {
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s, transform 0.2s;
  font-size: 18px;
}

.hot-item:hover .hot-arrow {
  opacity: 1;
  color: #dc2626;
  transform: translateX(4px);
}

/* Results */
.results-tabs {
  display: flex;
  gap: 6px;
}

.results-tabs button {
  padding: 6px 14px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.results-tabs button:hover {
  background: #f8fafc;
}

.results-tabs button.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

/* Results Table */
.results-table {
  margin-top: 12px;
}

.results-table-header {
  display: grid;
  grid-template-columns: 50px 1fr 140px 100px 40px;
  gap: 12px;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.results-table-row {
  display: grid;
  grid-template-columns: 50px 1fr 140px 100px 40px;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e6e8ed;
  border-radius: 10px;
  margin-bottom: 8px;
  align-items: center;
  transition: all 0.2s;
  background: #fff;
}

.results-table-row.clickable-row {
  cursor: pointer;
}

.results-table-row.clickable-row:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.12);
  transform: translateX(4px);
}

.rtbl-action {
  text-align: center;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.results-table-row.clickable-row:hover .rtbl-action {
  opacity: 1;
  color: var(--primary);
}

.results-table-row:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.1);
}

.results-table-row.row-pass:hover {
  border-color: #34d399;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.12);
}

.results-table-row.row-fail:hover {
  border-color: #fca5a5;
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.1);
}

.rtbl-rank {
  text-align: center;
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 12px;
  display: inline-grid;
  place-items: center;
}

.rank-badge.pass {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #059669;
}

.rank-badge.fail {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
}

.rtbl-name {
  min-width: 0;
}

.name-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.exam-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-tag.pass {
  background: #ecfdf5;
  color: #059669;
}

.status-tag.fail {
  background: #fef2f2;
  color: #dc2626;
}

.rtbl-score {
  min-width: 0;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-bar-container {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.score-bar.high {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.score-bar.medium {
  background: linear-gradient(90deg, #eab308, #ca8a04);
}

.score-bar.low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.score-num {
  font-weight: 700;
  font-size: 14px;
  min-width: 40px;
  text-align: right;
}

.score-num.pass {
  color: #059669;
}

.score-num.fail {
  color: #dc2626;
}

.rtbl-date {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.rtbl-date i {
  font-size: 12px;
  opacity: 0.7;
}

/* Results card responsive */
@media (max-width: 640px) {
  .results-table-header {
    grid-template-columns: 40px 1fr 80px 30px;
  }

  .results-table-header .rtbl-date {
    display: none;
  }

  .results-table-row {
    grid-template-columns: 40px 1fr 80px 30px;
  }

  .results-table-row .rtbl-date {
    display: none;
  }

  .score-bar-container {
    display: none;
  }

  .rtbl-action {
    opacity: 1;
  }
}

/* Action Buttons */
.action-buttons {
  text-align: center;
  margin-top: 24px;
}

.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.35);
}

/* Glow Animation */
.glow-pulse {
  position: relative;
  animation: glow 0.9s ease-out;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35);
  }

  100% {
    box-shadow: 0 0 0 12px rgba(37, 99, 235, 0);
  }
}

/* ========== RESPONSIVE DESIGN ========== */

/* Tablet & Mobile */
@media (max-width: 1024px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .overview-cards {
    grid-template-columns: 1fr; /* Single column for mobile to prevent squishing */
    gap: 12px;
  }

  .overview-card {
    padding: 16px;
    gap: 12px;
  }

  .overview-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .overview-value {
    font-size: 20px;
  }

  .analytics-card {
    padding: 16px;
  }

  .card-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filter {
    min-width: 100%;
  }

  .trend-list-header {
    display: none;
  }

  .trend-item {
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .trend-item .col-delta {
    display: none;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 12px;
  }
}

/* Dark Mode Overrides */
:global(.dark) .overview-card,
:global(.dark) .analytics-card,
:global(.dark) .trend-card,
:global(.dark) .results-card,
:global(.dark) .wrong-card,
:global(.dark) .chart-card,
:global(.dark) .heatmap-card {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .trend-item,
:global(.dark) .results-table-row,
:global(.dark) .hot-item {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .trend-item:hover,
:global(.dark) .results-table-row:hover,
:global(.dark) .hot-item:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .trend-list-header,
:global(.dark) .results-table-header {
    background: var(--surface-muted) !important;
    color: var(--text-secondary) !important;
    border-color: var(--border) !important;
}

:global(.dark) .search-filter,
:global(.dark) .sort-control select {
    background: var(--surface-muted) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .accuracy-bar-container,
:global(.dark) .score-bar-container,
:global(.dark) .progress-bar {
    background: var(--surface-muted) !important;
}

:global(.dark) .results-tabs button {
    color: var(--text-secondary) !important;
    background: transparent !important;
}

:global(.dark) .results-tabs button.active {
    color: var(--primary) !important;
    background: var(--primary-soft) !important;
}

:global(.dark) .pagination-controls {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .btn-page {
    background: var(--surface-muted) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .overview-icon.blue,
:global(.dark) .overview-icon.green,
:global(.dark) .overview-icon.purple,
:global(.dark) .overview-icon.amber {
    opacity: 0.9;
}
</style>
