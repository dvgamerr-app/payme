import { writable } from 'svelte/store'
import logger from '@/lib/client-logger.js'

const defaultSettings = {
  baseCurrency: 'THB',
  currencySymbol: '฿',
  loaded: false,
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(defaultSettings)

  return {
    subscribe,

    async load() {
      try {
        const response = await fetch('/api/settings', {
          credentials: 'same-origin',
        })
        if (response.ok) {
          const data = await response.json()
          set({
            baseCurrency: data.baseCurrency || 'THB',
            currencySymbol: data.currencySymbol || '฿',
            loaded: true,
          })
        } else {
          set({ ...defaultSettings, loaded: true })
        }
      } catch (error) {
        logger.error('Failed to load settings', error)
        set({ ...defaultSettings, loaded: true })
      }
    },

    async save({ baseCurrency, currencySymbol }) {
      try {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseCurrency, currencySymbol }),
        })

        if (response.ok) {
          const data = await response.json()
          update((state) => ({
            ...state,
            baseCurrency: data.baseCurrency,
            currencySymbol: data.currencySymbol,
          }))
          return true
        } else {
          return false
        }
      } catch (error) {
        logger.error('Failed to save settings', error)
        return false
      }
    },

    updateLocal(newSettings) {
      update((state) => ({ ...state, ...newSettings }))
    },

    reset() {
      set(defaultSettings)
    },
  }
}

export const settings = createSettingsStore()
