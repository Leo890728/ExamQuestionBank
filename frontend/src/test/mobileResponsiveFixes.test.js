import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const readSource = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf-8')

describe('mobile responsive fix regression checks', () => {
  it('keeps NoteDrawer mobile width at 100% and uses dynamic viewport height', () => {
    const source = readSource('../components/notes/NoteDrawer.vue')

    expect(source).toContain("return { width: '100%' }")
    expect(source).toContain('height: 100dvh;')
  })

  it('uses responsive landing demo image and prevents horizontal overflow', () => {
    const source = readSource('../views/LandingView.vue')

    expect(source).toContain('<img src="../assets/demo.png" alt="ext-demo" class="demo-image">')
    expect(source).toContain('overflow-x: hidden;')
    expect(source).toContain('width: min(100%, 600px);')
  })
})
