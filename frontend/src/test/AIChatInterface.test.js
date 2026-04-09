import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AIChatInterface from '@/components/AIChatInterface.vue'

vi.mock('pinia', () => ({
  storeToRefs: (store) => store
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({})
}))

const chatStoreMock = {
  messages: ref([]),
  historyItems: ref([]),
  isLoading: ref(false),
  isHistoryLoading: ref(false),
  errorMessage: ref(''),
  initialize: vi.fn().mockResolvedValue(undefined),
  sendMessage: vi.fn(),
  clearError: vi.fn(),
  refreshHistory: vi.fn()
}

vi.mock('@/stores/chatStore', () => ({
  useChatStore: () => chatStoreMock
}))

describe('AIChatInterface', () => {
  beforeEach(() => {
    chatStoreMock.messages.value = []
    chatStoreMock.historyItems.value = []
    chatStoreMock.isLoading.value = false
    chatStoreMock.isHistoryLoading.value = false
    chatStoreMock.errorMessage.value = ''
    chatStoreMock.initialize.mockClear()
    chatStoreMock.sendMessage.mockClear()
    chatStoreMock.clearError.mockClear()
    chatStoreMock.refreshHistory.mockClear()
  })

  it('applies prefill text on initial mount', async () => {
    const wrapper = mount(AIChatInterface, {
      props: {
        prefill: {
          text: 'Explain this question',
          stamp: 123
        }
      }
    })

    await nextTick()
    await nextTick()

    expect(wrapper.find('textarea').element.value).toBe('Explain this question')
  })

  it('updates the textarea when the prefill stamp changes', async () => {
    const wrapper = mount(AIChatInterface, {
      props: {
        prefill: {
          text: '',
          stamp: 0
        }
      }
    })

    await wrapper.setProps({
      prefill: {
        text: 'First click should fill this',
        stamp: 456
      }
    })

    await nextTick()

    expect(wrapper.find('textarea').element.value).toBe('First click should fill this')
  })
})
