import { writable } from 'svelte/store'
import { api } from '@/lib/api.js'

function createStatsStore() {
  const { subscribe, set, update } = writable({
    data: null,
    loading: false,
    error: null,
  })

  return {
    subscribe,

    async load() {
      update((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await api.stats.get()
        // Reverse trends for chronological order (oldest first)
        if (data.monthly_trends) {
          data.monthly_trends = [...data.monthly_trends].reverse()
        }
        set({ data, loading: false, error: null })
        return data
      } catch (error) {
        update((s) => ({ ...s, loading: false, error: error.message }))
        throw error
      }
    },

    clear() {
      set({ data: null, loading: false, error: null })
    },
  }
}

export const stats = createStatsStore()
