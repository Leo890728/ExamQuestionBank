import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNoteStore = defineStore('notes', () => {
    // State
    const notes = ref([])
    const activeNote = ref(null)
    const isDrawerOpen = ref(false)
    const drawerSource = ref(null) // { type: 'question', id: '...' }

    // Mock Data
    const mockNotes = [
        {
            id: '1',
            title: '憲法第7條重點',
            content: '中華民國人民，無分男女、宗教、種族、階級、黨派，在法律上一律平等。此條文強調實質平等而非形式平等。',
            source_type: 'question',
            source_id: 'q_123',
            tags: ['憲法', '平等權'],
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: '2',
            title: '行政法原則',
            content: '比例原則：\n1. 適當性\n2. 必要性\n3. 衡量性 (狹義比例原則)',
            source_type: 'manual',
            source_id: null,
            tags: ['行政法', '原則'],
            created_at: new Date().toISOString()
        }
    ]

    // Initialize with mock data
    notes.value = [...mockNotes]

    // Getters
    const getNotesByQuestionId = computed(() => {
        return (questionId) => notes.value.filter(n => n.source_type === 'question' && n.source_id === questionId)
    })

    const getNoteById = computed(() => {
        return (id) => notes.value.find(n => n.id === id)
    })

    // Actions
    function openDrawer(source = null, noteId = null) {
        if (noteId) {
            activeNote.value = getNoteById.value(noteId)
        } else {
            // New note
            activeNote.value = {
                id: null,
                title: '',
                content: '',
                source_type: source?.type || 'manual',
                source_id: source?.id || null,
                tags: []
            }
        }
        drawerSource.value = source
        isDrawerOpen.value = true
    }

    function closeDrawer() {
        isDrawerOpen.value = false
        activeNote.value = null
        drawerSource.value = null
    }

    async function saveNote(noteData) {
        console.log('Saving note:', noteData)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))

        if (noteData.id) {
            // Update
            const index = notes.value.findIndex(n => n.id === noteData.id)
            if (index !== -1) {
                notes.value[index] = { ...notes.value[index], ...noteData, updated_at: new Date().toISOString() }
            }
        } else {
            // Create
            const newNote = {
                ...noteData,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            notes.value.unshift(newNote)
        }
    }

    async function deleteNote(id) {
        console.log('Deleting note:', id)
        await new Promise(resolve => setTimeout(resolve, 300))
        const index = notes.value.findIndex(n => n.id === id)
        if (index !== -1) {
            notes.value.splice(index, 1)
        }
    }

    async function generateFlashcard(noteContent) {
        console.log('Generating flashcard for:', noteContent)
        await new Promise(resolve => setTimeout(resolve, 1500))
        // Mock response
        return [
            {
                front: '根據筆記內容，中華民國憲法第7條強調什麼？',
                back: '強調「實質平等」而非僅是「形式平等」。'
            },
            {
                front: '筆記中提到的比例原則包含哪三個子原則？',
                back: '1. 適當性原則\n2. 必要性原則\n3. 衡量性原則 (狹義比例原則)'
            }
        ]
    }

    return {
        notes,
        activeNote,
        isDrawerOpen,
        drawerSource,
        getNotesByQuestionId,
        openDrawer,
        closeDrawer,
        saveNote,
        deleteNote,
        generateFlashcard
    }
})
