<script>
  import { onMount } from 'svelte'
  import { TrendingUp, Pencil, Check, X } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'
  import Input from './ui/Input.svelte'

  let amount = 0
  let isEditing = false
  let editValue = ''

  $: currencySymbol = $settings.currencySymbol || '฿'

  onMount(async () => {
    const res = await api.retirementSavings.get()
    amount = res.retirement_savings
  })

  function startEdit() {
    editValue = amount.toString()
    isEditing = true
  }

  function cancelEdit() {
    isEditing = false
    editValue = ''
  }

  async function saveEdit() {
    const value = parseFloat(editValue)
    if (isNaN(value)) return
    await api.retirementSavings.update(value)
    amount = value
    isEditing = false
  }
</script>

<Card>
  <div class="flex items-start justify-between">
    <div>
      <div class="text-charcoal-500 dark:text-charcoal-400 mb-1 text-xs">Retirement Savings</div>
      {#if isEditing}
        <div class="flex items-center gap-2">
          <Input
            type="text"
            bind:value={editValue}
            formatAsNumber={true}
            className="w-28 !py-1"
            autofocus
          />
          <button
            on:click={saveEdit}
            class="text-sage-600 hover:bg-sage-100 dark:hover:bg-sage-900 p-1 transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            on:click={cancelEdit}
            class="text-charcoal-400 hover:bg-sand-100 dark:hover:bg-charcoal-800 p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      {:else}
        <div class="flex items-center gap-2">
          <span class="text-sage-700 dark:text-sage-400 text-xl font-semibold">
            {formatCurrency(amount, currencySymbol)}
          </span>
          <button
            on:dblclick={startEdit}
            class="hover:bg-sand-200 dark:hover:bg-charcoal-700 p-1 transition-colors"
          >
            <Pencil size={14} class="text-charcoal-400" />
          </button>
        </div>
      {/if}
    </div>
    <TrendingUp size={20} class="text-sage-600 dark:text-sage-400" />
  </div>
</Card>
