<template>
  <div class="ai-chat-interface">
    <!-- Remove the duplicate header since it's now handled by the parent component -->
    <div class="chat-tabs">
      <button :class="{ active: currentTab === 'chat' }" @click="setTab('chat')">即時對話</button>
      <button :class="{ active: currentTab === 'history' }" @click="setTab('history')">歷史記錄</button>
    </div>

    <div v-if="currentTab === 'chat'" class="chat-panel">
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>
        <div v-if="isLoading" class="message assistant">
          <div class="message-content">
            <div class="message-text typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button v-if="errorMessage.includes('使用限制')" @click="goToSubscription" class="btn-upgrade">
          升級至進階版
        </button>
      </div>

      <div class="chat-input-container" :style="{ minHeight: inputContainerHeight + 'px' }">
        <div class="resize-handle-top" @mousedown="startResize" @touchstart="startResize"></div>
        <textarea
          ref="chatInputRef"
          v-model="inputMessage"
          @keydown.enter.exact.prevent="handleSend"
          @keydown.enter.shift.exact.prevent="insertNewline"
          @keydown.ctrl.enter.prevent="handleSend"
          placeholder="輸入您的問題..."
          class="chat-input"
          :disabled="isLoading"
        ></textarea>
        <button
          @click="handleSend"
          class="btn-send"
          :disabled="!inputMessage.trim() || isLoading"
          title="發送"
        >
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
    </div>

    <div v-else-if="currentTab === 'history'" class="history-panel">
      <div class="history-toolbar">
        <button class="btn-refresh" @click="refreshHistory" :disabled="isHistoryLoading">
          重新整理
        </button>
      </div>
      <div v-if="isHistoryLoading" class="history-placeholder">載入中...</div>
      <div v-else-if="!historyItems.length" class="history-placeholder">尚無對話記錄</div>
      <div v-else class="history-list">
        <div v-for="item in historyItems" :key="item.id" class="history-item">
          <div class="history-question">
            <strong>Q</strong>
            <span v-html="formatMessage(item.message)"></span>
          </div>
          <div v-if="item.response" class="history-answer">
            <strong>A</strong>
            <span v-html="formatMessage(item.response)"></span>
          </div>
          <div class="history-meta">{{ formatTime(item.created_at) }}</div>
          <div class="history-actions">
            <button class="history-reuse" @click="reuseHistory(item)">引用此題</button>
            <button class="history-edit" @click="editHistory(item)">編輯並重問</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useChatStore } from '@/stores/chatStore'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const props = defineProps({
  prefill: {
    type: Object,
    default: () => ({ text: '', stamp: 0 })
  }
})

// Use store state
const { messages, historyItems, isLoading, isHistoryLoading, errorMessage } = storeToRefs(chatStore)

// Local state
const inputMessage = ref(props.prefill?.text || '')
const messagesContainer = ref(null)
const chatInputRef = ref(null)
// Use local state for internal tabs to avoid conflict with parent page's tab query
const currentTab = ref('chat')

const setTab = (tab) => {
  currentTab.value = tab
}

const applyPrefill = () => {
  if (!props.prefill) return

  inputMessage.value = props.prefill.text || ''
  setTab('chat')

  const shouldFocus = Boolean(props.prefill.text) || Number(props.prefill.stamp || 0) > 0
  if (!shouldFocus) return

  nextTick(() => {
    if (chatInputRef.value) {
      const length = inputMessage.value.length
      chatInputRef.value.focus()
      chatInputRef.value.setSelectionRange(length, length)
    }
  })
}

watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// Scroll to bottom when switching to chat tab
watch(currentTab, (newTab) => {
  if (newTab === 'chat') {
    nextTick(() => {
      scrollToBottom()
    })
  }
})

watch(() => [props.prefill?.stamp, props.prefill?.text], applyPrefill, { immediate: true })

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleSend = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  chatStore.clearError()

  try {
    await chatStore.sendMessage(userMessage)
  } catch (error) {
    console.error('AI chat error:', error)
  }
}

const clearChat = () => {
  if (confirm('確定要清除所有對話記錄嗎？')) {
    chatStore.clearMessages()
  }
}

const formatMessage = (text = '') => {
  if (!text) return ''
  return DOMPurify.sanitize(marked.parse(text))
}

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const goToSubscription = () => {
  router.push('/subscription')
}

const reuseHistory = (entry) => {
  inputMessage.value = entry.message || ''
  setTab('chat')
  nextTick(() => {
    chatInputRef.value?.focus()
  })
}

const editHistory = (entry) => {
  // Pre-fill with previous question and add placeholder for additional input
  inputMessage.value = (entry.message || '') + '\n\n[補充說明]: '
  setTab('chat')
  nextTick(() => {
    if (chatInputRef.value) {
      chatInputRef.value.focus()
      // Position cursor at the end
      const length = inputMessage.value.length
      chatInputRef.value.setSelectionRange(length, length)
    }
  })
}

const refreshHistory = () => {
  chatStore.refreshHistory()
}

// Insert newline for Shift+Enter
const insertNewline = () => {
  const textarea = chatInputRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = inputMessage.value
  inputMessage.value = value.substring(0, start) + '\n' + value.substring(end)
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + 1
  })
}

// Resize handle for input container
const inputContainerHeight = ref(120)
const isResizing = ref(false)
const startY = ref(0)
const startHeight = ref(0)

const startResize = (e) => {
  isResizing.value = true
  startY.value = e.touches ? e.touches[0].clientY : e.clientY
  startHeight.value = inputContainerHeight.value
  document.body.style.cursor = 'ns-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchmove', onResize)
  document.addEventListener('touchend', stopResize)
}

const onResize = (e) => {
  if (!isResizing.value) return
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  const delta = startY.value - clientY  // Dragging up increases height
  const newHeight = Math.max(80, Math.min(400, startHeight.value + delta))
  inputContainerHeight.value = newHeight
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchmove', onResize)
  document.removeEventListener('touchend', stopResize)
}

onMounted(async () => {
  await chatStore.initialize()
  // Ensure we scroll to bottom after history loads
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style scoped>
.ai-chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  color: #2c3e50;
  border-radius: 0;
  box-shadow: none;
}

/* Removed .chat-header styles since we removed the header */

.chat-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.chat-tabs button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.chat-tabs button.active {
  background: var(--surface-muted);
  color: var(--primary);
  font-weight: 600;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--bg-page);
}

.message {
  display: flex;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  margin-left: auto;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: 14px 18px;
  border-radius: 18px;
  position: relative;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.message.user .message-content {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: #fff;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.typing {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing span {
  width: 6px;
  height: 6px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: typing 1.4s infinite;
  opacity: 0.5;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.error-message {
  padding: 12px 20px;
  background: #fee;
  color: #c33;
  border-top: 1px solid #fcc;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.btn-upgrade {
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.btn-upgrade:hover {
  background: var(--primary-hover);
}

.chat-input-container {
  display: flex;
  flex-direction: column;
  padding: 8px 16px 16px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  position: relative;
}

.resize-handle-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 2;
}

.resize-handle-top:hover {
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.15), transparent);
}

.resize-handle-top::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  transition: background 0.2s;
}

.resize-handle-top:hover::after {
  background: #3b82f6;
}

.chat-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
}

.chat-input-container > .chat-input {
  flex: 1;
  width: 100%;
  padding: 14px;
  padding-right: 60px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
}

.chat-input-container > .btn-send {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1;
}

.chat-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.chat-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  color: #666;
}

.btn-send {
  width: 40px;
  height: 40px;
  padding: 0;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-send:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.btn-send:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.history-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  gap: 12px;
  background: var(--bg-page);
  color: var(--text-primary);
  min-height: 0;
  overflow: hidden;
}

.history-toolbar {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn-refresh {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #2c3e50;
  cursor: pointer;
}

.history-placeholder {
  text-align: center;
  color: #6b7280;
  padding: 40px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.history-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  background: var(--surface);
}

.history-question,
.history-answer {
  display: flex;
  gap: 8px;
  line-height: 1.5;
  color: #1f2937;
}

.history-answer {
  margin-top: 8px;
}

.history-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.history-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.history-reuse,
.history-edit {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.history-reuse {
  background: var(--primary);
  color: #fff;
}

.history-reuse:hover {
  background: var(--primary-hover);
}

.history-edit {
  background: #f3f4f6;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.history-edit:hover {
  background: #e5e7eb;
}

.chat-messages::-webkit-scrollbar,
.history-list::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.history-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* ========== RESPONSIVE DESIGN ========== */

/* Tablet 平板 */
@media (max-width: 1024px) {
  .chat-messages {
    padding: 20px;
  }
  .message {
    max-width: 85%;
  }
  .chat-input-container {
    padding: 14px 16px;
  }
  .history-panel {
    padding: 14px 16px;
  }
}

/* Mobile 手機 */
@media (max-width: 768px) {
  .chat-tabs {
    padding: 10px 12px;
    gap: 6px;
  }
  
  .chat-tabs button {
    padding: 8px 10px;
    font-size: 14px;
  }
  
  .chat-messages {
    padding: 16px 12px;
    gap: 16px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .message-content {
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 16px;
  }
  
  .message.user .message-content {
    border-bottom-right-radius: 4px;
  }
  
  .message.assistant .message-content {
    border-bottom-left-radius: 4px;
  }
  
  .message-time {
    font-size: 10px;
  }
  
  .error-message {
    padding: 10px 12px;
    font-size: 13px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .btn-upgrade {
    width: 100%;
    padding: 8px 12px;
  }
  
  .chat-input-container {
    padding: 12px;
    gap: 8px;
    flex-direction: column;
  }
  
  .chat-input {
    padding: 12px;
    font-size: 14px;
    min-height: 80px;
  }
  
  .btn-send {
    width: 100%;
    padding: 12px 20px;
    font-size: 15px;
  }
  
  .history-panel {
    padding: 12px;
  }
  
  .history-toolbar {
    justify-content: center;
  }
  
  .btn-refresh {
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .history-item {
    padding: 12px;
  }
  
  .history-question,
  .history-answer {
    font-size: 14px;
    flex-direction: column;
    gap: 6px;
  }
  
  .history-question strong,
  .history-answer strong {
    font-size: 12px;
    color: var(--primary);
  }
  
  .history-meta {
    font-size: 11px;
  }
  
  .history-actions {
    flex-direction: column;
  }

  .history-reuse,
  .history-edit {
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .chat-messages::-webkit-scrollbar,
  .history-list::-webkit-scrollbar {
    width: 4px;
  }
}

/* Small Mobile 小螢幕手機 */
@media (max-width: 480px) {
  .chat-tabs {
    padding: 8px 10px;
  }
  
  .chat-tabs button {
    padding: 6px 8px;
    font-size: 13px;
  }
  
  .chat-messages {
    padding: 12px 8px;
  }
  
  .message {
    max-width: 95%;
  }
  
  .message-content {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .chat-input-container {
    padding: 10px;
  }
  
  .chat-input {
    padding: 10px;
    font-size: 13px;
    min-height: 70px;
  }
  
  .btn-send {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .history-panel {
    padding: 10px 8px;
  }
  
  .history-item {
    padding: 10px;
  }
  
  .history-question,
  .history-answer {
    font-size: 13px;
  }
}

/* Landscape Mobile 橫向手機 */
@media (max-width: 768px) and (orientation: landscape) {
  .chat-input-container {
    flex-direction: row;
  }
  
  .chat-input {
    min-height: 60px;
  }
  
  .btn-send {
    width: auto;
    min-width: 80px;
  }
}
</style>
