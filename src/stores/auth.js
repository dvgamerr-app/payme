import { writable } from 'svelte/store'
import logger from '@/lib/client-logger.js'
import { api, isAuthenticated, startTokenRefresh, stopTokenRefresh } from '@/lib/api.js'

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
    error: null,
  })

  return {
    subscribe,

    checkAuth: async () => {
      // Check if we have a valid token
      if (!isAuthenticated()) {
        set({ user: null, loading: false, error: null })
        return
      }

      try {
        const user = await api.auth.me()
        startTokenRefresh()
        set({ user, loading: false, error: null })
      } catch (_error) {
        set({ user: null, loading: false, error: null })
      }
    },

    register: async (username, password) => {
      try {
        update((state) => ({ ...state, loading: true, error: null }))
        const user = await api.auth.register(username, password)
        set({ user, loading: false, error: null })
        return { success: true }
      } catch (error) {
        update((state) => ({ ...state, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }
    },

    login: async (username, password) => {
      try {
        update((state) => ({ ...state, loading: true, error: null }))
        const user = await api.auth.login(username, password)
        set({ user, loading: false, error: null })
        return { success: true }
      } catch (error) {
        update((state) => ({ ...state, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }
    },

    logout: async () => {
      try {
        await api.auth.logout()
        stopTokenRefresh()
        set({ user: null, loading: false, error: null })
        window.location.href = '/login'
      } catch (error) {
        logger.error('Logout failed', error)
      }
    },

    clearError: () => {
      update((state) => ({ ...state, error: null }))
    },
  }
}

export const auth = createAuthStore()
