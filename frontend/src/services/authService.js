/**
 * Auth Service - Supabase Only
 * Uses Supabase Authentication exclusively (Google OAuth + Email/Password)
 */
import { supabase } from '@/lib/supabase'

const authService = {
  /**
   * Login with Google OAuth
   */
  async loginWithGoogle() {
    // Build the full redirect URL including base path
    const redirectTo = `${window.location.origin}/auth/callback`
    console.log('OAuth redirect URL:', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    })
    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Login with email and password
   * @param {Object} credentials - {email, password}
   */
  async login(credentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email || credentials.username,
      password: credentials.password
    })
    if (error) throw new Error(error.message)

    // Store user info in localStorage for compatibility
    if (data.user) {
      this.storeUserInfo(data.user)
    }

    return { data }
  },

  /**
   * Register with email and password
   * @param {Object} userData - {email, password, username}
   */
  async register(userData) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.username,
          username: userData.username
        }
      }
    })
    if (error) throw new Error(error.message)

    if (data.user) {
      this.storeUserInfo(data.user)
    }

    return { data }
  },

  /**
   * Logout
   */
  async logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    localStorage.removeItem('user_role')
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const userId = localStorage.getItem('user_id')
    return !!userId
  },

  /**
   * Get current user info
   * @returns {Object|null}
   */
  getCurrentUser() {
    const userId = localStorage.getItem('user_id')
    if (!userId) return null

    return {
      id: userId,
      username: localStorage.getItem('username'),
      role: localStorage.getItem('user_role'),
      isAdmin: localStorage.getItem('user_role') === 'admin'
    }
  },

  /**
   * Get current session
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  /**
   * Store user info in localStorage
   * @param {Object} user - Supabase user object
   */
  storeUserInfo(user) {
    localStorage.setItem('user_id', user.id)
    localStorage.setItem('username', user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
    localStorage.setItem('user_role', user.user_metadata?.is_admin ? 'admin' : 'user')
  },

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Called with (event, session)
   * @returns {Object} - Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default authService
