<script>
  import { onMount } from 'svelte'
  import { Vault, Pencil, Check, X } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'
  import Input from './ui/Input.svelte'

  export let onSavingsChange = () => {}

  let savings = 0
  let isEditing = false
  let editValue = ''
  let isMobile = false

  const checkMobile = () => {
    isMobile = window.innerWidth <= 768
  }

  if (typeof window !== 'undefined') {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  $: currencySymbol = $settings.currencySymbol || '฿'

  onMount(async () => {
    const res = await api.savings.get()
    savings = res.savings
    onSavingsChange(res.savings)
  })

  function startEdit() {
    editValue = savings.toString()
    isEditing = true
  }

  function cancelEdit() {
    isEditing = false
    editValue = ''
  }

  async function saveEdit() {
    const value = parseFloat(editValue)
    if (isNaN(value)) return
    await api.savings.update(value)
    savings = value
    onSavingsChange(value)
    isEditing = false
  }
</script>

<Card className="!p-3">
  <div class="mb-1 flex items-center justify-between">
    <span class="text-charcoal-500 dark:text-charcoal-400 text-xs"> Savings </span>
    <Vault size={14} class="text-sage-600" />
  </div>
  {#if isEditing}
    <div class="flex items-center gap-1">
      <Input
        type="text"
        bind:value={editValue}
        formatAsNumber={true}
        className="flex-1 !py-1 !text-sm"
        autofocus
      />
      <button
        on:click={saveEdit}
        class="text-sage-600 hover:bg-sage-100 dark:hover:bg-sage-900 p-1 transition-colors"
      >
        <Check size={14} />
      </button>
      <button
        on:click={cancelEdit}
        class="text-charcoal-400 hover:bg-sand-100 dark:hover:bg-charcoal-800 p-1 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  {:else}
    <div class="flex items-center justify-between">
      <span class="text-sage-700 dark:text-sage-400 text-sm font-semibold">
        {formatCurrency(savings, currencySymbol)}
      </span>
      <button
        on:click={() => isMobile && startEdit()}
        on:dblclick={() => !isMobile && startEdit()}
        class="hover:bg-sand-200 dark:hover:bg-charcoal-700 p-0.5 transition-colors"
      >
        <Pencil size={12} class="text-charcoal-400" />
      </button>
    </div>
  {/if}
</Card>
