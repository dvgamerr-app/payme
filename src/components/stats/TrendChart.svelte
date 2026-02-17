<script>
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from '@/components/ui/Card.svelte'

  export let data = []

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Chart dimensions
  let width = 0
  const height = 280
  const padding = { top: 20, right: 16, bottom: 50, left: 16 }

  $: innerWidth = Math.max(0, width - padding.left - padding.right)
  $: innerHeight = Math.max(0, height - padding.top - padding.bottom)

  // Scales
  $: maxValue = Math.max(...data.map((d) => Math.max(d.total_income, d.total_spent)), 1)

  // Bar group width and individual bar width
  $: barGroupWidth = data.length > 0 ? innerWidth / data.length : 40
  $: barWidth = Math.max(6, Math.min(20, (barGroupWidth * 0.6) / 2))
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">Monthly Trends</h3>
    <div class="flex gap-4 text-xs">
      <div class="flex items-center gap-1.5">
        <div class="bg-success h-2.5 w-2.5"></div>
        <span class="text-muted-foreground">Income</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="bg-destructive h-2.5 w-2.5"></div>
        <span class="text-muted-foreground">Expenses</span>
      </div>
    </div>
  </div>

  <div class="w-full" bind:clientWidth={width}>
    {#if width > 0 && data.length > 0}
      <svg {width} {height} class="overflow-visible">
        <!-- Grid lines -->
        {#each [0, 0.25, 0.5, 0.75, 1] as tick}
          {@const y = padding.top + innerHeight - tick * innerHeight}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            class="stroke-border"
            stroke-dasharray="4"
          />
        {/each}

        <!-- Bars -->
        {#each data as d, i}
          {@const x = padding.left + i * barGroupWidth + (barGroupWidth - barWidth * 2 - 2) / 2}
          {@const incomeHeight = (d.total_income / maxValue) * innerHeight}
          {@const spentHeight = (d.total_spent / maxValue) * innerHeight}

          <g class="transition-opacity hover:opacity-80">
            <!-- Income Bar -->
            <rect
              {x}
              y={padding.top + innerHeight - incomeHeight}
              width={barWidth}
              height={incomeHeight}
              rx="2"
              class="fill-success"
            >
              <title>Income: {formatCurrency(d.total_income, currencySymbol)}</title>
            </rect>

            <!-- Spent Bar -->
            <rect
              x={x + barWidth + 2}
              y={padding.top + innerHeight - spentHeight}
              width={barWidth}
              height={spentHeight}
              rx="2"
              class="fill-destructive"
            >
              <title>Expenses: {formatCurrency(d.total_spent, currencySymbol)}</title>
            </rect>

            <!-- X Axis Label -->
            <text
              x={x + barWidth + 1}
              y={height - padding.bottom + 16}
              text-anchor="middle"
              class="fill-muted-foreground text-[10px]"
            >
              {new Date(d.year, d.month - 1).toLocaleDateString('en-US', { month: 'short' })}
            </text>
          </g>
        {/each}
      </svg>
    {:else}
      <div class="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        No data available
      </div>
    {/if}
  </div>
</Card>
