<template>
  <div class="admin-view">
    <div class="container">
      <div class="admin-header">
        <div class="header-top">
          <div class="header-title-section">
            <h2 class="section-title">管理員後台</h2>
            <p class="section-subtitle">管理測驗、題目、標籤與使用者</p>
          </div>
                    <div class="admin-actions">
            <template v-if="currentTab === 'exams'">
              <button class="action-btn action-btn-secondary" @click="batchImport">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>批次匯入測驗</span>
              </button>
              <button class="action-btn action-btn-primary" @click="addExam">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新增測驗</span>
              </button>
            </template>
            <template v-else-if="currentTab === 'questions'">
              <button class="action-btn action-btn-secondary" @click="importQuestions">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>匯入題目</span>
              </button>
              <button class="action-btn action-btn-primary" @click="addQuestion">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新增題目</span>
              </button>
            </template>
            <template v-else-if="currentTab === 'tags'">
              <button class="action-btn action-btn-primary" @click="addTag">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新增標籤</span>
              </button>
            </template>
            <template v-else-if="currentTab === 'users'">
              <button class="action-btn action-btn-secondary" @click="refreshUsers">
                重新整理
              </button>
            </template>
          </div>
        </div>
                <div class="admin-tabs">
          <button :class="['tab-btn', { active: currentTab === 'exams' }]" @click="setTab('exams')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>測驗管理</span>
          </button>
          <button :class="['tab-btn', { active: currentTab === 'questions' }]" @click="setTab('questions')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>題目管理</span>
          </button>
          <button :class="['tab-btn', { active: currentTab === 'tags' }]" @click="setTab('tags')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>標籤管理</span>
          </button>
          <button :class="['tab-btn', { active: currentTab === 'users' }]" @click="setTab('users')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>使用者</span>
          </button>
        </div>
      </div>

      <!-- Main Content: exams or questions -->
      <div v-if="currentTab === 'exams'">
        <AdminExamManagement ref="adminExamManagementRef" />
      </div>

      <div v-else-if="currentTab === 'questions'">
        <AdminQuestionManagement ref="adminQuestionManagementRef" />
      </div>

      <div v-else-if="currentTab === 'tags'">
        <AdminTagManagement ref="adminTagManagementRef" />
      </div>

      <div v-else-if="currentTab === 'users'">
        <AdminUserManagement ref="adminUserManagementRef" />
      </div>
    </div>
  </div></template>

<script setup>
import { ref } from 'vue'
import AdminQuestionManagement from '@/components/AdminQuestionManagement.vue'
import AdminExamManagement from '@/components/AdminExamManagement.vue'
import AdminTagManagement from '@/components/AdminTagManagement.vue'
import AdminUserManagement from '@/components/AdminUserManagement.vue'

const currentTab = ref('exams')
const adminExamManagementRef = ref(null)
const adminQuestionManagementRef = ref(null)
const adminTagManagementRef = ref(null)
const adminUserManagementRef = ref(null)

const setTab = (tab) => {
  currentTab.value = tab
}

// Exam management functions
const addExam = () => {
  if (adminExamManagementRef.value) {
    adminExamManagementRef.value.addExam()
  }
}

const batchImport = () => {
  if (adminExamManagementRef.value) {
    adminExamManagementRef.value.batchImport()
  }
}

// Question management functions
const addQuestion = () => {
  const event = new CustomEvent('openCreateQuestion')
  window.dispatchEvent(event)
}

const importQuestions = () => {
  if (adminQuestionManagementRef.value && adminQuestionManagementRef.value.showImportModal) {
    adminQuestionManagementRef.value.showImportModal()
  }
}

// Tag management functions
const addTag = () => {
  if (adminTagManagementRef.value && adminTagManagementRef.value.openAddModal) {
    adminTagManagementRef.value.openAddModal()
  }
}

const refreshUsers = () => {
  if (adminUserManagementRef.value && adminUserManagementRef.value.loadUsers) {
    adminUserManagementRef.value.loadUsers()
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* Admin Header */
.admin-header {
  margin-bottom: 32px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-title-section {
  flex: 1;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #1E293B);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 15px;
  color: var(--text-secondary, #64748B);
  margin: 0;
}

/* Action Buttons */
.admin-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn svg {
  flex-shrink: 0;
}

.action-btn-primary {
  background: var(--primary, #476996);
  color: white;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.action-btn-primary:hover {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.3);
}

.action-btn-secondary {
  background: #f3f4f6;
  color: var(--text-secondary, #64748B);
}

.action-btn-secondary:hover {
  background: #e5e7eb;
  color: var(--text-primary, #1E293B);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: #f3f4f6;
  border-radius: 12px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary, #64748B);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn svg {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary, #1E293B);
  background: rgba(255, 255, 255, 0.5);
}

.tab-btn:hover svg {
  opacity: 1;
}

.tab-btn.active {
  background: white;
  color: var(--primary, #476996);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-btn.active svg {
  opacity: 1;
}

/* Responsive */
@media (max-width: 1024px) {
  .header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .section-title {
    font-size: 24px;
  }

  .section-subtitle {
    font-size: 14px;
  }

  .admin-tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 16px;
    font-size: 14px;
  }

  .tab-btn span {
    display: none;
  }

  .admin-actions {
    width: 100%;
    justify-content: space-between;
  }

  .action-btn span {
    display: none;
  }

  .action-btn {
    padding: 10px 14px;
  }
}

/* Dark Mode Overrides */
:global(.dark) .admin-tabs {
    background: var(--surface-muted) !important;
}

:global(.dark) .tab-btn.active {
    background: var(--surface) !important;
    color: var(--primary) !important;
}

:global(.dark) .tab-btn:hover {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
}

:global(.dark) .action-btn-secondary {
    background: var(--surface-muted) !important;
    color: var(--text-secondary) !important;
}

:global(.dark) .action-btn-secondary:hover {
    background: var(--surface) !important;
    color: var(--text-primary) !important;
}
</style>


















