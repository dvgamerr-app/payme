<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Layout from '@/components/Layout.svelte'
  import TrendChart from './TrendChart.svelte'
  import CategoryBreakdown from './CategoryBreakdown.svelte'
  import SummaryCards from './SummaryCards.svelte'
  import { stats } from '@/stores/stats.js'

  // Props from SSR (fallback)
  export let data = {
    monthly_trends: [],
    category_comparisons: [],
    average_monthly_spending: 0,
    average_monthly_income: 0,
  }

  onMount(async () => {
    // Only load if not already loaded (e.g., via Layout preload)
    const current = get(stats)
    if (!current.data && !current.loading) {
      try {
        await stats.load()
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
  })

  // Use store data if available, otherwise use SSR data
  $: statsData = $stats.data || data
</script>

<Layout showBack={true}>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <SummaryCards
      avgIncome={statsData.average_monthly_income}
      avgSpent={statsData.average_monthly_spending}
    />

    <div class="grid grid-cols-1 gap-16 lg:grid-cols-2">
      <!-- Trend Chart -->
      <TrendChart data={statsData.monthly_trends} />

      <!-- Category Breakdown -->
      <CategoryBreakdown comparisons={statsData.category_comparisons} />
    </div>
  </div>
</Layout>
