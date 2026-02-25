import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useNoteStore = defineStore('notes', () => {
    // State
    const notes = ref([])
    const activeNote = ref(null)
    const isDrawerOpen = ref(false)
    const drawerSource = ref(null) // { type: 'question', id: '...' }
    const isLoading = ref(false)
    const error = ref(null)

    // Initialize: Fetch notes from Supabase
    async function fetchNotes() {
        try {
            isLoading.value = true
            error.value = null

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.log('No authenticated user, skipping note fetch')
                return
            }

            const { data, error: fetchError } = await supabase
                .from('exam_note')
                .select('*')
                .eq('is_archived', false)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            notes.value = data || []
            console.log(`Loaded ${notes.value.length} notes from database`)
        } catch (err) {
            console.error('Error fetching notes:', err)
            error.value = err.message
        } finally {
            isLoading.value = false
        }
    }

    // Getters
    const getNotesByQuestionId = computed(() => {
        return (questionId) => notes.value.filter(n => n.source_type === 'question' && n.source_id === questionId)
    })

    const getNoteById = computed(() => {
        return (id) => notes.value.find(n => n.id === id)
    })

    const pinnedNotes = computed(() => notes.value.filter(n => n.is_pinned))
    const unpinnedNotes = computed(() => notes.value.filter(n => !n.is_pinned))

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
        try {
            isLoading.value = true
            error.value = null

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('User not authenticated')
            }

            if (noteData.id) {
                // Update existing note
                const { data, error: updateError } = await supabase
                    .from('exam_note')
                    .update({
                        title: noteData.title,
                        content: noteData.content,
                        content_html: noteData.content_html,
                        source_type: noteData.source_type,
                        source_id: noteData.source_id,
                        source_url: noteData.source_url,
                        source_metadata: noteData.source_metadata,
                        tags: noteData.tags,
                        is_pinned: noteData.is_pinned,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', noteData.id)
                    .eq('user_id', user.id)
                    .select()
                    .single()

                if (updateError) throw updateError

                // Update local state
                const index = notes.value.findIndex(n => n.id === noteData.id)
                if (index !== -1) {
                    notes.value[index] = data
                }

                // Re-generate embedding if content changed
                if (noteData.content) {
                    await generateEmbedding(data.id, data.content)
                }

                console.log('Note updated:', data.id)
            } else {
                // Create new note
                const { data, error: insertError } = await supabase
                    .from('exam_note')
                    .insert({
                        user_id: user.id,
                        title: noteData.title,
                        content: noteData.content,
                        content_html: noteData.content_html,
                        source_type: noteData.source_type,
                        source_id: noteData.source_id,
                        source_url: noteData.source_url,
                        source_metadata: noteData.source_metadata,
                        tags: noteData.tags || [],
                        is_pinned: noteData.is_pinned || false,
                        is_archived: false
                    })
                    .select()
                    .single()

                if (insertError) throw insertError

                // Add to local state
                notes.value.unshift(data)

                // Generate embedding async (don't wait)
                generateEmbedding(data.id, data.content).catch(err => {
                    console.error('Failed to generate embedding:', err)
                })

                console.log('Note created:', data.id)
            }
        } catch (err) {
            console.error('Error saving note:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function generateEmbedding(noteId, content) {
        try {
            const { error: funcError } = await supabase.functions.invoke('embed-note', {
                body: {
                    note_id: noteId,
                    content: content,
                    table: 'exam_note'
                }
            })

            if (funcError) {
                console.error('Embedding generation failed:', funcError)
            } else {
                console.log('Embedding generated for note:', noteId)
            }
        } catch (err) {
            console.error('Error calling embed-note function:', err)
        }
    }

    async function deleteNote(id) {
        try {
            isLoading.value = true
            error.value = null

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('User not authenticated')
            }

            // Soft delete (archive)
            const { error: deleteError } = await supabase
                .from('exam_note')
                .update({ is_archived: true })
                .eq('id', id)
                .eq('user_id', user.id)

            if (deleteError) throw deleteError

            // Remove from local state
            const index = notes.value.findIndex(n => n.id === id)
            if (index !== -1) {
                notes.value.splice(index, 1)
            }

            console.log('Note archived:', id)
        } catch (err) {
            console.error('Error deleting note:', err)
            error.value = err.message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function togglePin(id) {
        try {
            const note = notes.value.find(n => n.id === id)
            if (!note) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error('User not authenticated')
            }

            const { data, error: updateError } = await supabase
                .from('exam_note')
                .update({ is_pinned: !note.is_pinned })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single()

            if (updateError) throw updateError

            // Update local state
            const index = notes.value.findIndex(n => n.id === id)
            if (index !== -1) {
                notes.value[index] = data
            }

            console.log('Note pin toggled:', id)
        } catch (err) {
            console.error('Error toggling pin:', err)
            error.value = err.message
        }
    }

    async function generateFlashcard(noteContent) {
        console.log('Generating flashcard for:', noteContent)
        // TODO: Implement AI flashcard generation via Edge Function
        // For now, return mock data
        await new Promise(resolve => setTimeout(resolve, 1500))
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
        // State
        notes,
        activeNote,
        isDrawerOpen,
        drawerSource,
        isLoading,
        error,

        // Getters
        getNotesByQuestionId,
        getNoteById,
        pinnedNotes,
        unpinnedNotes,

        // Actions
        fetchNotes,
        openDrawer,
        closeDrawer,
        saveNote,
        deleteNote,
        togglePin,
        generateEmbedding,
        generateFlashcard
    }
})
