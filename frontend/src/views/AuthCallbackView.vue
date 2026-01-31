<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <p class="mt-3">正在完成登入...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

/**
 * Notify Precedent extension of successful login via BroadcastChannel
 */
function notifyExtensionOfLogin(user, session) {
  try {
    // Check if this login was initiated from the extension
    const urlParams = new URLSearchParams(window.location.search)
    const source = urlParams.get('source')
    const localUserId = urlParams.get('local_user_id')
    
    if (source === 'precedent_extension') {
      console.log('🔗 Extension login detected, broadcasting auth success...')
      
      // Use BroadcastChannel to notify the extension
      const channel = new BroadcastChannel('precedent_auth')
      channel.postMessage({
        type: 'AUTH_SUCCESS',
        userId: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        accessToken: session.access_token,
        localUserId: localUserId // The extension's local user ID for linking
      })
      
      // Also store in localStorage for the extension to read via content script
      localStorage.setItem('precedent_auth_success', JSON.stringify({
        userId: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        timestamp: Date.now(),
        localUserId: localUserId
      }))
      
      console.log('✅ Extension notified of login success')
      
      // Close window after short delay if opened by extension
      setTimeout(() => {
        channel.close()
        // If this was a popup, close it
        if (window.opener) {
          window.close()
        }
      }, 1500)
    }
  } catch (err) {
    console.warn('Could not notify extension:', err)
  }
}

onMounted(async () => {
  try {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    let session = null

    if (code) {
      // PKCE flow (default in supabase-js v2)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
      session = data.session
    } else if (window.location.hash) {
      // Implicit flow fallback (older providers)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        if (error) throw error
        session = data.session
      }
    } else {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      session = data.session
    }

    if (session) {
      console.log('Login successful:', session.user.email)
      
      // Store user info for compatibility with existing code
      const user = session.user
      localStorage.setItem('user_id', user.id)
      localStorage.setItem('username', user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      localStorage.setItem('user_role', user.user_metadata?.is_admin ? 'admin' : 'user')
      
      // Notify Precedent extension if this was an extension-initiated login
      notifyExtensionOfLogin(user, session)
      
      // Check for intended path
      const intendedPath = sessionStorage.getItem('intended_path')
      sessionStorage.removeItem('intended_path')
      
      // Clear the hash from URL
      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      
      // Redirect to intended path or practice page (unless extension popup)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('source') !== 'precedent_extension') {
        router.push(intendedPath || '/practice')
      }
    } else {
      console.log('No session found after OAuth callback')
      router.push('/')
    }
  } catch (err) {
    console.error('Auth callback error:', err)
    router.push('/')
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-primary, #f5f5f5);
}

.loading-container {
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary, white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.loading-container p {
  color: var(--text-secondary, #666);
  margin-bottom: 0;
}
</style>
