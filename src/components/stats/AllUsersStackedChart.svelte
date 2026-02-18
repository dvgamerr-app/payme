<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'
  import 'charts.css'

  // usersTrends: Array<{ username, monthly_trends: [{ year, month, total_income, total_spent }] }>
  export let usersTrends = []
  export let title = 'Trends'

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Build unified sorted month axis
  $: monthKeys = (() => {
    const set = new Set()
    for (const u of activeUsersTrends) {
      for (const m of u.monthly_trends) {
        set.add(`${m.year}-${String(m.month).padStart(2, '0')}`)
      }
    }
    return Array.from(set).sort()
  })()

  // Only include users that have actual monthly data
  $: activeUsersTrends = usersTrends.filter((u) => u.monthly_trends.length > 0)

  // Per-user map: key → total_spent
  $: userMaps = activeUsersTrends.map((u) => {
    const map = new Map()
    for (const m of u.monthly_trends) {
      map.set(`${m.year}-${String(m.month).padStart(2, '0')}`, m.total_spent)
    }
    return { username: u.username, map }
  })

  // Max stacked value per month for normalization
  $: maxStack = (() => {
    let max = 1
    for (const key of monthKeys) {
      const total = userMaps.reduce((s, um) => s + (um.map.get(key) ?? 0), 0)
      if (total > max) max = total
    }
    return max
  })()

  const formatMonthKey = (key) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' })
  }

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
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">{title}</h3>
    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {#each activeUsersTrends as u, i}
        <div class="flex items-center gap-1.5">
          <div class="h-2.5 w-2.5" style="background:{COLORS[i % COLORS.length]};"></div>
          <span class="text-muted-foreground">{u.username}</span>
        </div>
      {/each}
    </div>
  </div>

  {#if monthKeys.length > 0 && usersTrends.length > 0}
    <div>
      <!--
        charts.css stacked column:
        Each <tr> = one month (label on X-axis).
        Each <td> in the row = one user's spending segment.
        --start and --end define the stacked position (0–1 relative to maxStack).
      -->
      <table
        class="charts-css column stacked multiple show-labels show-data-axes data-spacing-4"
        style="height: 280px; --labels-size: 2.75rem;"
      >
        <tbody>
          {#each monthKeys as key}
            {@const rowValues = userMaps.map((um) => um.map.get(key) ?? 0)}
            {@const rowTotal = rowValues.reduce((s, v) => s + v, 0)}
            <tr>
              <th scope="row" class="text-muted-foreground text-xs">{formatMonthKey(key)}</th>
              {#each rowValues as val, i}
                {@const start = rowValues.slice(0, i).reduce((s, v) => s + v, 0) / maxStack}
                {@const end = (rowValues.slice(0, i).reduce((s, v) => s + v, 0) + val) / maxStack}
                <td
                  style="--start:{start}; --end:{end}; --size:{end - start}; --color:{COLORS[
                    i % COLORS.length
                  ]};"
                  title="{userMaps[i].username}: {formatCurrency(
                    val,
                    currencySymbol
                  )} (Total: {formatCurrency(rowTotal, currencySymbol)})"
                ></td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
      No data available
    </div>
  {/if}
</Card>

<style>
  :global(.charts-css.column.stacked) {
    border: none;
    background: transparent;
  }
  :global(.charts-css.column.stacked tbody tr th) {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    font-weight: 400;
  }
  :global(.charts-css.column.stacked tbody tr td) {
    opacity: 0.9;
    transition: opacity 0.15s ease;
  }
  :global(.charts-css.column.stacked tbody tr:hover td) {
    opacity: 1;
  }
  :global(.charts-css.column.stacked.show-data-axes tbody tr) {
    border-color: var(--border);
  }
</style>
