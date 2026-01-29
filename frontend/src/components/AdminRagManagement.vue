<template>
  <div class="admin-rag-management">
    <!-- Embedding Stats Section -->
    <div class="rag-section">
      <h3 class="section-heading">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        向量嵌入狀態
      </h3>
      
      <div class="stats-grid" v-if="!loadingStats">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_questions || 0 }}</div>
          <div class="stat-label">總題目數</div>
        </div>
        <div class="stat-card embedded">
          <div class="stat-value">{{ stats.embedded_questions || 0 }}</div>
          <div class="stat-label">已嵌入</div>
        </div>
        <div class="stat-card pending">
          <div class="stat-value">{{ stats.unembedded_questions || 0 }}</div>
          <div class="stat-label">待處理</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ embeddingPercentage }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </div>
      
      <div class="loading-skeleton" v-else>
        <div class="skeleton-box"></div>
        <div class="skeleton-box"></div>
        <div class="skeleton-box"></div>
        <div class="skeleton-box"></div>
      </div>

      <!-- Progress bar -->
      <div class="progress-container" v-if="stats.total_questions > 0">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: embeddingPercentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Embedding Actions Section -->
    <div class="rag-section">
      <h3 class="section-heading">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        嵌入操作
      </h3>

      <div class="action-cards">
        <div class="action-card">
          <div class="action-info">
            <h4>生成所有未嵌入題目的向量</h4>
            <p>使用 OpenAI text-embedding-3-small 模型為所有未處理的題目生成向量嵌入</p>
          </div>
          <button 
            class="action-btn action-btn-primary" 
            @click="embedAllMissing"
            :disabled="embedding || stats.unembedded_questions === 0"
          >
            <svg v-if="!embedding" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
            <span v-if="embedding" class="spinner"></span>
            {{ embedding ? '處理中...' : '開始嵌入' }}
          </button>
        </div>
      </div>

      <!-- Embedding Progress -->
      <div class="embedding-progress" v-if="embedding || embedResult">
        <div class="progress-info" v-if="embedding">
          <span class="spinner"></span>
          <span>正在生成嵌入，請稍候...</span>
        </div>
        <div class="result-info" v-if="embedResult && !embedding">
          <div class="result-stats">
            <span class="success">✓ 成功：{{ embedResult.processed }}</span>
            <span class="failed" v-if="embedResult.failed > 0">✗ 失敗：{{ embedResult.failed }}</span>
          </div>
          <div class="result-errors" v-if="embedResult.errors && embedResult.errors.length > 0">
            <details>
              <summary>查看錯誤 ({{ embedResult.errors.length }})</summary>
              <ul>
                <li v-for="(err, idx) in embedResult.errors.slice(0, 10)" :key="idx">{{ err }}</li>
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Concept Groups Section -->
    <div class="rag-section">
      <h3 class="section-heading">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        概念群組管理
      </h3>

      <div class="info-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>MVP 版本說明</strong>
          <p>概念群組目前可透過相似度搜尋手動建立。自動聚類功能將於後續版本提供。</p>
        </div>
      </div>

      <div class="concept-groups-list" v-if="conceptGroups.length > 0">
        <div class="concept-group-card" v-for="group in conceptGroups" :key="group.id">
          <div class="group-header">
            <span class="group-name">{{ group.name || '未命名群組' }}</span>
            <span class="important-badge" v-if="group.is_important">重要考點</span>
          </div>
          <div class="group-meta">
            <span>{{ group.question_count }} 題</span>
            <span v-if="group.year_min && group.year_max">{{ group.year_min }}-{{ group.year_max }}</span>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <p>尚無概念群組</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ragService from '@/services/ragService'

const stats = ref({})
const loadingStats = ref(true)
const embedding = ref(false)
const embedResult = ref(null)
const conceptGroups = ref([])

const embeddingPercentage = computed(() => {
  if (!stats.value.total_questions) return 0
  return Math.round((stats.value.embedded_questions / stats.value.total_questions) * 100)
})

const loadStats = async () => {
  try {
    loadingStats.value = true
    const { data } = await ragService.getEmbeddingStats()
    stats.value = data || {}
  } catch (error) {
    console.error('Failed to load embedding stats:', error)
  } finally {
    loadingStats.value = false
  }
}

const loadConceptGroups = async () => {
  try {
    const { data } = await ragService.getConceptGroups({ pageSize: 10 })
    conceptGroups.value = data?.results || []
  } catch (error) {
    console.error('Failed to load concept groups:', error)
  }
}

const embedAllMissing = async () => {
  try {
    embedding.value = true
    embedResult.value = null
    const { data } = await ragService.embedQuestions({ allMissing: true, batchSize: 50 })
    embedResult.value = data
    // Reload stats after embedding
    await loadStats()
  } catch (error) {
    console.error('Embedding failed:', error)
    embedResult.value = { processed: 0, failed: 0, errors: [error.message] }
  } finally {
    embedding.value = false
  }
}

onMounted(() => {
  loadStats()
  loadConceptGroups()
})
</script>

<style scoped>
.admin-rag-management {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rag-section {
  background: var(--surface, white);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border, #e5e7eb);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
  margin: 0 0 20px 0;
}

.section-heading svg {
  color: var(--primary, #476996);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: var(--surface-muted, #f8fafc);
  border-radius: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #1E293B);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary, #64748B);
  margin-top: 4px;
}

.stat-card.embedded .stat-value {
  color: var(--success, #10b981);
}

.stat-card.pending .stat-value {
  color: var(--warning, #f59e0b);
}

/* Progress Bar */
.progress-container {
  margin-top: 20px;
}

.progress-bar {
  height: 8px;
  background: var(--surface-muted, #f1f5f9);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary, #476996), var(--primary-hover, #35527a));
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Action Cards */
.action-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--surface-muted, #f8fafc);
  border-radius: 10px;
  gap: 16px;
}

.action-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.action-info p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

.action-btn {
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

.action-btn-primary {
  background: var(--primary, #476996);
  color: white;
}

.action-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Embedding Progress */
.embedding-progress {
  margin-top: 16px;
  padding: 16px;
  background: var(--surface-muted, #f8fafc);
  border-radius: 8px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary, #64748B);
}

.progress-info .spinner {
  border-color: rgba(71, 105, 150, 0.3);
  border-top-color: var(--primary, #476996);
}

.result-stats {
  display: flex;
  gap: 16px;
}

.result-stats .success {
  color: var(--success, #10b981);
  font-weight: 500;
}

.result-stats .failed {
  color: var(--error, #ef4444);
  font-weight: 500;
}

.result-errors {
  margin-top: 12px;
}

.result-errors summary {
  cursor: pointer;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
}

.result-errors ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: var(--error, #ef4444);
}

/* Info Box */
.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(71, 105, 150, 0.08);
  border-radius: 8px;
  border-left: 3px solid var(--primary, #476996);
}

.info-box svg {
  flex-shrink: 0;
  color: var(--primary, #476996);
}

.info-box strong {
  display: block;
  margin-bottom: 4px;
  color: var(--text-primary, #1E293B);
}

.info-box p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

/* Concept Groups */
.concept-groups-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.concept-group-card {
  padding: 14px 16px;
  background: var(--surface-muted, #f8fafc);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-name {
  font-weight: 500;
  color: var(--text-primary, #1E293B);
}

.important-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--warning, #f59e0b);
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.group-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary, #64748B);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary, #64748B);
}

/* Loading Skeleton */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-box {
  height: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 10px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid, .loading-skeleton {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Dark Mode */
:global(.dark) .rag-section {
  background: var(--surface);
  border-color: var(--border);
}

:global(.dark) .stat-card,
:global(.dark) .action-card,
:global(.dark) .embedding-progress,
:global(.dark) .concept-group-card {
  background: var(--surface-muted);
}
</style>
