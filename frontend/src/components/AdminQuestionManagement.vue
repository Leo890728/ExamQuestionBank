<template>
  <div class="question-admin">
    <!-- Question Filters -->
    <div class="question-filters-wrapper">
      <QuestionFilterPanel v-model="filters" :tags="tagOptions" :loading="isLoading"
        :total-count="paginationState.totalCount" :show-title="false" @search="applyFilters" @reset="resetFilters" />

      <!-- Ordering Filter -->
      <div class="ordering-filter">
        <div class="filter-select-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" class="select-icon">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <select v-model="ordering" class="filter-select" @change="applyFilters">
            <option value="-created_at">最新建立</option>
            <option value="created_at">最舊建立</option>
            <option value="-updated_at">最近更新</option>
            <option value="content">題目內容 A-Z</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Pending Questions Section -->
    <div v-if="pendingQuestions.length > 0" class="pending-section">
      <div class="pending-header">
        <div class="header-icon">
          <input type="checkbox" :checked="isAllPendingSelected" @change="toggleSelectAllPending" title="全選/取消全選"
            style="width: 18px; height: 18px; cursor: pointer;" />
        </div>
        <div class="header-content">
          <h3 class="pending-title">暫存題目</h3>
          <p class="pending-subtitle">
            共 {{ pendingQuestions.length }} 題
            <span v-if="selectedPendingIds.length > 0">（已選 {{ selectedPendingIds.length }} 題）</span>
          </p>
        </div>
        <div class="header-actions">
          <button v-if="selectedPendingIds.length > 0" class="btn-bulk-edit-pending"
            @click="openBulkSubjectModalForPending" title="批量編輯科目">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            編輯科目
          </button>
          <button v-if="selectedPendingIds.length > 0" class="btn-bulk-edit-pending" @click="openBulkTagModalForPending"
            title="批量編輯標籤">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            編輯標籤
          </button>
          <button class="btn-clear-pending" @click="clearPendingQuestions">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            清除全部
          </button>
          <button class="btn-save-pending" @click="savePendingQuestions" :disabled="isSavingPending">
            <svg v-if="!isSavingPending" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div v-else class="pending-spinner"></div>
            {{ isSavingPending ? `儲存中... (${savingPendingProgress}/${pendingQuestions.length})` : '儲存全部' }}
          </button>
        </div>
      </div>

      <div class="pending-list">
        <div v-for="(item, index) in pendingQuestions" :key="`pending-${index}`" class="pending-item">
          <input type="checkbox" :checked="selectedPendingIds.includes(index)"
            @change="toggleSelectPending(index, $event.target.checked)" class="pending-checkbox" />
          <div class="pending-number">{{ index + 1 }}</div>
          <div class="pending-content">
            <div class="pending-text">{{ item.content }}</div>
            <div class="pending-meta">
              <span class="meta-badge">{{ item.subject }}</span>
              <span class="meta-badge">{{ item.category }}</span>
              <span v-if="item.options && item.options.length > 0" class="meta-info">{{ item.options.length }} 選項</span>
              <span v-if="getCorrectAnswer(item)" class="meta-badge meta-answer">答案: {{ getCorrectAnswer(item) }}</span>
            </div>
          </div>
          <div class="pending-actions">
            <button class="btn-edit-pending" @click="editPendingQuestion(index)" title="編輯">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-remove-pending" @click="removePendingQuestion(index)" title="移除">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Question List using AdminDataList -->
    <AdminDataList ref="adminDataListRef" type="question" :items="questions" :loading="isLoading"
      :total-count="paginationState.totalCount" :show-header="false" :show-pagination="true" item-unit="題"
      empty-text="暫無符合條件的題目" empty-hint="嘗試調整篩選條件或新增題目" :current-page="currentPage" :page-size="pageSize"
      :pagination-state="paginationState" @update:selected-ids="handleSelectionChange" @view="handleViewQuestion"
      @edit="handleEditQuestion" @delete="handleDeleteQuestion" @tag-click="addTagToFilter"
      @page-change="handlePageChange" @size-change="handleSizeChange">
      <!-- Custom item actions -->
      <template #item-actions="{ item }">
        <button class="action-btn action-btn-view" @click="viewQuestion(item.id)" title="檢視">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="action-btn action-btn-edit" @click="openEditQuestion(item.id)" title="編輯">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="action-btn action-btn-info" @click="viewAssociatedExams(item.id, item.content)" title="查看關聯考卷">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </button>
        <button class="action-btn action-btn-delete" @click="deleteQuestion(item.id)" title="刪除"
          :disabled="deletingId === item.id">
          <svg v-if="deletingId !== item.id" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <div v-else class="action-spinner"></div>
        </button>
      </template>

      <!-- Custom selection toolbar actions -->
      <template #selection-actions="{ selectedIds, clearSelection }">
        <button class="toolbar-btn toolbar-btn-primary" @click="openAddToExamModal" title="加入到考卷">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <span>加入考卷</span>
        </button>

        <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkTagModal" title="批次編輯標籤">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <span>編輯標籤</span>
        </button>

        <button class="toolbar-btn toolbar-btn-secondary" @click="openBulkSubjectModal" title="批次編輯科目">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>編輯科目</span>
        </button>

        <div class="toolbar-divider"></div>

        <button class="toolbar-btn toolbar-btn-danger" @click="deleteSelectedQuestions" :disabled="isDeleting"
          title="批量刪除">
          <div v-if="isDeleting" class="toolbar-spinner"></div>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>{{ isDeleting ? '刪除中...' : '刪除' }}</span>
        </button>
      </template>
    </AdminDataList>

    <div v-if="isEditorVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content modern-modal">
          <div class="modern-modal-header">
            <div class="header-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <div class="header-content-wrapper">
              <h5 class="modern-modal-title">{{ currentQuestion ? '編輯題目' : '新增題目' }}</h5>
              <p class="modern-modal-subtitle">{{ currentQuestion ? '修改題目資訊' : '填寫題目資訊並選擇儲存方式' }}</p>
            </div>
            <button type="button" class="modern-close-btn" @click="closeEditor" :disabled="saving">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body modern-modal-body">
            <QuestionEditor ref="questionEditorRef" :question="currentQuestion" :saving="saving" @save="handleSave"
              @save-pending="handleSaveToPendingFromEditor" @save-direct="handleSaveDirectlyFromEditor" />
          </div>
          <div class="modern-modal-footer" v-if="!currentQuestion">
            <div class="footer-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>選擇儲存方式：直接儲存到題庫或暫存後批次儲存</span>
            </div>
            <div class="footer-actions">
              <button class="footer-btn footer-btn-secondary" @click="closeEditor" :disabled="saving">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                取消
              </button>
              <button class="footer-btn footer-btn-pending" @click="handleSaveToPending"
                :disabled="saving || !isEditorFormValid">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                加入暫存
              </button>
              <button class="footer-btn footer-btn-primary" @click="handleSaveDirectly"
                :disabled="saving || !isEditorFormValid">
                <svg v-if="!saving" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <div v-else class="btn-spinner-small"></div>
                {{ saving ? '儲存中...' : '直接儲存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Associated Exams Modal -->
    <div v-if="isViewExamsModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">題目關聯考卷</h5>
            <button type="button" class="btn-close" @click="closeViewExamsModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label fw-semibold">題目內容</label>
              <p class="text-break">{{ currentQuestionContent }}</p>
            </div>
            <div>
              <label class="form-label fw-semibold">關聯考卷</label>
              <div v-if="isLoadingAssociatedExams" class="text-center">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">加載中...</span>
                </div>
              </div>
              <div v-else-if="associatedExams.length === 0" class="alert alert-info small">
                此題目未關聯到任何考卷
              </div>
              <div v-else class="list-group">
                <div v-for="exam in associatedExams" :key="exam.id" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">{{ exam.name }}</h6>
                      <small class="text-muted">ID: {{ exam.id }}</small>
                    </div>
                    <span class="badge bg-secondary">{{ exam.question_count || 0 }} 題</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeViewExamsModal">關閉</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to Exam Modal -->
    <div v-if="isAddToExamModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">加入到考卷</h5>
            <button type="button" class="btn-close" @click="closeAddToExamModal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" role="alert">
              將 {{ selectedCount }} 題加入到選定的考卷
            </div>
            <div class="mb-3">
              <label class="form-label">選擇考卷</label>
              <multiselect v-model="selectedExams" :options="availableExams" :loading="isLoadingExams" :multiple="true"
                :close-on-select="false" placeholder="搜尋或選擇考卷..." track-by="id" label="name" :searchable="true" />
            </div>
            <div v-if="selectedExams.length > 0" class="alert alert-secondary small">
              <div><strong>已選擇 {{ selectedExams.length }} 個考卷：</strong></div>
              <ul class="mb-0 mt-2">
                <li v-for="exam in selectedExams" :key="exam.id" class="small">
                  {{ exam.name }} (ID: {{ exam.id }} | 現有題數: {{ exam.question_count || 0 }})
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeAddToExamModal">取消</button>
            <button type="button" class="btn btn-primary" @click="addQuestionsToExam"
              :disabled="selectedExams.length === 0 || isAddingToExam">
              <span v-if="isAddingToExam" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              {{ isAddingToExam ? '加入中...' : '確認加入' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Edit Modals -->
    <BulkTagEditor v-if="showBulkTagModal" :questions="bulkEditMode === 'list' ? questions : []"
      :pendingQuestions="bulkEditMode === 'pending' ? pendingQuestions : []"
      :preselectedIds="bulkEditMode === 'list' ? selectedIds : []"
      :preselectedPendingIds="bulkEditMode === 'pending' ? selectedPendingIds : []" @close="closeBulkTagModal"
      @applied="handleBulkTagsApplied" />

    <BulkSubjectEditor v-if="showBulkSubjectModal" :questions="bulkEditMode === 'list' ? questions : []"
      :pendingQuestions="bulkEditMode === 'pending' ? pendingQuestions : []"
      :preselectedIds="bulkEditMode === 'list' ? selectedIds : []"
      :preselectedPendingIds="bulkEditMode === 'pending' ? selectedPendingIds : []" @close="closeBulkSubjectModal"
      @applied="handleBulkSubjectApplied" />

    <!-- Delete Confirmation Modal -->
    <div v-if="isDeleteConfirmModalVisible" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">確認刪除</h5>
            <button type="button" class="btn-close" @click="closeDeleteConfirmModal" :disabled="isDeleting"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger mb-3" role="alert">
              <strong>⚠️ 警告：此操作無法復原</strong>
            </div>
            <div class="mb-3">
              <p class="mb-2">您將刪除 <strong>{{ selectedCount }} 題</strong>。</p>
              <div v-if="isLoadingAffectedExams" class="text-center my-3">
                <div class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">加載中...</span>
                </div>
              </div>
              <div v-else-if="affectedExamsForDelete.length > 0" class="alert alert-warning small">
                <p class="mb-2"><strong>這些題目涉及 {{ affectedExamsForDelete.length }} 份考卷：</strong></p>
                <ul class="mb-0">
                  <li v-for="exam in affectedExamsForDelete" :key="exam.id">
                    {{ exam.name }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDeleteConfirmModal" :disabled="isDeleting">
              取消
            </button>
            <button type="button" class="btn btn-danger" @click="confirmDelete"
              :disabled="isDeleting || isLoadingAffectedExams">
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status"
                aria-hidden="true"></span>
              {{ isDeleting ? '刪除中...' : '確認刪除' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5);">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content modern-modal">
          <div class="modern-modal-header">
            <div class="header-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div class="header-content-wrapper">
              <h5 class="modern-modal-title">匯入題目</h5>
              <p class="modern-modal-subtitle">選擇匯入方式並上傳檔案</p>
            </div>
            <button type="button" class="modern-close-btn" @click="closeImportModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body modern-modal-body">
            <div class="import-steps">
              <button type="button" class="step-item" :class="{ active: importStep >= 1, current: importStep === 1 }"
                @click="goToImportStep(1)">
                <span class="step-index">1</span>
                <span class="step-label">選擇方式</span>
              </button>
              <div class="step-divider"></div>
              <button type="button" class="step-item" :class="{ active: importStep >= 2, current: importStep === 2 }"
                :disabled="importStep < 2" @click="goToImportStep(2)">
                <span class="step-index">2</span>
                <span class="step-label">上傳檔案</span>
              </button>
              <div class="step-divider"></div>
              <button type="button" class="step-item" :class="{ active: importStep >= 3, current: importStep === 3 }"
                :disabled="importStep < 3" @click="goToImportStep(3)">
                <span class="step-index">3</span>
                <span class="step-label">匯入結果</span>
              </button>
            </div>

            <!-- Step 1: Choose type -->
            <div v-if="importStep === 1" class="import-step">
              <div class="import-options">
                <div class="import-option" @click="selectImportType('json')">
                  <div class="option-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                  </div>
                  <div class="option-content">
                    <h6 class="option-title">JSON 檔案</h6>
                    <p class="option-description">匯入結構化的 JSON 格式題目檔案</p>
                    <div class="option-hint">建議格式: .json</div>
                  </div>
                  <div class="option-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>

                <div class="import-option" @click="selectImportType('pdf')">
                  <div class="option-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div class="option-content">
                    <h6 class="option-title">PDF 檔案</h6>
                    <p class="option-description">適合由考題 PDF 自動解析</p>
                    <div class="option-hint">建議格式: .pdf</div>
                  </div>
                  <div class="option-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Upload -->
            <div v-else-if="importStep === 2" class="import-step">
              <div class="import-step-header">
                <div class="step-title">上傳 {{ importTypeLabel }} 檔案</div>
                <button type="button" class="link-btn" @click="goToImportStep(1)">更換匯入方式</button>
              </div>

              <!-- JSON Import Section -->
              <div v-if="importType === 'json'" class="import-section">
                <div class="upload-zone" @click="$refs.jsonFileInput.click()" @dragover.prevent
                  @drop.prevent="handleJsonDrop">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p class="upload-text">點擊或拖曳檔案到此</p>
                  <p class="upload-hint">支援 JSON 格式</p>
                  <input ref="jsonFileInput" type="file" accept=".json,application/json" style="display: none"
                    @change="handleJsonFileSelect" />
                </div>
                <div v-if="selectedJsonFile" class="selected-file">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  <span>{{ selectedJsonFile.name }}</span>
                  <button @click="clearJsonFile" class="btn-clear-file">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- PDF Import Section -->
              <div v-else-if="importType === 'pdf'" class="import-section">
                <PdfUploadSection ref="pdfUploadRef" :show-result="false" :show-header="false" @preview-ready="handlePdfPreview"
                  @error="handlePdfError" />
                <div v-if="pdfErrorMessage" class="import-alert import-alert-error">
                  {{ pdfErrorMessage }}
                </div>
              </div>
            </div>

            <!-- Step 3: Result -->
            <div v-else-if="importStep === 3" class="import-step">
              <div class="import-result-card">
                <div class="import-result-header">
                  <div class="import-result-title">匯入結果預覽</div>
                  <div class="import-result-subtitle">
                    {{ importTypeLabel }} ・共 {{ previewQuestions.length }} 題
                  </div>
                </div>
                <div class="import-result-body">
                  <div class="import-info-grid">
                    <div class="import-info-item">
                      <div class="import-info-label">題數</div>
                      <div class="import-info-value">{{ previewQuestions.length }}</div>
                    </div>
                    <div class="import-info-item">
                      <div class="import-info-label">科目</div>
                      <div class="import-info-value">{{ importPreview?.examData?.subject || '-' }}</div>
                    </div>
                    <div class="import-info-item">
                      <div class="import-info-label">分類</div>
                      <div class="import-info-value">{{ importPreview?.examData?.category || '-' }}</div>
                    </div>
                  </div>

                  <div v-if="previewQuestions.length" class="import-preview">
                    <div class="import-preview-header">題目預覽（前 {{ Math.min(previewQuestions.length, 5) }} 題）</div>
                    <div class="import-preview-list">
                      <div v-for="(q, i) in previewQuestions.slice(0, 5)" :key="i" class="import-preview-item">
                        <span class="preview-index">{{ i + 1 }}</span>
                        <span class="preview-text">{{ previewText(q) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modern-modal-footer" v-if="importStep === 2 || importStep === 3">
            <div class="footer-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span v-if="importStep === 2">{{ importType === 'pdf' && pdfErrorMessage ? pdfErrorMessage : '上傳完成後可預覽匯入結果' }}</span>
              <span v-else>確認後會將題目加入暫存區</span>
            </div>
            <div class="footer-actions">
              <button class="footer-btn footer-btn-secondary" @click="handleImportBack">
                上一步
              </button>
              <button v-if="importStep === 2" class="footer-btn footer-btn-primary" @click="handleImportNext"
                :disabled="!canProceedStep2">
                {{ importType === 'json' ? (isImporting ? '解析中...' : '下一步') : '前往結果' }}
              </button>
              <button v-else class="footer-btn footer-btn-primary" @click="confirmImport" :disabled="isImporting">
                <svg v-if="!isImporting" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <div v-else class="btn-spinner-small"></div>
                {{ isImporting ? '匯入中...' : '確認匯入' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import questionService from '@/services/questionService'
import examService from '@/services/examService'
import QuestionEditor from '@/components/QuestionEditor.vue'
import BulkTagEditor from '@/components/BulkTagEditor.vue'
import BulkSubjectEditor from '@/components/BulkSubjectEditor.vue'
import PdfUploadSection from '@/components/PdfUploadSection.vue'
import QuestionFilterPanel from '@/components/common/QuestionFilterPanel.vue'
import AdminDataList from '@/components/common/AdminDataList.vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import tagService from '@/services/tagService'

const questions = ref([])
const pendingQuestions = ref([])
const isSavingPending = ref(false)
const savingPendingProgress = ref(0)
const selectedPendingIds = ref([]) // 暫存題目選中的索引
const isLoading = ref(false)
const error = ref('')
const filters = ref({
  subject: '',
  difficulty: '',
  search: '',
  tags: [],
  tag_mode: 'or'
})
const tagOptions = ref([])
const ordering = ref('-created_at')
const currentPage = ref(1)
const pageSize = ref(20)
const paginationState = ref({
  hasNext: false,
  hasPrev: false,
  totalPages: 0,
  totalCount: 0
})
const deletingId = ref(null)
const selectedIds = ref([])
const adminDataListRef = ref(null)

const isEditorVisible = ref(false)
const currentQuestion = ref(null)
const saving = ref(false)
const questionEditorRef = ref(null)
const editingPendingIndex = ref(null) // 追蹤正在編輯的暫存題目索引
const isEditorFormValid = computed(() => {
  return questionEditorRef.value?.isFormValid ?? false
})

// View Associated Exams Modal state
const isViewExamsModalVisible = ref(false)
const currentQuestionId = ref(null)
const currentQuestionContent = ref('')
const associatedExams = ref([])
const isLoadingAssociatedExams = ref(false)

// Add to Exam Modal state
const isAddToExamModalVisible = ref(false)
const selectedExams = ref([])
const availableExams = ref([])
const isLoadingExams = ref(false)
const isAddingToExam = ref(false)
const isDeleting = ref(false)
const showBulkTagModal = ref(false)
const showBulkSubjectModal = ref(false)
const bulkEditMode = ref('list') // 'list' or 'pending' - 標記批量編輯的來源

// Import Modal state
const showImportModal = ref(false)
const importType = ref(null) // 'json' or 'pdf'
const importStep = ref(1)
const importPreview = ref(null)
const pdfErrorMessage = ref('')
const selectedJsonFile = ref(null)
const jsonFileInput = ref(null)
const pdfUploadRef = ref(null)
const isImporting = ref(false)

const importTypeLabel = computed(() => {
  if (importType.value === 'json') return 'JSON'
  if (importType.value === 'pdf') return 'PDF'
  return '匯入'
})

const previewQuestions = computed(() => importPreview.value?.questions || [])

const canProceedStep2 = computed(() => {
  if (importType.value === 'json') {
    return !!selectedJsonFile.value && !isImporting.value
  }
  if (importType.value === 'pdf') {
    return !!importPreview.value && importPreview.value.source === 'pdf' && !pdfErrorMessage.value
  }
  return false
})

const openBulkTagModal = () => {
  bulkEditMode.value = 'list'
  showBulkTagModal.value = true
}

const openBulkSubjectModal = () => {
  bulkEditMode.value = 'list'
  showBulkSubjectModal.value = true
}

const openBulkTagModalForPending = () => {
  bulkEditMode.value = 'pending'
  showBulkTagModal.value = true
}

const openBulkSubjectModalForPending = () => {
  bulkEditMode.value = 'pending'
  showBulkSubjectModal.value = true
}

const closeBulkTagModal = () => {
  showBulkTagModal.value = false
  bulkEditMode.value = 'list'
}

const closeBulkSubjectModal = () => {
  showBulkSubjectModal.value = false
  bulkEditMode.value = 'list'
}

// Affected exams state for delete confirmation
const isDeleteConfirmModalVisible = ref(false)
const affectedExamsForDelete = ref([])
const isLoadingAffectedExams = ref(false)

// Selection helpers
const selectedCount = computed(() => selectedIds.value.length)

const emit = defineEmits(["update:selected-ids"])

// Pending questions selection
const isAllPendingSelected = computed(() => {
  if (pendingQuestions.value.length === 0) return false
  return selectedPendingIds.value.length === pendingQuestions.value.length
})

const toggleSelectPending = (index, checked) => {
  if (checked) {
    if (!selectedPendingIds.value.includes(index)) {
      selectedPendingIds.value.push(index)
    }
  } else {
    selectedPendingIds.value = selectedPendingIds.value.filter(i => i !== index)
  }
}

const toggleSelectAllPending = () => {
  if (isAllPendingSelected.value) {
    selectedPendingIds.value = []
  } else {
    selectedPendingIds.value = pendingQuestions.value.map((_, index) => index)
  }
}

const clearSelection = () => { selectedIds.value = [] }

// Handler methods for AdminDataList component
const handleSelectionChange = (ids) => {
  selectedIds.value = ids
}

const handleViewQuestion = (item) => {
  viewQuestion(item.id)
}

const handleEditQuestion = (item) => {
  openEditQuestion(item.id)
}

const handleDeleteQuestion = (item) => {
  deleteQuestion(item.id)
}

// Emit selection changes to parent
watch(selectedIds, (val) => {
  try { emit('update:selected-ids', val) } catch (e) { /* noop if parent not listening */ }
}, { deep: true })


const normalize = (q) => ({
  id: q.id,
  subject: q.subject || '',
  category: q.category || '',
  question_type: q.question_type || '',
  difficulty: q.difficulty || '',
  tags: q.tags || [],
  contentSnippet: (() => {
    const raw = q.content || ''
    return raw.length > 20 ? raw.slice(0, 20) + '…' : raw
  })(),
  content: q.content || '',
  createdAt: formatDateTime(q.created_at),
  updatedAt: formatDateTime(q.updated_at)
})

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

const fetchQuestions = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    if (filters.value.subject) params.subject = filters.value.subject
    if (filters.value.difficulty) params.difficulty = filters.value.difficulty
    if (filters.value.search?.trim()) params.search = filters.value.search.trim()
    if (ordering.value) params.ordering = ordering.value
    if (filters.value.tags && filters.value.tags.length > 0) {
      params.tags = filters.value.tags.map(t => t.id).join(',')
      params.tag_mode = filters.value.tag_mode
    }
    const { data } = await questionService.getQuestions(params)
    const list = Array.isArray(data) ? data : data.results || []
    questions.value = list.map(normalize)

    // Update pagination state
    if (Array.isArray(data)) {
      paginationState.value = {
        hasNext: false,
        hasPrev: false,
        totalPages: 1,
        totalCount: data.length
      }
    } else {
      const count = data.count || 0
      const totalPages = Math.ceil(count / pageSize.value)
      paginationState.value = {
        hasNext: Boolean(data.next),
        hasPrev: Boolean(data.previous) || currentPage.value > 1,
        totalPages: totalPages || 1,
        totalCount: count
      }
    }
  } catch (err) {
    console.error('Failed to fetch questions', err)
    error.value = err.response?.data?.detail || '取得題目列表失敗'
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => { currentPage.value = 1; fetchQuestions() }
const resetFilters = () => {
  filters.value = {
    subject: '',
    difficulty: '',
    search: '',
    tags: [],
    tag_mode: 'or'
  }
  ordering.value = '-created_at'
  currentPage.value = 1
  fetchQuestions()
}

// Add tag to filter when clicking tag badge
const addTagToFilter = (tag) => {
  // Check if tag is already in the filter
  const alreadySelected = filters.value.tags.some(t => t.id === tag.id)

  if (!alreadySelected) {
    // Add tag to filter
    filters.value.tags.push(tag)
    // Apply filters to search with the new tag
    applyFilters()
  }
}

const handlePageChange = (page) => {
  if (page !== currentPage.value && page >= 1 && page <= paginationState.value.totalPages) {
    currentPage.value = page
    fetchQuestions()
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchQuestions()
}

// load tags
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

onMounted(() => {
  fetchQuestions()
  loadTags()

  // Listen for events from parent component
  window.addEventListener('openCreateQuestion', openCreateQuestion)
  window.addEventListener('refreshQuestions', fetchQuestions)
})

// Clean up event listeners
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('openCreateQuestion', openCreateQuestion)
  window.removeEventListener('refreshQuestions', fetchQuestions)
})

const openEditQuestion = async (id) => {
  try {
    isEditorVisible.value = true
    saving.value = false
    currentQuestion.value = null
    const { data } = await questionService.getQuestion(id)
    currentQuestion.value = data
  } catch (err) {
    console.error('Load question failed', err)
    alert('載入題目失敗')
    isEditorVisible.value = false
  }
}

const openCreateQuestion = () => { currentQuestion.value = null; isEditorVisible.value = true }

const closeEditor = () => { isEditorVisible.value = false; currentQuestion.value = null; saving.value = false }

const handleSave = async ({ questionData }) => {
  // This is called when editing existing question
  try {
    saving.value = true
    if (currentQuestion.value && currentQuestion.value.id) {
      await questionService.updateQuestion(currentQuestion.value.id, questionData)
      alert('題目更新成功')
    } else {
      await questionService.createQuestion(questionData)
      alert('題目建立成功')
    }
    closeEditor()
    fetchQuestions()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗')
  } finally {
    saving.value = false
  }
}

// New: Save directly to database
const handleSaveDirectly = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSaveDirect()
}

// New: Save to pending list
const handleSaveToPending = () => {
  if (!questionEditorRef.value) return
  questionEditorRef.value.requestSavePending()
}

// Called from QuestionEditor when save direct is triggered
const handleSaveDirectlyFromEditor = async ({ questionData }) => {
  try {
    saving.value = true

    // 如果是編輯暫存題目
    if (editingPendingIndex.value !== null) {
      pendingQuestions.value[editingPendingIndex.value] = questionData
      alert('暫存題目已更新')
      closeEditor()
      editingPendingIndex.value = null
      return
    }

    await questionService.createQuestion(questionData)
    alert('題目建立成功')
    closeEditor()
    fetchQuestions()
  } catch (err) {
    console.error('Save question failed', err)
    alert('儲存題目失敗：' + (err.response?.data?.detail || err.message || ''))
  } finally {
    saving.value = false
  }
}

// Called from QuestionEditor when save to pending is triggered
const handleSaveToPendingFromEditor = ({ questionData }) => {
  // 如果是編輯暫存題目，直接更新
  if (editingPendingIndex.value !== null) {
    pendingQuestions.value[editingPendingIndex.value] = questionData
    alert('暫存題目已更新')
    editingPendingIndex.value = null
  } else {
    addPendingQuestion(questionData)
    alert('已加入暫存列表')
  }
  closeEditor()
}

const viewQuestion = async (id) => {
  // For now, reuse openEdit but set view-only (not necessary)
  openEditQuestion(id)
}

const openAddToExamModal = async () => {
  isAddToExamModalVisible.value = true
  selectedExams.value = []
  await loadAvailableExams()
}

const closeAddToExamModal = () => {
  isAddToExamModalVisible.value = false
  selectedExams.value = []
}

const loadAvailableExams = async () => {
  isLoadingExams.value = true
  try {
    const { data } = await examService.getExams({ pageSize: 100 })
    const list = Array.isArray(data) ? data : data.results || []
    availableExams.value = list
    console.log('Loaded exams:', list)
  } catch (err) {
    console.error('Failed to load exams', err)
    alert('載入考卷列表失敗')
  } finally {
    isLoadingExams.value = false
  }
}

const addQuestionsToExam = async () => {
  if (selectedExams.value.length === 0 || selectedCount.value === 0) return

  isAddingToExam.value = true
  try {
    // Add each question to each selected exam
    // According to API docs: POST /exams/{id}/add_question/ with { question, order, points }
    for (const exam of selectedExams.value) {
      for (let i = 0; i < selectedIds.value.length; i++) {
        const questionId = selectedIds.value[i]
        await examService.addQuestionToExam(exam.id, {
          question: questionId,
          order: i + 1
        })
      }
    }

    const examNames = selectedExams.value.map(e => e.name).join('、')
    alert(`成功將 ${selectedCount.value} 題加入到考卷「${examNames}」`)
    closeAddToExamModal()
    clearSelection()
  } catch (err) {
    console.error('Error adding questions to exam', err)
    alert('加入考卷失敗：' + (err.response?.data?.detail || err.message || '請重試'))
  } finally {
    isAddingToExam.value = false
  }
}

const closeViewExamsModal = () => {
  isViewExamsModalVisible.value = false
  currentQuestionId.value = null
  currentQuestionContent.value = ''
  associatedExams.value = []
}

const viewAssociatedExams = async (questionId, content) => {
  isViewExamsModalVisible.value = true
  currentQuestionId.value = questionId
  currentQuestionContent.value = content
  await loadAssociatedExams(questionId)
}

const loadAssociatedExams = async (questionId) => {
  isLoadingAssociatedExams.value = true
  try {
    // Use dedicated API endpoint to get exams containing this question
    const { data } = await examService.getExamsByQuestion(questionId)
    const exams = Array.isArray(data) ? data : data.results || []
    associatedExams.value = exams
    console.log('Associated exams:', exams)
  } catch (err) {
    console.error('Failed to load associated exams', err)
    alert('載入關聯考卷失敗')
  } finally {
    isLoadingAssociatedExams.value = false
  }
}

const deleteQuestion = async (id) => {
  if (!confirm('確定要刪除此題目嗎？')) return
  deletingId.value = id
  try {
    await questionService.deleteQuestion(id)
    // remove from selection if present
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(x => x !== id)
    }
    alert('題目已刪除')
    fetchQuestions()
  } catch (err) {
    console.error('Delete question failed', err)
    alert('刪除題目失敗')
  } finally {
    deletingId.value = null
  }
}

const deleteSelectedQuestions = async () => {
  if (selectedCount.value === 0) return

  // Load affected exams first
  isLoadingAffectedExams.value = true
  try {
    const response = await examService.getExamsByQuestions(selectedIds.value)
    const exams = Array.isArray(response) ? response : response.data ? response.data : []
    console.log('Affected exams:', exams)
    affectedExamsForDelete.value = exams
  } catch (err) {
    console.error('Failed to load affected exams', err)
    affectedExamsForDelete.value = []
  } finally {
    isLoadingAffectedExams.value = false
  }

  // Show confirmation modal
  isDeleteConfirmModalVisible.value = true
}

const closeDeleteConfirmModal = () => {
  isDeleteConfirmModalVisible.value = false
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    const idsToDelete = [...selectedIds.value]
    let successCount = 0
    let failCount = 0

    for (const id of idsToDelete) {
      try {
        await questionService.deleteQuestion(id)
        successCount++
      } catch (err) {
        console.error(`Failed to delete question ${id}`, err)
        failCount++
      }
    }

    selectedIds.value = []
    affectedExamsForDelete.value = []
    isDeleteConfirmModalVisible.value = false

    if (failCount === 0) {
      alert(`成功刪除 ${successCount} 題`)
    } else {
      alert(`成功刪除 ${successCount} 題，失敗 ${failCount} 題`)
    }

    fetchQuestions()
  } catch (err) {
    console.error('Batch delete failed', err)
    alert('批量刪除失敗')
  } finally {
    isDeleting.value = false
  }
}

// Handlers for Bulk Tag/Subject modals
const handleBulkTagsApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount

  // 處理暫存題目的更新
  if (pendingUpdates && pendingUpdates.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined) {
        // 更新暫存題目
        if (pendingQuestions.value[update.index]) {
          pendingQuestions.value[update.index].tags = update.tags || []
          pendingQuestions.value[update.index].tag_ids = update.tag_ids || []
          totalUpdated++
        }
      }
    })
  }

  if (totalUpdated > 0) alert(`成功更新 ${totalUpdated} 題標籤`)
  if (errors && errors.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)

  closeBulkTagModal()
  if (bulkEditMode.value === 'pending') {
    selectedPendingIds.value = []
  } else {
    clearSelection()
    fetchQuestions()
  }
}

const handleBulkSubjectApplied = ({ successCount, errors, pendingUpdates }) => {
  let totalUpdated = successCount

  // 處理暫存題目的更新
  if (pendingUpdates && pendingUpdates.length > 0) {
    pendingUpdates.forEach(update => {
      if (update.index !== undefined) {
        // 更新暫存題目
        if (pendingQuestions.value[update.index]) {
          if (update.subject !== undefined) {
            pendingQuestions.value[update.index].subject = update.subject
          }
          if (update.category !== undefined) {
            pendingQuestions.value[update.index].category = update.category
          }
          totalUpdated++
        }
      }
    })
  }

  if (totalUpdated > 0) alert(`成功更新 ${totalUpdated} 題科目`)
  if (errors && errors.length > 0) alert(`有 ${errors.length} 題更新失敗，請查看 console`)

  closeBulkSubjectModal()
  if (bulkEditMode.value === 'pending') {
    selectedPendingIds.value = []
  } else {
    clearSelection()
    fetchQuestions()
  }
}

// Pending Questions handlers
const addPendingQuestion = (questionData) => {
  pendingQuestions.value.push(questionData)
}

const getCorrectAnswer = (question) => {
  if (!question.options || !Array.isArray(question.options)) return ''

  const correctOptions = question.options
    .map((opt, idx) => opt.is_correct ? String.fromCharCode(65 + idx) : null)
    .filter(Boolean)

  return correctOptions.join(', ')
}

const editPendingQuestion = (index) => {
  editingPendingIndex.value = index
  currentQuestion.value = { ...pendingQuestions.value[index] }
  isEditorVisible.value = true
}

const removePendingQuestion = (index) => {
  if (confirm('確定要移除這個暫存題目嗎？')) {
    pendingQuestions.value.splice(index, 1)
  }
}

const clearPendingQuestions = () => {
  if (confirm(`確定要清除全部 ${pendingQuestions.value.length} 個暫存題目嗎？`)) {
    pendingQuestions.value = []
  }
}

const savePendingQuestions = async () => {
  if (pendingQuestions.value.length === 0) return

  if (!confirm(`即將儲存 ${pendingQuestions.value.length} 個題目到題庫，確定要繼續嗎？`)) {
    return
  }

  isSavingPending.value = true
  savingPendingProgress.value = 0

  let successCount = 0
  let failCount = 0
  const errors = []

  try {
    for (let i = 0; i < pendingQuestions.value.length; i++) {
      const questionData = pendingQuestions.value[i]
      savingPendingProgress.value = i + 1

      try {
        await questionService.createQuestion(questionData)
        successCount++
      } catch (err) {
        console.error(`儲存題目 ${i + 1} 失敗:`, err)
        failCount++
        errors.push({ index: i + 1, error: err })
      }
    }

    // Clear pending questions after save
    pendingQuestions.value = []
    savingPendingProgress.value = 0

    // Show result
    if (failCount === 0) {
      alert(`成功儲存 ${successCount} 題到題庫`)
    } else {
      alert(`成功儲存 ${successCount} 題，失敗 ${failCount} 題`)
    }

    // Refresh question list
    fetchQuestions()
  } catch (err) {
    console.error('批量儲存失敗:', err)
    alert('批量儲存失敗')
  } finally {
    isSavingPending.value = false
    savingPendingProgress.value = 0
  }
}

// Import Modal Functions
const showImportModalFunc = () => {
  showImportModal.value = true
  importStep.value = 1
  importType.value = null
  importPreview.value = null
  pdfErrorMessage.value = ''
  selectedJsonFile.value = null
  isImporting.value = false
  if (pdfUploadRef.value?.reset) {
    pdfUploadRef.value.reset()
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  importStep.value = 1
  importType.value = null
  importPreview.value = null
  pdfErrorMessage.value = ''
  selectedJsonFile.value = null
  isImporting.value = false
  if (pdfUploadRef.value?.reset) {
    pdfUploadRef.value.reset()
  }
}

const selectImportType = (type) => {
  importType.value = type
  importStep.value = 2
  importPreview.value = null
  pdfErrorMessage.value = ''
}

const handleJsonFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/json') {
    selectedJsonFile.value = file
    importPreview.value = null
  } else {
    alert('請上傳有效的 JSON 檔案')
  }
}

const handleJsonDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/json') {
    selectedJsonFile.value = file
    importPreview.value = null
  } else {
    alert('請上傳有效的 JSON 檔案')
  }
}

const clearJsonFile = () => {
  selectedJsonFile.value = null
  importPreview.value = null
  if (jsonFileInput.value) {
    jsonFileInput.value.value = ''
  }
}

const goToImportStep = (step) => {
  if (step >= importStep.value) return
  if (step === 1) {
    importStep.value = 1
    importType.value = null
    importPreview.value = null
    pdfErrorMessage.value = ''
    selectedJsonFile.value = null
    if (pdfUploadRef.value?.reset) {
      pdfUploadRef.value.reset()
    }
    return
  }
  if (step === 2) {
    importStep.value = 2
  }
}

const handleImportBack = () => {
  if (importStep.value === 3) {
    importStep.value = 2
    return
  }
  if (importStep.value === 2) {
    goToImportStep(1)
  }
}

const prepareJsonPreview = async () => {
  if (!selectedJsonFile.value) return

  isImporting.value = true
  try {
    const fileContent = await selectedJsonFile.value.text()
    const data = JSON.parse(fileContent)

    // Check if data is array of questions
    let questionsToImport = []
    if (Array.isArray(data)) {
      questionsToImport = data
    } else if (data.questions && Array.isArray(data.questions)) {
      questionsToImport = data.questions
    } else {
      throw new Error('JSON 格式不正確，請提供 questions 陣列')
    }

    const validQuestions = questionsToImport.filter(q => q.content && q.question_type)
    if (validQuestions.length === 0) {
      throw new Error('未找到有效題目')
    }

    importPreview.value = {
      source: 'json',
      examData: {
        subject: data.subject || '',
        category: data.category || ''
      },
      questions: validQuestions,
      answers: null
    }
    importStep.value = 3
  } catch (err) {
    console.error('JSON 匯入失敗:', err)
    alert(`匯入失敗: ${err.message}`)
  } finally {
    isImporting.value = false
  }
}

const handlePdfPreview = (payload) => {
  if (!payload?.questions?.length) return
  importPreview.value = { source: 'pdf', ...payload }
  pdfErrorMessage.value = ''
}

const handlePdfError = (message) => {
  if (message && message.includes('答案')) {
    return
  }
  pdfErrorMessage.value = message || 'PDF 解析失敗'
  importPreview.value = null
}

const handleImportNext = async () => {
  if (importStep.value !== 2) return
  if (importType.value === 'json') {
    await prepareJsonPreview()
    return
  }
  if (importType.value === 'pdf' && importPreview.value) {
    importStep.value = 3
  }
}

const confirmImport = async () => {
  if (!importPreview.value) return

  if (importType.value === 'json') {
    pendingQuestions.value.push(...(importPreview.value.questions || []))
    alert(`已加入 ${importPreview.value.questions.length} 題到暫存區`)
    closeImportModal()
    return
  }

  if (importType.value === 'pdf') {
    handlePdfImportSuccess(importPreview.value)
  }
}

const previewText = (q) => {
  const text = q?.question || q?.content || ''
  return text.length > 100 ? `${text.slice(0, 100)}...` : text
}

const handlePdfImportSuccess = (data) => {
  if (data && data.questions && data.questions.length > 0) {
    // 轉換 PDF 數據格式為系統需要的格式
    const formattedQuestions = data.questions.map(q => {
      // 將選項陣列轉換為對象格式，並標記正確答案
      const correctAnswer = q.correct_answer || ''
      let formattedOptions = []

      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        formattedOptions = q.options.map((optionText, index) => {
          // 選項標籤: A, B, C, D...
          const optionLabel = String.fromCharCode(65 + index) // A=65, B=66...
          return {
            content: optionText,
            is_correct: correctAnswer === optionLabel || correctAnswer === optionText
          }
        })
      }

      return {
        content: q.question || q.content || '',
        subject: data.examData?.subject || '',
        category: data.examData?.category || '',
        question_type: q.options && q.options.length > 0 ? '選擇題' : '申論題',
        options: formattedOptions,
        difficulty: data.examData?.level || 'medium',
        explanation: '',
        status: 'draft',
        tags: [],
        tag_ids: []
      }
    })

    pendingQuestions.value.push(...formattedQuestions)
    alert(`成功從 PDF 解析 ${formattedQuestions.length} 題到暫存區`)
    closeImportModal()
  }
}

// Expose function for external use (e.g., from PDF import)
defineExpose({
  addPendingQuestion,
  addPendingQuestions: (questions) => {
    pendingQuestions.value.push(...questions)
  },
  showImportModal: showImportModalFunc
})

</script>

<style scoped>
.question-admin {
  padding: 0;
}

/* Pending Questions Section */
.pending-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px dashed #d89b32;
  margin-bottom: 24px;
  overflow: hidden;
}

.pending-header {
  background: linear-gradient(135deg, #d89b32 0%, #c88a2a 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.header-icon svg {
  color: white;
}

.header-content {
  flex: 1;
}

.pending-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
}

.pending-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-bulk-edit-pending,
.btn-clear-pending,
.btn-save-pending {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-bulk-edit-pending {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.btn-bulk-edit-pending:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-1px);
}

.btn-clear-pending {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-clear-pending:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-save-pending {
  background: white;
  color: #d89b32;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-save-pending:hover:not(:disabled) {
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-save-pending:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.pending-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(216, 155, 50, 0.3);
  border-top-color: #d89b32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.pending-list {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.pending-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff7eb;
  border: 1px dashed #d89b32;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.pending-item:hover {
  background: #fef3e2;
  border-color: #c88a2a;
  box-shadow: 0 2px 8px rgba(216, 155, 50, 0.1);
}

.pending-checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 8px;
  cursor: pointer;
}

.pending-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d89b32;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
}

.pending-content {
  flex: 1;
  min-width: 0;
}

.pending-text {
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pending-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.meta-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(216, 155, 50, 0.15);
  color: #c88a2a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.meta-badge.meta-answer {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
  font-weight: 700;
}

.meta-info {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.pending-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-edit-pending,
.btn-remove-pending {
  flex-shrink: 0;
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit-pending {
  color: var(--primary, #476996);
}

.btn-edit-pending:hover {
  background: var(--primary-soft, #EEF2FF);
  transform: scale(1.05);
}

.btn-remove-pending {
  color: #dc2626;
}

.btn-remove-pending:hover {
  background: #fee2e2;
  transform: scale(1.05);
}

/* Filters */
.question-filters-wrapper {
  margin-bottom: 24px;
}

.ordering-filter {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.filter-select-wrapper {
  display: flex;
  height: fit-content;
  position: relative;
  min-width: 200px;
}

.select-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #64748B);
  pointer-events: none;
}

.filter-select {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary, #476996);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

/* Modern Modal Styles */

.modern-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
}

.modern-modal-header {
  background: linear-gradient(135deg, var(--primary, #476996) 0%, var(--primary-hover, #35527a) 100%);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.header-icon-wrapper svg {
  color: white;
}

.header-content-wrapper {
  flex: 1;
}

.modern-modal-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.modern-modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 400;
}

.modern-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modern-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.modern-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modern-close-btn svg {
  color: white;
}

.modern-modal-body {
  padding: 28px;
  max-height: calc(90vh - 250px);
  overflow-y: auto;
}

.modern-modal-footer {
  padding: 20px 28px;
  background: #f9fafb;
  border-top: 1px solid var(--border, #CBD5E1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  flex: 1;
}

.footer-info svg {
  flex-shrink: 0;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.footer-btn svg {
  flex-shrink: 0;
}

.footer-btn-secondary {
  background: white;
  color: var(--text-secondary, #64748B);
  border: 1px solid var(--border, #CBD5E1);
}

.footer-btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  color: var(--text-primary, #1E293B);
  border-color: #94a3b8;
}

.footer-btn-pending {
  background: #fff7eb;
  color: #d89b32;
  border: 1px solid #f7d7a8;
}

.footer-btn-pending:hover:not(:disabled) {
  background: #fef3e2;
  border-color: #d89b32;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(216, 155, 50, 0.2);
}

.footer-btn-primary {
  background: var(--primary, #476996);
  color: white;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.footer-btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #35527a);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(71, 105, 150, 0.3);
}

.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .modern-modal-header {
    padding: 20px;
  }

  .modern-modal-title {
    font-size: 18px;
  }

  .modern-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-info {
    order: -1;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .footer-btn {
    width: 100%;
  }
}

/* Import Modal Styles */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.import-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border: 2px solid var(--border, #CBD5E1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.import-option:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(71, 105, 150, 0.15);
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary, #476996), var(--primary-hover, #35527a));
  border-radius: 12px;
  color: white;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.option-description {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

.option-hint {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

.option-arrow {
  color: var(--text-secondary, #64748B);
  flex-shrink: 0;
}

.import-option:hover .option-arrow {
  color: var(--primary, #476996);
  transform: translateX(4px);
}

.import-section {
  margin-top: 16px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: #f8fafc;
  border: 2px dashed var(--border, #CBD5E1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.upload-zone:hover {
  border-color: var(--primary, #476996);
  background: var(--primary-soft, #EEF2FF);
}

.upload-zone svg {
  color: var(--primary, #476996);
  margin-bottom: 16px;
}

.upload-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.upload-hint {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #64748B);
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
}

.selected-file svg {
  color: var(--primary, #476996);
  flex-shrink: 0;
}

.selected-file span {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary, #1E293B);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-clear-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #64748B);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-clear-file:hover {
  background: #fee;
  color: #dc2626;
}

@media (max-width: 768px) {
  .import-option {
    padding: 16px;
  }

  .option-icon {
    width: 48px;
    height: 48px;
  }

  .option-icon svg {
    width: 24px;
    height: 24px;
  }

  .option-title {
    font-size: 15px;
  }

  .option-description {
    font-size: 13px;
  }

  .upload-zone {
    padding: 32px 16px;
  }
}


.import-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.step-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748B);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.step-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-item.active {
  color: var(--primary, #476996);
}

.step-item.current {
  color: var(--text-primary, #1E293B);
}

.step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary, #476996);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.step-divider {
  width: auto;
  height: auto;
  background: transparent;
  min-width: auto;
  color: var(--text-secondary, #64748B);
}

.step-divider::before {
  content: "›";
  font-size: 14px;
  line-height: 1;
}

.import-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary, #476996);
  font-size: 13px;
  cursor: pointer;
}

.import-alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.import-result-card {
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.import-result-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border, #CBD5E1);
}

.import-result-title {
  font-weight: 700;
  color: var(--text-primary, #1E293B);
}

.import-result-subtitle {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
  margin-top: 4px;
}

.import-result-body {
  padding: 16px;
}

.import-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.import-info-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.import-info-label {
  font-size: 12px;
  color: var(--text-secondary, #64748B);
}

.import-info-value {
  font-weight: 600;
  color: var(--text-primary, #1E293B);
}

.import-preview-header {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary, #1E293B);
}

.import-preview-list {
  border: 1px solid var(--border, #CBD5E1);
  border-radius: 8px;
  overflow: hidden;
}

.import-preview-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border, #CBD5E1);
  background: white;
}

.import-preview-item:last-child {
  border-bottom: none;
}

.preview-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary, #476996);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.preview-text {
  font-size: 13px;
  color: var(--text-primary, #1E293B);
}

@media (max-width: 768px) {
  .import-info-grid {
    grid-template-columns: 1fr;
  }

  .step-divider {
    display: none;
  }
}

/* Dark Mode Styles for Import Modal */

:root[data-theme="dark"] .import-steps,
.dark .import-steps {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-item,
.dark .step-item {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-item.active,
.dark .step-item.active {
  color: #cbd5f5;
}

:root[data-theme="dark"] .step-item.current,
.dark .step-item.current {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .step-divider,
.dark .step-divider {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .step-title,
.dark .step-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-result-card,
.dark .import-result-card {
  background: #0f172a;
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-result-header,
.dark .import-result-header {
  background: #111827;
  border-bottom-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-result-title,
.dark .import-result-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-result-subtitle,
.dark .import-result-subtitle {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .import-info-item,
.dark .import-info-item {
  background: #111827;
}

:root[data-theme="dark"] .import-info-label,
.dark .import-info-label {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .import-info-value,
.dark .import-info-value {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-preview-header,
.dark .import-preview-header {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-preview-list,
.dark .import-preview-list {
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-preview-item,
.dark .import-preview-item {
  background: #0f172a;
  border-bottom-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .preview-text,
.dark .preview-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .import-alert-error,
.dark .import-alert-error {
  background: #2b1515;
  border-color: #7f1d1d;
  color: #fecaca;
}


:root[data-theme="dark"] .import-option,
.dark .import-option {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .import-option:hover,
.dark .import-option:hover {
  background: var(--bg-tertiary, #2d3a4f);
  border-color: var(--primary, #6b8fc7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .option-title,
.dark .option-title {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .option-description,
.dark .option-description {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .option-hint,
.dark .option-hint {
  background: var(--bg-tertiary, #334155);
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .option-arrow,
.dark .option-arrow {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .upload-zone,
.dark .upload-zone {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

:root[data-theme="dark"] .upload-text,
.dark .upload-text {
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .upload-hint,
.dark .upload-hint {
  color: var(--text-secondary-dark, #94a3b8);
}

:root[data-theme="dark"] .selected-file,
.dark .selected-file {
  background: var(--bg-tertiary, #334155);
  color: var(--text-primary-dark, #f1f5f9);
}

:root[data-theme="dark"] .btn-clear-file:hover,
.dark .btn-clear-file:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

:root[data-theme="dark"] .modern-modal,
.dark .modern-modal {
  background: var(--bg-primary, #0f172a);
  border: 1px solid var(--border-dark, #334155);
}

:root[data-theme="dark"] .modern-modal-body,
.dark .modern-modal-body {
  background: var(--bg-primary, #0f172a);
}

:root[data-theme="dark"] .modern-modal-footer,
.dark .modern-modal-footer {
  background: var(--bg-secondary, #1e293b);
  border-color: var(--border-dark, #334155);
}

/* Pending Section - Dark Mode */
:root[data-theme="dark"] .pending-section,
.dark .pending-section {
  background: #0f172a;
  border-color: #a16207;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

:root[data-theme="dark"] .pending-header,
.dark .pending-header {
  background: linear-gradient(135deg, #a16207 0%, #92400e 100%);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:root[data-theme="dark"] .header-icon,
.dark .header-icon {
  background: rgba(255, 255, 255, 0.12);
}

:root[data-theme="dark"] .pending-title,
.dark .pending-title {
  color: #fef3c7;
}

:root[data-theme="dark"] .pending-subtitle,
.dark .pending-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

:root[data-theme="dark"] .btn-bulk-edit-pending,
.dark .btn-bulk-edit-pending,
:root[data-theme="dark"] .btn-clear-pending,
.dark .btn-clear-pending {
  background: rgba(255, 255, 255, 0.12);
  color: #fef3c7;
  border-color: rgba(255, 255, 255, 0.25);
}

:root[data-theme="dark"] .btn-save-pending,
.dark .btn-save-pending {
  background: #0f172a;
  color: #fcd34d;
  border: 1px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .pending-item,
.dark .pending-item {
  background: #1f2937;
  border-color: #a16207;
}

:root[data-theme="dark"] .pending-item:hover,
.dark .pending-item:hover {
  background: #263244;
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

:root[data-theme="dark"] .pending-number,
.dark .pending-number {
  background: #f59e0b;
  color: #0f172a;
}

:root[data-theme="dark"] .pending-text,
.dark .pending-text {
  color: #f8fafc;
}

:root[data-theme="dark"] .meta-badge,
.dark .meta-badge {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
}

:root[data-theme="dark"] .meta-badge.meta-answer,
.dark .meta-badge.meta-answer {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

:root[data-theme="dark"] .meta-info,
.dark .meta-info {
  color: #94a3b8;
}

:root[data-theme="dark"] .btn-edit-pending:hover,
.dark .btn-edit-pending:hover {
  background: rgba(71, 105, 150, 0.25);
}

:root[data-theme="dark"] .btn-remove-pending:hover,
.dark .btn-remove-pending:hover {
  background: rgba(220, 38, 38, 0.2);
}
</style>
