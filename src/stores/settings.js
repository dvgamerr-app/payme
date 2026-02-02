import { writable } from 'svelte/store'
import logger from '@/lib/client-logger.js'
import { api } from '@/lib/api.js'

const defaultSettings = {
  baseCurrency: 'THB',
  currencySymbol: '฿',
  payday: 'end', // 'end', '25', '28'
  loaded: false,
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(defaultSettings)

  return {
    subscribe,

    async load() {
      try {
        const data = await api.settings.get()
        set({
          baseCurrency: data.baseCurrency || 'THB',
          currencySymbol: data.currencySymbol || '฿',
          payday: data.payday || 'end',
          loaded: true,
        })
      } catch (error) {
        logger.error('Failed to load settings', error)
        set({ ...defaultSettings, loaded: true })
      }
    },

    async save({ baseCurrency, currencySymbol, payday }) {
      try {
        const data = await api.settings.update({ baseCurrency, currencySymbol, payday })
        update((state) => ({
          ...state,
          baseCurrency: data.baseCurrency,
          currencySymbol: data.currencySymbol,
          payday: data.payday,
        }))
        return true
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
