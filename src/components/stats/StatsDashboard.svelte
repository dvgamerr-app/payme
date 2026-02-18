<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Layout from '@/components/Layout.svelte'
  import TrendChart from './TrendChart.svelte'
  import CategoryBreakdown from './CategoryBreakdown.svelte'
  import SummaryCards from './SummaryCards.svelte'
  import AllUsersPieChart from './AllUsersPieChart.svelte'
  import AllUsersLineChart from './AllUsersLineChart.svelte'
  import AllUsersStackedChart from './AllUsersStackedChart.svelte'
  import { stats } from '@/stores/stats.js'

  // Props from SSR (fallback)
  export let data = {
    monthly_trends: [],
    category_comparisons: [],
    average_monthly_spending: 0,
    average_monthly_income: 0,
  }

  onMount(async () => {
    const current = get(stats)
    if (!current.data && !current.loading) {
      try {
        await stats.load()
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
  })

  $: statsData = $stats.data || data
  $: all = statsData.all ?? {}
  $: usersTrends = all.users_trends ?? []
</script>

<Layout showBack={true}>
  <div class="space-y-8">
    <!-- ── SECTION 1: Your Summary ──────────────────────────────── -->
    <section class="space-y-4">
      <h2 class="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        Overview
      </h2>
      <!-- Summary cards: your averages + combined all-users sub-label -->
      <SummaryCards
        avgIncome={statsData.average_monthly_income}
        avgSpent={statsData.average_monthly_spending}
        totalAvgIncome={all.combined_avg_income}
        totalAvgSpent={all.combined_avg_spending}
      />
    </section>

    <!-- ── SECTION 2: Your Trends ────────────────────────────────── -->
    <section class="space-y-4">
      <h2 class="text-muted-foreground text-xs font-semibold tracking-widest uppercase">Trends</h2>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart data={statsData.monthly_trends} title="Monthly Trends (You)" />
        <CategoryBreakdown comparisons={statsData.category_comparisons} />
      </div>
    </section>

    <!-- ── SECTION 3: Users ──────────────────────────────────── -->
    {#if usersTrends.length > 0}
      <section class="border-border space-y-4 border-t pt-6">
        <h2 class="text-muted-foreground text-xs font-semibold tracking-widest uppercase">Users</h2>

        <!-- Row 1: Pie (annual share) + Line (income vs expense per user) -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AllUsersPieChart {usersTrends} />
          <AllUsersStackedChart {usersTrends} title="Trends" />
        </div>
        <AllUsersLineChart {usersTrends} />

        <!-- Row 2: Stacked column — monthly expense breakdown by user -->
      </section>
    {/if}
  </div>
</Layout>
