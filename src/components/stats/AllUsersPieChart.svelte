<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'
  import 'charts.css'

  export let usersTrends = []

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Summarise total spending per user over all available months
  $: userTotals = usersTrends
    .map((u) => ({
      username: u.username,
      total: u.monthly_trends.reduce((sum, m) => sum + m.total_spent, 0),
    }))
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total)

  $: grandTotal = userTotals.reduce((sum, u) => sum + u.total, 0)

  // Pie segments — charts.css pie uses cumulative --start and --end (0–1)
  $: segments = (() => {
    let acc = 0
    return userTotals.map((u, i) => {
      const share = grandTotal > 0 ? u.total / grandTotal : 0
      const start = acc
      acc += share
      return { ...u, share, start, end: acc, index: i }
    })
  })()

  // Color palette matching theme tokens via oklch mix
  const COLORS = [
    'color-mix(in oklch, var(--destructive) 80%, var(--background))',
    'color-mix(in oklch, var(--primary) 80%, var(--background))',
    'color-mix(in oklch, var(--success) 82%, var(--background))',
    'color-mix(in oklch, var(--warning, #f59e0b) 80%, var(--background))',
    'color-mix(in oklch, var(--secondary) 120%, var(--foreground))',
    'color-mix(in oklch, var(--muted-foreground) 70%, var(--background))',
  ]
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
      Annual Spending by User (Last 12 Months)
    </h3>
  </div>

  {#if segments.length > 0}
    <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <!-- Pie chart -->
      <div class="shrink-0" style="width: 180px; height: 180px;">
        <table class="charts-css pie" style="width: 180px; height: 180px;">
          <tbody>
            {#each segments as seg}
              <tr>
                <td
                  style="--start: {seg.start}; --end: {seg.end}; --color: {COLORS[
                    seg.index % COLORS.length
                  ]};"
                  title="{seg.username}: {formatCurrency(seg.total, currencySymbol)} ({(
                    seg.share * 100
                  ).toFixed(1)}%)"
                ></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Legend + amounts -->
      <div class="flex-1 space-y-2 text-sm">
        {#each segments as seg}
          <div class="flex items-center gap-2">
            <div
              class="h-3 w-3 shrink-0"
              style="background: {COLORS[seg.index % COLORS.length]};"
            ></div>
            <span class="text-foreground min-w-[80px] font-medium">{seg.username}</span>
            <span class="text-muted-foreground ml-auto tabular-nums">
              {formatCurrency(seg.total, currencySymbol)}
            </span>
            <span class="text-muted-foreground w-12 text-right text-xs tabular-nums">
              {(seg.share * 100).toFixed(1)}%
            </span>
          </div>
        {/each}
        <div class="border-border mt-2 border-t pt-2">
          <div class="flex items-center gap-2">
            <div class="h-3 w-3"></div>
            <span class="text-muted-foreground min-w-[80px] text-xs tracking-wide uppercase"
              >Total</span
            >
            <span class="text-foreground ml-auto font-semibold tabular-nums">
              {formatCurrency(grandTotal, currencySymbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-muted-foreground flex h-40 items-center justify-center text-sm">
      No spending data available
    </div>
  {/if}
</Card>
