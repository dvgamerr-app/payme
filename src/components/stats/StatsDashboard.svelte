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
  $: allUsers = statsData.all_users ?? null
</script>

<Layout showBack={true}>
  <div class="space-y-6">
    <!-- Summary Cards (own) -->
    <SummaryCards
      avgIncome={statsData.average_monthly_income}
      avgSpent={statsData.average_monthly_spending}
    />

    <div class="grid grid-cols-1 gap-16 lg:grid-cols-2">
      <!-- Own Trend Chart -->
      <TrendChart data={statsData.monthly_trends} title="Monthly Trends (You)" />

      <!-- Category Breakdown -->
      <CategoryBreakdown comparisons={statsData.category_comparisons} />
    </div>

    <!-- Admin: All-users section -->
    {#if allUsers}
      <div class="border-border border-t pt-6">
        <h2 class="text-foreground mb-4 text-base font-semibold tracking-wide uppercase">
          All Users Overview
        </h2>

        <!-- Combined summary cards -->
        <SummaryCards
          avgIncome={allUsers.combined_avg_income}
          avgSpent={allUsers.combined_avg_spending}
          label="Combined"
        />

        <!-- Combined trend chart -->
        <div class="mt-6">
          <TrendChart data={allUsers.combined_trends} title="Combined Monthly Trends (All Users)" />
        </div>

        <!-- Per-user trend charts -->
        {#if allUsers.users_trends?.length > 0}
          <div class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {#each allUsers.users_trends as userStat}
              <div>
                <p class="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  {userStat.username}
                </p>
                <TrendChart data={userStat.monthly_trends} title="Trends — {userStat.username}" />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</Layout>
