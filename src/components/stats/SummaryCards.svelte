<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'

  export let avgIncome = 0
  export let avgSpent = 0

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: savingsRate = avgIncome > 0 ? ((avgIncome - avgSpent) / avgIncome) * 100 : 0
</script>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
  <Card>
    <div class="space-y-2">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Avg. Monthly Income</div>
      <div class="text-foreground text-2xl font-semibold">
        {formatCurrency(avgIncome, currencySymbol)}
      </div>
    </div>
  </Card>

  <Card>
    <div class="space-y-2">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Avg. Monthly Spending</div>
      <div class="text-foreground text-2xl font-semibold">
        {formatCurrency(avgSpent, currencySymbol)}
      </div>
    </div>
  </Card>

  <Card>
    <div class="space-y-2">
      <div class="text-muted-foreground text-xs tracking-wide uppercase">Savings Rate</div>
      <div class="text-foreground text-2xl font-semibold">
        {savingsRate.toFixed(1)}%
        <span class="text-muted-foreground ml-1 text-xs font-normal">
          {savingsRate >= 20 ? '(Healthy)' : '(Needs attention)'}
        </span>
      </div>
    </div>
  </Card>
</div>
