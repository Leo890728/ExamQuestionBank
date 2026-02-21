<template>
  <div class="essay-analysis-view">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="btn-new-chat" @click="startNewChat">
          <i class="bi bi-plus-lg"></i> 新對話
        </button>
      </div>

      <div class="sidebar-content">
        <div v-if="isHistoryLoading" class="sidebar-loading">
          <span>載入中...</span>
        </div>
        <div v-else-if="!historyItems.length" class="sidebar-empty">
          <span>尚無解析記錄</span>
        </div>
        <div v-else class="history-list">
          <div v-for="item in historyItems" :key="item.id" class="history-item-wrapper">
            <div class="history-item" :class="{ active: activeHistoryId === item.id }" @click="loadHistoryItem(item)">
              <i class="bi bi-chat-left-text"></i>
              <span class="history-title">{{ truncate(item.question_text, 30) }}</span>
            </div>
            <button class="history-edit-btn" @click.stop="editHistoryItem(item)" title="編輯並重問">
              <i class="bi bi-pencil"></i>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="chat-container">
        <!-- Messages Area -->
        <div class="messages-area" ref="messagesContainer">
          <!-- Empty State -->
          <div v-if="!messages.length" class="welcome-section">
            <div class="welcome-icon">
              <i class="bi bi-file-earmark-font"></i>
            </div>
            <h1>AI 申論解析</h1>
            <p class="welcome-subtitle">貼上申論題目，AI 幫你分析可能涉及的法條、學說與實務見解</p>

            <div class="feature-grid">
              <div class="feature-box">
                <i class="bi bi-search"></i>
                <div class="feature-text">
                  <span class="feature-title">爭點分析</span>
                  <span class="feature-desc">精準識別題目中的法律爭點</span>
                </div>
              </div>
              <div class="feature-box">
                <i class="bi bi-mortarboard"></i>
                <div class="feature-text">
                  <span class="feature-title">學說實務</span>
                  <span class="feature-desc">整理學說與實務見解對比</span>
                </div>
              </div>
              <div class="feature-box">
                <i class="bi bi-diagram-3"></i>
                <div class="feature-text">
                  <span class="feature-title">答題架構</span>
                  <span class="feature-desc">三段論法完整答題示範</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <template v-else>
            <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">
              <div class="message-wrapper">
                <div class="message-avatar">
                  <i v-if="msg.role === 'user'" class="bi bi-person-fill"></i>
                  <i v-else class="bi bi-robot"></i>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">{{ msg.role === 'user' ? '你' : 'AI 助手' }}</span>
                  </div>
                  <div class="message-text" v-html="formatMessage(msg.content)"></div>
                  <div v-if="msg.role === 'assistant'" class="message-actions">
                    <button class="btn-action" @click="copyMessage(msg.content)" title="複製">
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="message-row assistant">
              <div class="message-wrapper">
                <div class="message-avatar">
                  <i class="bi bi-robot"></i>
                </div>
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="error-banner">
          <i class="bi bi-exclamation-triangle"></i>
          {{ errorMessage }}
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <div class="input-container">
            <textarea v-model="inputText" @keydown.enter.ctrl.prevent="handleAnalyze"
              @keydown.enter.exact.prevent="handleAnalyze" @keydown.enter.shift.exact.prevent="insertNewline"
              placeholder="提出任何問題..." rows="1" :disabled="isLoading" ref="inputRef"></textarea>
            <button @click="handleAnalyze" :disabled="!inputText.trim() || isLoading" class="btn-submit">
              <i class="bi bi-arrow-up"></i>
            </button>
          </div>
          <p class="input-hint">AI 申論解析，提供答題架構參考</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEssayAnalysisStore } from '@/stores/essayAnalysisStore'

const store = useEssayAnalysisStore()
const { messages, historyItems, isLoading, isHistoryLoading, errorMessage } = storeToRefs(store)

const inputText = ref('')
const messagesContainer = ref(null)
const inputRef = ref(null)
const activeHistoryId = ref(null)

// Auto-resize textarea
watch(inputText, () => {
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
      inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 200) + 'px'
    }
  })
})

const handleAnalyze = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  const text = inputText.value.trim()
  inputText.value = ''
  store.clearError()
  try {
    await store.analyze(text)
    nextTick(() => scrollToBottom())
  } catch (e) {
    console.error(e)
  }
}

const insertNewline = () => {
  if (inputRef.value) {
    const start = inputRef.value.selectionStart
    const end = inputRef.value.selectionEnd
    inputText.value = inputText.value.substring(0, start) + '\n' + inputText.value.substring(end)
    nextTick(() => {
      inputRef.value.selectionStart = inputRef.value.selectionEnd = start + 1
    })
  }
}

const startNewChat = () => {
  store.clearMessages()
  activeHistoryId.value = null
}

const loadHistoryItem = (item) => {
  activeHistoryId.value = item.id
  store.restoreFromHistory(item)
  nextTick(() => scrollToBottom())
}

const editHistoryItem = (item) => {
  activeHistoryId.value = null
  inputText.value = (item.question_text || '') + '\n\n[補充說明]: '
  store.clearMessages()
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      const length = inputText.value.length
      inputRef.value.setSelectionRange(length, length)
    }
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

const formatMessage = (text = '') => {
  if (!text) return ''
  return DOMPurify.sanitize(marked.parse(text))
}
const truncate = (str, len) => str && str.length > len ? str.slice(0, len) + '...' : str

onMounted(() => {
  store.loadHistory()
})
</script>

<style scoped>
.essay-analysis-view {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 150px);
  background: var(--bg-soft, #f8fafc);
  color: var(--text-primary);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 260px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border, #e5e7eb);
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.btn-new-chat {
  width: 100%;
  padding: 12px 16px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.btn-new-chat:hover {
  background: var(--primary-hover);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-loading,
.sidebar-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-item {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 0.15s;
  overflow: hidden;
}

.history-item:hover {
  background: var(--bg-soft, #f3f4f6);
}

.history-item.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.history-item i {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.history-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-edit-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.history-edit-btn:hover {
  background: var(--bg-soft, #f3f4f6);
  color: var(--primary);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 768px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* Messages Area */
.messages-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 0;
  padding-bottom: 140px;
  min-height: 0;
}

/* Welcome Section */
.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  min-width: 64px;
  min-height: 64px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-bottom: 24px;
}

.welcome-icon i {
  font-size: 28px;
  color: #fff;
}

.welcome-section h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.welcome-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 32px 0;
  max-width: 500px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.feature-box {
  background: #fff;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.feature-box:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.feature-box i {
  font-size: 22px;
  color: var(--primary);
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
  align-items: center;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.feature-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Messages */
.message-row {
  padding: 20px 0;
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.message-row:last-child {
  border-bottom: none;
}

.message-wrapper {
  display: flex;
  gap: 16px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  font-size: 16px;
}

.message-row.user .message-avatar {
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  color: #fff;
}

.message-row.assistant .message-avatar {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  margin-bottom: 8px;
}

.message-sender {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.message-text {
  font-size: 15px;
  line-height: 1.75;
  color: var(--text-primary);
  word-wrap: break-word;
}

/* Markdown rendering styles */
.message-text :deep(h2) {
  font-size: 18px;
  font-weight: 700;
  margin: 20px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary, #2563eb);
  color: var(--primary, #2563eb);
}

.message-text :deep(h2:first-child) {
  margin-top: 0;
}

.message-text :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: var(--text-primary);
}

.message-text :deep(ul),
.message-text :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.message-text :deep(blockquote) {
  border-left: 3px solid var(--primary, #2563eb);
  margin: 12px 0;
  padding: 8px 16px;
  background: var(--primary-soft, rgba(37, 99, 235, 0.06));
  border-radius: 0 8px 8px 0;
  font-size: 14px;
}

.message-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid var(--border, #e5e7eb);
  padding: 8px 12px;
  text-align: left;
}

.message-text :deep(th) {
  background: var(--bg-soft, #f8fafc);
  font-weight: 600;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid var(--border, #e5e7eb);
  margin: 16px 0;
}

.message-text :deep(p) {
  margin: 8px 0;
}

.message-text :deep(p:first-child) {
  margin-top: 0;
}

.message-text :deep(code) {
  background: var(--bg-soft, #f1f5f9);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.message-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.btn-action {
  background: transparent;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.15s;
}

.btn-action:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {

  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

/* Error */
.error-banner {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

/* Floating Input Area */
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px 24px;
  background: linear-gradient(to top, var(--bg-soft, #f8fafc) 80%, transparent);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 16px;
  padding: 12px 16px;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.input-container:focus-within {
  border-color: var(--primary);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.15);
}

.input-container textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
  max-height: 200px;
  min-height: 24px;
}

.input-container textarea::placeholder {
  color: var(--text-secondary);
}

.btn-submit {
  width: 36px;
  height: 36px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: scale(1.05);
}

.btn-submit:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin: 12px 0 0 0;
}

/* Scrollbar */
.messages-area::-webkit-scrollbar,
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track,
.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb,
.sidebar-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover,
.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ========== RESPONSIVE ========== */

@media (max-width: 900px) {
  .sidebar {
    width: 220px;
  }

  .chat-container {
    padding: 0 16px;
  }

  .input-area {
    padding: 16px 16px 20px;
  }
}

@media (max-width: 768px) {
  .essay-analysis-view {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 160px;
    border-right: none;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }

  .sidebar-content {
    flex-direction: row;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 12px;
  }

  .history-list {
    flex-direction: row;
    gap: 8px;
  }

  .history-item-wrapper {
    flex-shrink: 0;
  }

  .history-item {
    white-space: nowrap;
  }

  .history-edit-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .main-content {
    flex: 1;
    min-height: 0;
  }

  .welcome-section {
    padding: 20px;
  }

  .welcome-section h1 {
    font-size: 22px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .feature-box {
    flex-direction: row;
    padding: 14px 16px;
    justify-content: flex-start;
  }

  .input-area {
    padding: 12px 12px 16px;
  }
}

@media (max-width: 480px) {
  .chat-container {
    padding: 0 12px;
  }

  .message-wrapper {
    gap: 12px;
  }

  .message-avatar {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .message-text {
    font-size: 14px;
  }

  .input-container {
    padding: 10px 12px;
    border-radius: 12px;
  }

  .input-container textarea {
    font-size: 14px;
  }
}

/* Dark Mode Overrides */
:global(.dark) .sidebar {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .feature-box {
    background: var(--surface) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .feature-box:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .input-container {
    background: var(--surface) !important;
    border-color: var(--border) !important;
}

:global(.dark) .input-container:focus-within {
    border-color: var(--primary) !important;
}

:global(.dark) .input-container textarea {
    color: var(--text-primary) !important;
}

:global(.dark) .history-item:hover {
    background: var(--surface-muted) !important;
}

:global(.dark) .history-item.active {
    background: var(--primary-soft) !important;
}

:global(.dark) .error-banner {
    background: var(--destructive-soft) !important;
    border-color: var(--destructive) !important;
    color: var(--destructive) !important;
}

:global(.dark) .messages-area::-webkit-scrollbar-thumb,
:global(.dark) .sidebar-content::-webkit-scrollbar-thumb {
    background: var(--text-secondary) !important;
}

:global(.dark) .btn-submit:disabled {
    background: var(--surface-muted) !important;
    color: var(--text-secondary) !important;
}

:global(.dark) .message-row {
    border-color: var(--border) !important;
}
</style>
