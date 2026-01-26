<script>
  import { onMount } from 'svelte'
  import { Settings, DollarSign, List } from 'lucide-svelte'
  import Modal from './ui/Modal.svelte'
  import CategoryModal from './CategoryModal.svelte'
  import { settings } from '@/stores/settings.js'
  import { api } from '@/lib/api.js'

  export let isOpen = false
  export let onClose = () => {}
  export let initialTab = 'general'

  let activeTab = initialTab
  let categories = []

  // Allow external control of active tab
  export const openTab = (tab) => {
    activeTab = tab
  }

  // Reset to initialTab when modal opens
  $: if (isOpen) {
    activeTab = initialTab
  }

  const currencies = [
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  ]

  let selectedCurrency = 'THB'

  onMount(() => {
    const unsubscribe = settings.subscribe((state) => {
      if (state.loaded) {
        selectedCurrency = state.baseCurrency
      }
    })

    return unsubscribe
  })

  const selectCurrency = async (currency) => {
    selectedCurrency = currency.code
    await settings.save({
      baseCurrency: currency.code,
      currencySymbol: currency.symbol,
    })
  }

  const loadCategories = async () => {
    try {
      categories = await api.categories.list()
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  $: if (isOpen && activeTab === 'categories') {
    loadCategories()
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'categories', label: 'Categories', icon: List },
  ]
</script>

<Modal {isOpen} {onClose} title="Settings" size="xl">
  <div class="flex gap-4">
    <!-- Sidebar -->
    <div class="border-border flex w-40 flex-col gap-1 border-r pr-3">
      {#each tabs as tab}
        <button
          class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors {activeTab ===
          tab.id
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:bg-secondary/50'}"
          on:click={() => (activeTab = tab.id)}
        >
          <svelte:component this={tab.icon} size={16} />
          <span class="text-sm">{tab.label}</span>
        </button>
      {/each}
    </div>

    <!-- Content -->
    <div class="flex-1">
      {#if activeTab === 'general'}
        <div class="flex flex-col gap-6">
          <p class="text-muted-foreground -mt-2 text-[0.9375rem]">
            Customize your finance dashboard preferences.
          </p>

          <div class="flex flex-col gap-4">
            <h3 class="m-0 text-[0.9375rem] font-semibold">Currency</h3>
            <div class="grid grid-cols-2 gap-2">
              {#each currencies as currency}
                <button
                  class="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors {selectedCurrency ===
                  currency.code
                    ? 'border-[#d4a574] bg-linear-to-br from-[#d4a574]/10 to-[#d4a574]/5'
                    : 'border-border hover:border-muted-foreground hover:bg-secondary/50'}"
                  on:click={() => selectCurrency(currency)}
                >
                  <span
                    class="bg-muted flex h-8 w-8 items-center justify-center rounded-md font-mono text-sm font-medium"
                  >
                    {currency.symbol}
                  </span>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{currency.code}</span>
                    <span class="text-muted-foreground text-xs">{currency.name}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>
      {:else if activeTab === 'categories'}
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="m-0 mb-1 text-[0.9375rem] font-semibold">Manage Categories</h3>
            <p class="text-muted-foreground text-sm">
              Create and organize spending categories for your budget.
            </p>
          </div>
          <CategoryModal {categories} onUpdate={loadCategories} />
        </div>
      {/if}
    </div>
  </div>
</Modal>
