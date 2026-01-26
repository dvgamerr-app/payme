<script>
  import { TrendingUp, HelpCircle } from 'lucide-svelte'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'

  export let savings = 0
  export let remaining = 0
  export let onAnalyzeClick = null

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: projected = savings + remaining
</script>

<Card className="!p-3">
  <div class="mb-1 flex items-center justify-between">
    <span class="text-charcoal-500 dark:text-charcoal-400 text-xs"> Projected </span>
    <TrendingUp size={14} class="text-sage-600" />
  </div>
  <div class="flex items-center justify-between">
    <span class="text-sage-700 dark:text-sage-400 text-sm font-semibold">
      {formatCurrency(projected, currencySymbol)}
    </span>
    {#if onAnalyzeClick}
      <button
        on:click={onAnalyzeClick}
        class="hover:bg-sand-200 dark:hover:bg-charcoal-700 rounded p-0.5 transition-colors"
        title="Why this amount?"
      >
        <HelpCircle
          size={14}
          class="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-300"
        />
      </button>
    {/if}
  </div>
</Card>
