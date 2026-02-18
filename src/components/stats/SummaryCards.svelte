<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'

  export let avgIncome = 0
  export let avgSpent = 0
  // Optional: combined/total values shown as secondary sub-label
  export let totalAvgIncome = null
  export let totalAvgSpent = null

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: savingsRate = avgIncome > 0 ? ((avgIncome - avgSpent) / avgIncome) * 100 : 0
  $: totalSavingsRate =
    totalAvgIncome != null && totalAvgIncome > 0
      ? ((totalAvgIncome - (totalAvgSpent ?? 0)) / totalAvgIncome) * 100
      : null
</script>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
  <Card>
    <div class="space-y-1">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Avg. Monthly Income</div>
      <div class="text-foreground text-2xl font-semibold">
        {formatCurrency(avgIncome, currencySymbol)}
      </div>
      {#if totalAvgIncome != null}
        <div class="text-muted-foreground text-[11px]">
          Total: {formatCurrency(totalAvgIncome, currencySymbol)}
        </div>
      {/if}
    </div>
  </Card>

  <Card>
    <div class="space-y-1">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Avg. Monthly Spending</div>
      <div class="text-foreground text-2xl font-semibold">
        {formatCurrency(avgSpent, currencySymbol)}
      </div>
      {#if totalAvgSpent != null}
        <div class="text-muted-foreground text-[11px]">
          Total: {formatCurrency(totalAvgSpent, currencySymbol)}
        </div>
      {/if}
    </div>
  </Card>

  <Card>
    <div class="space-y-1">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Savings Rate</div>
      <div class="text-foreground text-2xl font-semibold">
        {savingsRate.toFixed(1)}%
        <span class="text-muted-foreground ml-1 text-xs font-normal">
          {savingsRate >= 20 ? '(Healthy)' : '(Needs attention)'}
        </span>
      </div>
      {#if totalSavingsRate != null}
        <div class="text-muted-foreground text-[11px]">
          Total: {totalSavingsRate.toFixed(1)}%
        </div>
      {/if}
    </div>
  </Card>
</div>
