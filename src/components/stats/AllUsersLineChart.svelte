<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'
  import 'charts.css'

  export let usersTrends = []

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Build a unified sorted list of (year-month) keys across
  $: monthKeys = (() => {
    const set = new Set()
    for (const u of usersTrends) {
      for (const m of u.monthly_trends) {
        set.add(`${m.year}-${String(m.month).padStart(2, '0')}`)
      }
    }
    return Array.from(set).sort()
  })()

  const formatMonthKey = (key) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short' })
  }

  // Per-user lookup: key → { income, spent }
  $: userMaps = usersTrends.map((u) => {
    const map = new Map()
    for (const m of u.monthly_trends) {
      map.set(`${m.year}-${String(m.month).padStart(2, '0')}`, {
        income: m.total_income,
        spent: m.total_spent,
      })
    }
    return { username: u.username, map }
  })

  // Global max for normalization
  $: maxValue = (() => {
    let max = 1
    for (const { map } of userMaps) {
      for (const v of map.values()) {
        if (v.income > max) max = v.income
        if (v.spent > max) max = v.spent
      }
    }
    return max
  })()

  // Build rows with correct --start/--end per dataset
  // charts.css line requires --start = previous row's --end, --end = current value
  $: rows = (() => {
    // prev[datasetIndex] tracks the previous --end value
    const prev = []
    // datasets: [user0_income, user0_spent, user1_income, user1_spent, ...]
    const numDatasets = userMaps.length * 2
    for (let i = 0; i < numDatasets; i++) prev[i] = 0

    return monthKeys.map((key) => {
      const cells = userMaps.flatMap((um, i) => {
        const incomeVal = (um.map.get(key)?.income ?? 0) / maxValue
        const spentVal = (um.map.get(key)?.spent ?? 0) / maxValue
        const incomeIdx = i * 2
        const spentIdx = i * 2 + 1
        const incomeCell = {
          start: prev[incomeIdx],
          end: incomeVal,
          datasetIdx: incomeIdx,
          raw: um.map.get(key)?.income ?? 0,
          label: `${um.username} income`,
        }
        const spentCell = {
          start: prev[spentIdx],
          end: spentVal,
          datasetIdx: spentIdx,
          raw: um.map.get(key)?.spent ?? 0,
          label: `${um.username} expenses`,
        }
        prev[incomeIdx] = incomeVal
        prev[spentIdx] = spentVal
        return [incomeCell, spentCell]
      })
      return { key, cells }
    })
  })()

  // Income colors per user (warm palette)
  const INCOME_COLORS = [
    'color-mix(in oklch, var(--success) 82%, var(--background))',
    'color-mix(in oklch, var(--success) 60%, var(--primary))',
    'color-mix(in oklch, var(--success) 50%, var(--background))',
  ]
  // Expense colors per user (cool/destructive palette)
  const EXPENSE_COLORS = [
    'color-mix(in oklch, var(--destructive) 80%, var(--background))',
    'color-mix(in oklch, var(--destructive) 60%, var(--primary))',
    'color-mix(in oklch, var(--destructive) 50%, var(--background))',
  ]

  const cellColor = (datasetIdx) => {
    const userIdx = Math.floor(datasetIdx / 2)
    const isIncome = datasetIdx % 2 === 0
    return isIncome
      ? INCOME_COLORS[userIdx % INCOME_COLORS.length]
      : EXPENSE_COLORS[userIdx % EXPENSE_COLORS.length]
  }
</script>

<Card>
  <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">
      Income &amp; Expenses
    </h3>
    <!-- Legend -->
    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {#each usersTrends as u, i}
        <div class="flex items-center gap-1.5">
          <div class="h-2 w-2" style="background:{INCOME_COLORS[i % INCOME_COLORS.length]};"></div>
          <span class="text-muted-foreground">{u.username} income</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div
            class="h-2 w-2"
            style="background:{EXPENSE_COLORS[i % EXPENSE_COLORS.length]};"
          ></div>
          <span class="text-muted-foreground">{u.username} expenses</span>
        </div>
      {/each}
    </div>
  </div>

  {#if rows.length > 0 && usersTrends.length > 0}
    <div>
      <table
        class="charts-css line multiple show-labels show-data-axes data-spacing-2"
        style=" --labels-size: 2.75rem;"
      >
        <tbody>
          {#each rows as row}
            <tr>
              <th scope="row" class="text-muted-foreground text-xs">{formatMonthKey(row.key)}</th>
              {#each row.cells as cell}
                <td
                  style="--start:{cell.start}; --end:{cell.end}; --color:{cellColor(
                    cell.datasetIdx
                  )};"
                  title="{cell.label}: {formatCurrency(cell.raw, currencySymbol)}"
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
  :global(.charts-css.line) {
    border: none;
    background: transparent;
  }
  :global(.charts-css.line tbody tr th) {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    font-weight: 400;
  }
  :global(.charts-css.line.show-data-axes tbody tr) {
    border-color: var(--border);
  }
</style>
