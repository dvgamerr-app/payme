<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'

  export let comparisons = []

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Sort by current month spent descending, filter out zero amounts
  $: sortedData = [...comparisons]
    .filter((c) => c.current_month_spent > 0)
    .sort((a, b) => b.current_month_spent - a.current_month_spent)

  $: maxSpent = Math.max(...sortedData.map((c) => c.current_month_spent), 1)
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
      Spending by Category (This Year)
    </h3>
  </div>

  {#if sortedData.length > 0}
    <div class="max-h-80 min-h-40 space-y-3 overflow-y-auto">
      {#each sortedData as item}
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-foreground">{item.category_label}</span>
            <span class="text-foreground font-medium">
              {formatCurrency(item.current_month_spent, currencySymbol)}
            </span>
          </div>
          <!-- Progress Bar -->
          <div class="bg-secondary h-1.5 w-full overflow-hidden">
            <div
              class="bg-primary h-full transition-all duration-500"
              style="width: {(item.current_month_spent / maxSpent) * 100}%"
            ></div>
          </div>
          <!-- Change Stats -->
          {#if item.change_amount !== 0}
            <div class="text-muted-foreground flex items-center justify-end gap-1 text-[10px]">
              <span>vs Last Year:</span>
              <span class={item.change_amount > 0 ? 'text-destructive' : 'text-success'}>
                {item.change_amount > 0 ? '+' : ''}{formatCurrency(
                  item.change_amount,
                  currencySymbol
                )}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-muted-foreground py-6 text-center text-sm">
      No spending data for this month
    </div>
  {/if}
</Card>
