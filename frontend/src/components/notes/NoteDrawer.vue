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
      :class="{ open: store.isDrawerOpen }"
    >
      <div v-if="isEditing" class="h-100">
        <NoteEditor 
          :note="store.activeNote"
          :is-saving="isSaving"
          @save="handleSave"
          @cancel="cancelEdit"
          @delete="handleDelete"
          @ask-ai="handleAskAI"
        />
      </div>

      <div v-else class="drawer-content h-100 d-flex flex-column">
        <div class="drawer-header p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 class="m-0">
            <i class="bi bi-journal-text me-2"></i>
            筆記
            <span v-if="contextTitle" class="badge bg-light text-dark ms-2 small fw-normal">
              {{ contextTitle }}
            </span>
          </h5>
          <button class="btn-close" @click="handleClose"></button>
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
            <div 
              v-for="note in notes" 
              :key="note.id" 
              class="card note-card cursor-pointer"
              @click="editNote(note)"
            >
              <div class="card-body p-3">
                <div class="d-flex justify-content-between mb-2">
                  <h6 class="card-title m-0 text-truncate" style="max-width: 80%">{{ note.title || '無標題' }}</h6>
                  <small class="text-muted">{{ formatDate(note.created_at) }}</small>
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

        <div class="drawer-footer p-3 border-top bg-light">
          <button class="btn btn-primary w-100" @click="startNewNote">
            <i class="bi bi-plus-lg me-1"></i> 新增筆記
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useNoteStore } from '../../stores/noteStore'
import NoteEditor from './NoteEditor.vue'

const store = useNoteStore()
const isSaving = ref(false)

// Determine if we are in "Edit Mode" (Active Note exists) or "List Mode"
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
}

function startNewNote() {
  store.openDrawer(store.drawerSource) // Resets activeNote to new
}

function editNote(note) {
  store.openDrawer(store.drawerSource, note.id)
}

function cancelEdit() {
  store.activeNote = null // Go back to list
}

async function handleSave(noteData) {
  isSaving.value = true
  try {
    await store.saveNote(noteData)
    store.activeNote = null // Go back to list after save
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
  console.log('Sending to AI:', content)
  // TODO: Integrate with AIChatInterface
  alert(`已將內容發送至 AI Chat Context (Mock):\n${content.substring(0, 50)}...`)
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
  z-index: 1050; /* Bootstrap modal is 1055, offcanvas 1045 */
}

.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1051;
}

.note-drawer {
  position: fixed;
  top: 0;
  right: -400px; /* Hidden by default */
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1052;
  display: flex;
  flex-direction: column;
}

.note-drawer.open {
  right: 0;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.note-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e2e8f0;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
