import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/services/authService', () => ({
  default: { isAuthenticated: vi.fn(() => false) }
}))

import LandingView from '../views/LandingView.vue'

describe('mobile responsive fix regression checks', () => {
  it('uses responsive landing demo image and prevents horizontal overflow', () => {
    const wrapper = mount(LandingView)
    const image = wrapper.get('img[alt="ext-demo"]')

    expect(image.classes()).toContain('demo-image')
    expect(image.attributes('width')).toBeUndefined()
  })
})
