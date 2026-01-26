<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'

  export let totalIncome = 0
  export let totalFixed = 0
  export let totalSpent = 0
  export let remaining = 0

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Calculate remaining percentage and color
  $: remainingPercent = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0

  // Calculate color variable for REMAINING based on percentage
  $: remainingColorVar = (() => {
    const percent = remainingPercent

    if (percent >= 50) {
      return 'var(--color-remaining-positive-50)'
    } else if (percent >= 25) {
      return 'var(--color-remaining-positive-25)'
    } else if (percent > 0) {
      return 'var(--color-remaining-positive-0)'
    } else if (percent === 0) {
      return 'var(--color-remaining-negative-0)'
    } else if (percent >= -5) {
      return 'var(--color-remaining-negative-5)'
    } else if (percent >= -10) {
      return 'var(--color-remaining-negative-10)'
    } else if (percent >= -15) {
      return 'var(--color-remaining-negative-15)'
    } else {
      return 'var(--color-remaining-negative-20)'
    }
  })()

  $: items = [
    {
      label: 'INCOME',
      value: totalIncome,
    },
    {
      label: 'FIXED',
      value: totalFixed,
    },
    {
      label: 'SPENT',
      value: totalSpent,
    },
    {
      label: 'REMAINING',
      value: remaining,
    },
  ]
</script>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
  {#each items as item}
    <Card>
      <div class="space-y-2">
        <div class="text-muted-foreground text-xs uppercase">
          {item.label}
        </div>
        <div
          class="text-foreground text-2xl font-semibold"
          style={item.label === 'REMAINING' ? `color: ${remainingColorVar}` : ''}
        >
          {formatCurrency(item.value, currencySymbol)}
        </div>
      </div>
    </Card>
  {/each}
</div>
