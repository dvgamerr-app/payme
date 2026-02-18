<script>
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

  // Reset to initialTab and load settings when modal opens
  $: if (isOpen) {
    activeTab = initialTab
    settings.load()
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

  const paydayOptions = [
    { value: 'end', label: 'สิ้นเดือน', description: 'End of Month' },
    { value: '25', label: 'วันที่ 25', description: '25th of month' },
    { value: '28', label: 'วันที่ 28', description: '28th of month' },
  ]

  // Reactive values from settings store
  $: selectedCurrency = $settings.baseCurrency || 'THB'
  $: selectedPayday = $settings.payday || 'end'
  $: currencyLocked = $settings.currencyLocked ?? false

  const selectCurrency = async (currency) => {
    selectedCurrency = currency.code
    await settings.save({
      baseCurrency: currency.code,
      currencySymbol: currency.symbol,
      payday: selectedPayday,
    })
  }

  const selectPayday = async (option) => {
    selectedPayday = option.value
    await settings.save({
      baseCurrency: selectedCurrency,
      currencySymbol: currencies.find((c) => c.code === selectedCurrency)?.symbol || '฿',
      payday: option.value,
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

<Modal {isOpen} {onClose} title="Settings" variant="slide" noScroll>
  <div class="flex h-full flex-col gap-4">
    <!-- Tabs - Horizontal style -->
    <div class="border-border flex shrink-0 gap-1 overflow-x-auto border-b pb-2">
      {#each tabs as tab}
        <button
          class="flex shrink-0 items-center gap-2 px-3 py-2 text-left transition-colors {activeTab ===
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

    <!-- Content (scrollable) -->
    <div class="flex-1 overflow-y-auto px-1">
      {#if activeTab === 'general'}
        <div class="flex flex-col gap-6">
          <p class="text-muted-foreground -mt-2 text-[0.9375rem]">
            Customize your finance dashboard preferences.
          </p>

          <div class="flex flex-col gap-4">
            <h3 class="m-0 text-[0.9375rem] font-semibold">Currency</h3>
            {#if currencyLocked}
              <div class="border-border bg-secondary/40 flex items-start gap-3 border p-3">
                <div class="mt-0.5 shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="square"
                    stroke-linejoin="miter"
                    class="text-muted-foreground"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="0" ry="0"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div class="flex flex-col gap-1">
                  <p class="text-foreground text-sm font-medium">Currency cannot be changed</p>
                  <p class="text-muted-foreground text-xs">
                    You already have spending items recorded. Changing currency would make
                    historical data inconsistent. Current currency: <span
                      class="text-foreground font-medium">{selectedCurrency}</span
                    >
                  </p>
                </div>
              </div>
            {:else}
              <div class="grid grid-cols-1 gap-2">
                {#each currencies as currency}
                  <button
                    class="flex items-center gap-3 border px-3 py-2.5 text-left transition-colors {selectedCurrency ===
                    currency.code
                      ? 'border-[#d4a574] bg-linear-to-br from-[#d4a574]/10 to-[#d4a574]/5'
                      : 'border-border hover:border-muted-foreground hover:bg-secondary/50'}"
                    on:click={() => selectCurrency(currency)}
                  >
                    <span
                      class="bg-muted flex h-8 w-8 items-center justify-center font-mono text-sm font-medium"
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
            {/if}
          </div>

          <div class="flex flex-col gap-4">
            <h3 class="m-0 text-[0.9375rem] font-semibold">วันเงินเดือนออก (Payday)</h3>
            <div class="grid grid-cols-1 gap-2">
              {#each paydayOptions as option}
                <button
                  class="flex flex-col items-center gap-1 border px-3 py-3 transition-colors {selectedPayday ===
                  option.value
                    ? 'border-[#d4a574] bg-linear-to-br from-[#d4a574]/10 to-[#d4a574]/5'
                    : 'border-border hover:border-muted-foreground hover:bg-secondary/50'}"
                  on:click={() => selectPayday(option)}
                >
                  <span class="text-sm font-medium">{option.label}</span>
                  <span class="text-muted-foreground text-xs">{option.description}</span>
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
