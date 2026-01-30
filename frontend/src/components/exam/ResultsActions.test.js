import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ResultsActions from './ResultsActions.vue'
import examService from '@/services/examService'
import flashcardService from '@/services/flashcardService'

// Mock the services
vi.mock('@/services/examService')
vi.mock('@/services/flashcardService')

describe('ResultsActions', () => {
  let mockResults
  let pinia

  const mountWithPinia = (options) => {
    return mount(ResultsActions, {
      ...options,
      global: {
        plugins: [pinia]
      }
    })
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    mockResults = {
      examId: 'exam-123',
      correctCount: 2,
      totalCount: 5,
      percentage: 40,
      details: [
        {
          questionId: 'q1',
          question: 'What is 2+2?',
          userAnswer: '4',
          correctAnswer: '4',
          isCorrect: true
        },
        {
          questionId: 'q2',
          question: 'What is 3+3?',
          userAnswer: '5',
          correctAnswer: '6',
          isCorrect: false
        },
        {
          questionId: 'q3',
          question: 'What is 4+4?',
          userAnswer: '7',
          correctAnswer: '8',
          isCorrect: false
        },
        {
          questionId: 'q4',
          question: 'What is 5+5?',
          userAnswer: '10',
          correctAnswer: '10',
          isCorrect: true
        },
        {
          questionId: 'q5',
          question: 'What is 6+6?',
          userAnswer: '11',
          correctAnswer: '12',
          isCorrect: false
        }
      ],
      wrongQuestionIds: ['q2', 'q3', 'q5']
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  it('displays correct number of wrong questions', () => {
    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    expect(wrapper.text()).toContain('You got 3 questions wrong')
    expect(wrapper.find('.actions-subtitle').text()).toContain('3 questions wrong')
  })

  it('shows bookmark and flashcard actions when there are wrong questions', () => {
    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const actionCards = wrapper.findAll('.action-card')
    expect(actionCards).toHaveLength(4) // bookmark, flashcard, retake, return

    expect(wrapper.text()).toContain('Bookmark Wrong Questions')
    expect(wrapper.text()).toContain('Create Flashcards')
    expect(wrapper.text()).toContain('Retake Exam')
    expect(wrapper.text()).toContain('Back to Exam List')
  })

  it('hides bookmark and flashcard actions when all questions are correct', () => {
    const perfectResults = {
      ...mockResults,
      correctCount: 5,
      percentage: 100,
      details: mockResults.details.map(detail => ({ ...detail, isCorrect: true })),
      wrongQuestionIds: []
    }

    const wrapper = mountWithPinia({
      props: { results: perfectResults }
    })

    const actionCards = wrapper.findAll('.action-card')
    expect(actionCards).toHaveLength(2) // only retake and return

    expect(wrapper.text()).not.toContain('Bookmark Wrong Questions')
    expect(wrapper.text()).not.toContain('Create Flashcards')
  })

  it('handles bookmark wrong questions action', async () => {
    examService.addBookmark.mockResolvedValue({ success: true })

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    await bookmarkButton.trigger('click')

    expect(examService.addBookmark).toHaveBeenCalledWith(['q2', 'q3', 'q5'])
    
    // Wait for async operation
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Successfully bookmarked 3 questions')
  })

  it('handles bookmark error gracefully', async () => {
    examService.addBookmark.mockRejectedValue(new Error('Network error'))

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    await bookmarkButton.trigger('click')

    // Wait for async operation
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Network error')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  it('handles create flashcards action', async () => {
    const mockFlashcard = { id: 1, question: 'q2' }
    flashcardService.createFlashcard.mockResolvedValue(mockFlashcard)

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const flashcardButton = wrapper.find('[aria-label="Create flashcards for 3 wrong questions"]')
    await flashcardButton.trigger('click')

    expect(flashcardService.createFlashcard).toHaveBeenCalledTimes(3)
    // Verify it's called with question ID, not question content
    expect(flashcardService.createFlashcard).toHaveBeenCalledWith({ question: 'q2' })
    expect(flashcardService.createFlashcard).toHaveBeenCalledWith({ question: 'q3' })
    expect(flashcardService.createFlashcard).toHaveBeenCalledWith({ question: 'q5' })
    
    // Wait for async operation
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Successfully created 3 flashcards')
  })

  it('handles flashcard creation error gracefully', async () => {
    flashcardService.createFlashcard.mockRejectedValue(new Error('Service unavailable'))

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const flashcardButton = wrapper.find('[aria-label="Create flashcards for 3 wrong questions"]')
    await flashcardButton.trigger('click')

    // Wait for async operation
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Service unavailable')
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  it('emits retake-exam event when retake button is clicked', async () => {
    const wrapper = mountWithPinia({
      props: { 
        results: mockResults,
        examName: 'Math Quiz'
      }
    })

    const retakeButton = wrapper.find('[aria-label="Retake this exam"]')
    await retakeButton.trigger('click')

    expect(wrapper.emitted('retake-exam')).toBeTruthy()
    expect(wrapper.emitted('retake-exam')[0]).toEqual([{
      examId: 'exam-123',
      examName: 'Math Quiz'
    }])
  })

  it('emits return-to-list event when back button is clicked', async () => {
    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const backButton = wrapper.find('[aria-label="Return to exam list"]')
    await backButton.trigger('click')

    expect(wrapper.emitted('return-to-list')).toBeTruthy()
  })

  it('shows loading states during async operations', async () => {
    examService.addBookmark.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    await bookmarkButton.trigger('click')

    expect(wrapper.text()).toContain('Bookmarking...')
    expect(bookmarkButton.attributes('disabled')).toBeDefined()
  })

  it('dismisses error messages when dismiss button is clicked', async () => {
    examService.addBookmark.mockRejectedValue(new Error('Test error'))

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    await bookmarkButton.trigger('click')

    // Wait for error to appear
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.error-message').exists()).toBe(true)

    const dismissButton = wrapper.find('.error-dismiss')
    await dismissButton.trigger('click')

    expect(wrapper.find('.error-message').exists()).toBe(false)
  })

  it('auto-dismisses success messages after timeout', async () => {
    vi.useFakeTimers()
    examService.addBookmark.mockResolvedValue({ success: true })

    const wrapper = mountWithPinia({
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    await bookmarkButton.trigger('click')

    // Wait for success message
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.success-message').exists()).toBe(true)

    // Fast-forward time
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.success-message').exists()).toBe(false)

    vi.useRealTimers()
  })

  it('handles accessibility attributes correctly', () => {
    const wrapper = mount(ResultsActions, {
      props: { results: mockResults }
    })

    const bookmarkButton = wrapper.find('[aria-label="Bookmark 3 wrong questions"]')
    expect(bookmarkButton.attributes('aria-label')).toBe('Bookmark 3 wrong questions')

    const flashcardButton = wrapper.find('[aria-label="Create flashcards for 3 wrong questions"]')
    expect(flashcardButton.attributes('aria-label')).toBe('Create flashcards for 3 wrong questions')

    const retakeButton = wrapper.find('[aria-label="Retake this exam"]')
    expect(retakeButton.attributes('aria-label')).toBe('Retake this exam')

    const backButton = wrapper.find('[aria-label="Return to exam list"]')
    expect(backButton.attributes('aria-label')).toBe('Return to exam list')
  })

  it('validates props correctly', () => {
    const validResults = {
      examId: 'test',
      details: [],
      wrongQuestionIds: []
    }

    const wrapper = mountWithPinia({
      props: { results: validResults }
    })

    // Component should render correctly with valid props
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.wrongQuestionCount).toBe(0)
  })
})
