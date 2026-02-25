<template>
  <div class="note-list-container">
    <!-- Search & Filter Bar -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <div class="flex-grow-1 position-relative">
        <i class="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
        <input 
          v-model="searchQuery" 
          class="form-control ps-5" 
          placeholder="搜尋筆記..." 
        />
      </div>
      
      <select v-model="filterType" class="form-select w-auto">
        <option value="all">所有來源</option>
        <option value="question">考題筆記</option>
        <option value="manual">一般筆記</option>
      </select>
    </div>

    <!-- Tags Cloud -->
    <div class="mb-4 d-flex gap-2 flex-wrap" v-if="allTags.length > 0">
       <button 
         class="btn btn-sm rounded-pill"
         :class="activeTag === null ? 'btn-primary' : 'btn-outline-secondary'"
         @click="activeTag = null"
       >
         全部
       </button>
       <button 
         v-for="tag in allTags" 
         :key="tag"
         class="btn btn-sm rounded-pill"
         :class="activeTag === tag ? 'btn-primary' : 'btn-outline-secondary'"
         @click="activeTag = tag"
       >
         {{ tag }}
       </button>
    </div>

    <!-- Grid Layout -->
    <div class="row g-4">
      <!-- Create New Card -->
      <div class="col-12 col-md-6 col-lg-4">
        <div 
          class="card h-100 dashed-border d-flex align-items-center justify-content-center cursor-pointer bg-light"
          @click="createNewNote"
        >
          <div class="text-center py-5">
            <i class="bi bi-plus-circle display-4 text-primary d-block mb-2"></i>
            <span class="text-primary fw-bold">新增筆記</span>
          </div>
        </div>
      </div>

      <!-- Note Cards -->
      <div 
        v-for="note in filteredNotes" 
        :key="note.id" 
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card h-100 note-card" @click="openNote(note)">
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2 align-items-start">
               <h5 class="card-title text-truncate mb-0" :title="note.title">{{ note.title || '無標題' }}</h5>
               <span 
                 class="badge" 
                 :class="note.source_type === 'question' ? 'bg-info text-dark' : 'bg-secondary'"
               >
                 {{ note.source_type === 'question' ? '考題' : '一般' }}
               </span>
            </div>
            
            <p class="card-text text-muted text-truncate-3">
              {{ note.content }}
            </p>
            
            <div class="mt-auto pt-3 d-flex justify-content-between align-items-center">
              <div class="tags-container text-truncate">
                 <span v-for="tag in note.tags.slice(0, 3)" :key="tag" class="badge bg-light text-secondary border me-1">
                   {{ tag }}
                 </span>
                 <span v-if="note.tags.length > 3" class="text-muted small">
                   +{{ note.tags.length - 3 }}
                 </span>
              </div>
              <small class="text-muted">{{ formatDate(note.updated_at || note.created_at) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredNotes.length === 0" class="col-12 text-center py-5">
        <p class="text-muted">沒有找到符合條件的筆記</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '../../stores/noteStore'

const store = useNoteStore()
const searchQuery = ref('')
const filterType = ref('all')
const activeTag = ref(null)

onMounted(() => {
  store.fetchNotes()
})

const allTags = computed(() => {
  const tags = new Set()
  store.notes.forEach(note => {
    note.tags.forEach(t => tags.add(t))
  })
  return Array.from(tags).sort()
})

const filteredNotes = computed(() => {
  return store.notes.filter(note => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchTitle = note.title?.toLowerCase().includes(q)
      const matchContent = note.content?.toLowerCase().includes(q)
      const matchTags = note.tags.some(t => t.toLowerCase().includes(q))
      if (!matchTitle && !matchContent && !matchTags) return false
    }

    // Filter Source
    if (filterType.value !== 'all' && note.source_type !== filterType.value) return false

    // Filter Tag
    if (activeTag.value && !note.tags.includes(activeTag.value)) return false

    return true
  })
})

function createNewNote() {
  store.openDrawer({ type: 'manual' })
}

function openNote(note) {
  store.openDrawer(null, note.id)
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.dashed-border {
  border: 2px dashed #cbd5e1;
  transition: all 0.2s;
}

.dashed-border:hover {
  border-color: var(--primary);
  background: white !important;
}

.note-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid #e2e8f0;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.text-truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 4.5em; /* Ensure consistent height */
}
</style>
