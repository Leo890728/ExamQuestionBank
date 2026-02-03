<template>
  <div class="note-drawer-container">
    <!-- Backdrop -->
    <div 
      v-if="store.isDrawerOpen" 
      class="drawer-backdrop"
      @click="handleClose"
    ></div>

    <!-- Drawer -->
    <div 
      class="note-drawer"
      :class="[
        { open: store.isDrawerOpen },
        position === 'left' ? 'drawer-left' : 'drawer-right',
        { 'is-resizing': isResizing }
      ]"
      :style="drawerStyle"
    >
      <!-- Resize Handle -->
      <div 
        v-if="!isMobile" 
        class="resize-handle"
        :class="position === 'left' ? 'handle-right' : 'handle-left'"
        @mousedown="startResize"
      >
        <div class="handle-bar"></div>
      </div>

      <div v-if="isEditing" class="h-100 d-flex flex-column">
        <NoteEditor 
          :note="store.activeNote"
          :is-saving="isSaving"
          :position="position"
          @save="handleSave"
          @cancel="cancelEdit"
          @delete="handleDelete"
          @ask-ai="handleAskAI"
          @toggle-position="togglePosition"
        />
      </div>

      <div v-else class="drawer-content h-100 d-flex flex-column">
        <div class="drawer-header p-3 border-bottom d-flex justify-content-between align-items-center bg-white sticky-top">
          <div class="d-flex align-items-center gap-2">
            <h5 class="m-0 d-flex align-items-center">
              <i class="bi bi-journal-text me-2"></i>
              筆記
              <span v-if="contextTitle" class="badge bg-light text-dark ms-2 small fw-normal">
                {{ contextTitle }}
              </span>
            </h5>
          </div>
          
          <div class="d-flex align-items-center gap-2">
            <!-- Docking Toggle (Desktop only) -->
            <button 
              v-if="!isMobile" 
              class="btn btn-sm btn-icon text-muted" 
              @click="togglePosition"
              :title="position === 'left' ? '切換至右側' : '切換至左側'"
            >
              <i class="bi" :class="position === 'left' ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'"></i>
            </button>
            <button class="btn-close" @click="handleClose"></button>
          </div>
        </div>

        <div class="drawer-body p-3 flex-grow-1 overflow-auto">
          <!-- Empty State -->
          <div v-if="notes.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-pencil-square display-4 mb-3 d-block opacity-25"></i>
            <p>尚無相關筆記</p>
            <button class="btn btn-sm btn-outline-primary mt-2" @click="startNewNote">
              新增第一則筆記
            </button>
          </div>

          <!-- Note List -->
          <div v-else class="d-flex flex-column gap-3">
             <!-- Selection Toolbar -->
            <div v-if="isSelectionMode" class="d-flex justify-content-between align-items-center mb-2 px-1">
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  id="selectAll"
                >
                <label class="form-check-label small text-muted" for="selectAll">全選</label>
              </div>
              <button 
                class="btn btn-sm btn-danger d-flex align-items-center gap-1"
                :disabled="selectedNoteIds.length === 0"
                @click="deleteSelected"
              >
                <i class="bi bi-trash"></i> 刪除 ({{ selectedNoteIds.length }})
              </button>
            </div>

            <div 
              v-for="note in notes" 
              :key="note.id" 
              class="card note-card cursor-pointer position-relative"
              @click="handleNoteClick(note)"
            >
               <!-- Selection Checkbox -->
              <div v-if="isSelectionMode" class="position-absolute top-0 start-0 h-100 d-flex align-items-center ps-2" style="z-index: 5;">
                <input 
                  class="form-check-input m-0" 
                  type="checkbox" 
                  :checked="selectedNoteIds.includes(note.id)"
                  @click.stop="toggleSelection(note.id)"
                >
              </div>

              <div class="card-body p-3" :class="{ 'ps-5': isSelectionMode }">
                <div class="d-flex justify-content-between mb-2">
                  <h6 class="card-title m-0 text-truncate" style="max-width: 70%">{{ note.title || '無標題' }}</h6>
                  <div class="d-flex align-items-center gap-2">
                     <small class="text-muted">{{ formatDate(note.updated_at || note.created_at) }}</small>
                     
                     <!-- Item Menu (Notion Style) -->
                     <div v-if="!isSelectionMode" class="dropdown" @click.stop>
                        <button class="btn btn-sm btn-icon text-muted p-0" style="width: 20px; height: 20px;" data-bs-toggle="dropdown">
                          <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                          <li><a class="dropdown-item text-danger" href="#" @click.prevent="handleDelete(note.id)">
                            <i class="bi bi-trash me-2"></i> 刪除
                          </a></li>
                        </ul>
                     </div>
                  </div>
                </div>
                <p class="card-text text-muted small text-truncate-2">{{ note.content }}</p>
                <div v-if="note.tags && note.tags.length" class="mt-2">
                  <span v-for="tag in note.tags" :key="tag" class="badge bg-secondary me-1" style="font-size: 0.65rem">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer p-3 border-top bg-light mt-auto d-flex gap-2">
          <button v-if="!isSelectionMode" class="btn btn-outline-secondary flex-shrink-0" @click="isSelectionMode = true" title="多選">
             <i class="bi bi-check2-square"></i>
          </button>
          <button v-else class="btn btn-secondary flex-shrink-0" @click="isSelectionMode = false">
             取消
          </button>
          
          <button v-if="!isSelectionMode" class="btn btn-primary flex-grow-1" @click="startNewNote">
            <i class="bi bi-plus-lg me-1"></i> 新增筆記
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useNoteStore } from '../../stores/noteStore'
import NoteEditor from './NoteEditor.vue'

const store = useNoteStore()
const isSaving = ref(false)

// --- Resize & Position State ---
const width = ref(400) // Default width
const position = ref('right') // 'left' or 'right'
const isResizing = ref(false)
const windowWidth = ref(window.innerWidth)

// --- Selection State ---
const isSelectionMode = ref(false)
const selectedNoteIds = ref([])

const isAllSelected = computed(() => {
  return notes.value.length > 0 && selectedNoteIds.value.length === notes.value.length
})

// --- RWD Logic ---
const isMobile = computed(() => windowWidth.value < 768)

const drawerStyle = computed(() => {
  if (isMobile.value) {
    return { width: '100vw' }
  }
  return { width: `${width.value}px` }
})

// Update window width on resize
const handleWindowResize = () => {
  windowWidth.value = window.innerWidth
  // Auto-reset if getting too wide/narrow
  if (!isMobile.value) {
    width.value = Math.min(Math.max(width.value, 300), window.innerWidth * 0.8)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', stopResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('mousemove', doResize)
  window.removeEventListener('mouseup', stopResize)
})

// --- Resize Logic ---
function startResize(e) {
  e.preventDefault() // Prevent text selection
  isResizing.value = true
}

function doResize(e) {
  if (!isResizing.value) return

  let newWidth
  if (position.value === 'right') {
    // Determine width based on distance from right edge
    newWidth = window.innerWidth - e.clientX
  } else {
    // Determine width based on distance from left edge
    newWidth = e.clientX
  }

  // Constraints
  const minWidth = 300
  const maxWidth = window.innerWidth * 0.8 // Max 80% screen width
  
  width.value = Math.min(Math.max(newWidth, minWidth), maxWidth)
}

function stopResize() {
  isResizing.value = false
}

// --- Docking Logic ---
function togglePosition() {
  position.value = position.value === 'right' ? 'left' : 'right'
}

// --- Selection Logic ---
function toggleSelection(id) {
  const idx = selectedNoteIds.value.indexOf(id)
  if (idx > -1) {
    selectedNoteIds.value.splice(idx, 1)
  } else {
    selectedNoteIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedNoteIds.value = []
  } else {
    selectedNoteIds.value = notes.value.map(n => n.id)
  }
}

async function deleteSelected() {
  if (!selectedNoteIds.value.length) return
  if (confirm(`確定要刪除選取的 ${selectedNoteIds.value.length} 則筆記？`)) {
    for (const id of selectedNoteIds.value) {
      await store.deleteNote(id)
    }
    selectedNoteIds.value = []
    isSelectionMode.value = false
  }
}

function handleNoteClick(note) {
  if (isSelectionMode.value) {
    toggleSelection(note.id)
  } else {
    editNote(note)
  }
}

// --- Existing Logic ---
const isEditing = computed(() => !!store.activeNote)

const notes = computed(() => {
  if (store.drawerSource && store.drawerSource.id) {
    return store.getNotesByQuestionId(store.drawerSource.id)
  }
  return store.notes
})

const contextTitle = computed(() => {
  if (store.drawerSource?.type === 'question') {
    return `題目 #${store.drawerSource.order || ''}`
  }
  return ''
})

function handleClose() {
  store.closeDrawer()
  isSelectionMode.value = false // Reset selection mode
  selectedNoteIds.value = []
}

function startNewNote() {
  store.openDrawer(store.drawerSource)
}

function editNote(note) {
  store.openDrawer(store.drawerSource, note.id)
}

function cancelEdit() {
  store.activeNote = null
}

async function handleSave(noteData) {
  isSaving.value = true
  try {
    await store.saveNote(noteData)
    store.activeNote = null
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id) {
  if (confirm('確定要刪除此筆記？')) {
    await store.deleteNote(id)
    store.activeNote = null
  }
}

function handleAskAI(content) {
  alert(`AI Mock: ${content.substring(0, 50)}...`)
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.note-drawer-container {
  position: fixed;
  z-index: 1050;
  pointer-events: none; /* Allow clicking through container */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.drawer-backdrop {
  pointer-events: auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.note-drawer {
  pointer-events: auto;
  position: absolute;
  top: 0;
  height: 100vh;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Disable transition during resize to make it smooth */
.note-drawer.is-resizing {
  transition: none;
  user-select: none; /* Prevent selection while dragging */
}

/* Right Side Positioning */
.drawer-right {
  right: 0;
  transform: translateX(100%);
  border-left: 1px solid var(--border);
}

.drawer-right.open {
  transform: translateX(0);
}

/* Left Side Positioning */
.drawer-left {
  left: 0;
  transform: translateX(-100%);
  border-right: 1px solid var(--border);
}

.drawer-left.open {
  transform: translateX(0);
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16px; /* Effective click area */
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.resize-handle:hover,
.note-drawer.is-resizing .resize-handle {
  opacity: 1;
}

.handle-left {
  right: -8px; /* Position outer edge for L drawer ?? No, handle is INNER edge */
               /* For Left Drawer, handle is on the Right edge */
  right: 0;
  width: 12px;
  cursor: col-resize;
}
/* Re-think handles:
   Right Drawer -> Handle is on LEFT edge.
   Left Drawer -> Handle is on RIGHT edge.
*/

.resize-handle.handle-left { /* Handle for Right Drawer (on Left side of drawer) */
    left: 0;
    transform: translateX(-50%);
}

.resize-handle.handle-right { /* Handle for Left Drawer (on Right side of drawer) */
    right: 0;
    transform: translateX(50%);
}

.handle-bar {
  width: 4px;
  height: 40px;
  background-color: var(--primary); /* Visible indicator */
  border-radius: 2px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--surface-muted);
  color: var(--primary) !important;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border, #e2e8f0);
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-soft);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
