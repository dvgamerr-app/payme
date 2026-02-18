<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'
  import 'charts.css'

  export let data = []
  export let title = 'Monthly Trends'

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Calculate max value for normalization
  $: maxValue =
    data.length > 0 ? Math.max(...data.map((d) => Math.max(d.total_income, d.total_spent)), 1) : 1

  // Format month label
  const formatMonth = (year, month) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' })
  }
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">{title}</h3>
    <div class="flex gap-4 text-xs">
      <div class="flex items-center gap-1.5">
        <div
          class="h-2.5 w-2.5"
          style="background: color-mix(in oklch, var(--success) 82%, var(--background));"
        ></div>
        <span class="text-muted-foreground">Income</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div
          class="h-2.5 w-2.5"
          style="background: color-mix(in oklch, var(--destructive) 80%, var(--background));"
        ></div>
        <span class="text-muted-foreground">Expenses</span>
      </div>
    </div>
  </div>

  {#if data.length > 0}
    <table
      class="charts-css column multiple show-labels show-data-axes data-spacing-4"
      style="height: 280px; --labels-size: 2.75rem;"
    >
      <tbody>
        {#each data as d}
          <tr>
            <th scope="row" class="text-muted-foreground text-xs">{formatMonth(d.year, d.month)}</th
            >
            <td
              style="--size: {d.total_income /
                maxValue}; --color: color-mix(in oklch, var(--success) 82%, var(--background));"
              title="Income: {formatCurrency(d.total_income, currencySymbol)}"
            >
            </td>
            <td
              style="--size: {d.total_spent /
                maxValue}; --color: color-mix(in oklch, var(--destructive) 80%, var(--background));"
              title="Expenses: {formatCurrency(d.total_spent, currencySymbol)}"
            >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
      No data available
    </div>
  {/if}
</Card>

<style>
  /* Override Charts.css defaults to match design system */
  :global(.charts-css.column) {
    border: none;
    background: transparent;
  }

  :global(.charts-css.column tbody tr th) {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    font-weight: 400;
  }

  :global(.charts-css.column tbody tr td) {
    opacity: 0.9;
    transition: opacity 0.15s ease;
  }

  :global(.charts-css.column tbody tr:hover td) {
    opacity: 1;
  }

  :global(.charts-css.column.show-data-axes tbody tr) {
    border-color: var(--border);
  }
</style>
