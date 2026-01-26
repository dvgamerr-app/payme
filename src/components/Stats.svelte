<script>
  import { onMount } from 'svelte'
  import { BarChart3 } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import Modal from './ui/Modal.svelte'
  import Button from './ui/Button.svelte'

  const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  let isOpen = false
  let stats = null
  let loading = false

  // Reactive statement to load stats when modal opens
  $: if (isOpen && !stats) {
    loadStats()
  }

  async function loadStats() {
    loading = true
    try {
      stats = await api.stats.get()
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      loading = false
    }
  }

  function openModal() {
    isOpen = true
  }

  function closeModal() {
    isOpen = false
    // Reset state when closing
    stats = null
    loading = false
  }

  $: trendData =
    stats?.monthly_trends
      ?.slice()
      .reverse()
      .map((m) => ({
        name: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
        income: m.total_income,
        spent: m.total_spent,
        net: m.net,
      })) || []
</script>

<Button variant="ghost" size="sm" on:click={openModal}>
  <BarChart3 size={16} class="mr-2" />
  Stats
</Button>

<Modal bind:isOpen onClose={closeModal} title="Statistics">
  {#if loading}
    <div class="text-charcoal-500 py-8 text-center">Loading...</div>
  {:else if stats}
    <div class="space-y-6">
      {#if trendData.length > 1}
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-sand-100 dark:bg-charcoal-800 p-4">
            <div class="text-charcoal-500 dark:text-charcoal-400 mb-1 text-xs">
              Avg Monthly Spending
            </div>
            <div class="text-terracotta-600 dark:text-terracotta-400 text-lg font-semibold">
              ${stats.average_monthly_spending.toFixed(2)}
            </div>
          </div>
          <div class="bg-sand-100 dark:bg-charcoal-800 p-4">
            <div class="text-charcoal-500 dark:text-charcoal-400 mb-1 text-xs">
              Avg Monthly Income
            </div>
            <div class="text-sage-600 dark:text-sage-400 text-lg font-semibold">
              ${stats.average_monthly_income.toFixed(2)}
            </div>
          </div>
        </div>
      {/if}

      {#if stats.category_spending?.length > 0}
        <div>
          <h4 class="text-charcoal-700 dark:text-sand-200 mb-3 text-sm font-medium">
            Spending by Category
          </h4>
          <div class="space-y-2">
            {#each stats.category_spending as cat}
              <div
                class="border-sand-200 dark:border-charcoal-800 flex items-center justify-between border-b py-2"
              >
                <span class="text-charcoal-700 dark:text-sand-300 text-sm">
                  {cat.category_label}
                </span>
                <span class="text-terracotta-600 dark:text-terracotta-400 text-sm font-medium">
                  ${cat.total_spent.toFixed(2)}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if trendData.length > 0}
        <div>
          <h4 class="text-charcoal-700 dark:text-sand-200 mb-3 text-sm font-medium">
            Monthly Trends
          </h4>
          <div class="space-y-2">
            {#each trendData as month}
              <div class="bg-sand-100 dark:bg-charcoal-800 rounded p-3">
                <div class="text-charcoal-600 dark:text-charcoal-400 mb-2 text-xs font-medium">
                  {month.name}
                </div>
                <div class="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div class="text-charcoal-500 dark:text-charcoal-500">Income</div>
                    <div class="text-sage-600 dark:text-sage-400 font-semibold">
                      ${month.income.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div class="text-charcoal-500 dark:text-charcoal-500">Spent</div>
                    <div class="text-terracotta-600 dark:text-terracotta-400 font-semibold">
                      ${month.spent.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div class="text-charcoal-500 dark:text-charcoal-500">Net</div>
                    <div
                      class="font-semibold {month.net >= 0
                        ? 'text-sage-600 dark:text-sage-400'
                        : 'text-terracotta-600 dark:text-terracotta-400'}"
                    >
                      ${month.net.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if stats.recent_months?.length > 0}
        <div>
          <h4 class="text-charcoal-700 dark:text-sand-200 mb-3 text-sm font-medium">
            Recent Months Comparison
          </h4>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-sand-300 dark:border-charcoal-700 border-b">
                  <th class="text-charcoal-600 dark:text-sand-400 py-2 text-left font-medium"
                    >Month</th
                  >
                  <th class="text-charcoal-600 dark:text-sand-400 py-2 text-right font-medium"
                    >Income</th
                  >
                  <th class="text-charcoal-600 dark:text-sand-400 py-2 text-right font-medium"
                    >Fixed</th
                  >
                  <th class="text-charcoal-600 dark:text-sand-400 py-2 text-right font-medium"
                    >Spent</th
                  >
                  <th class="text-charcoal-600 dark:text-sand-400 py-2 text-right font-medium"
                    >Net</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each stats.recent_months as month}
                  <tr class="border-sand-200 dark:border-charcoal-800 border-b">
                    <td class="text-charcoal-700 dark:text-sand-300 py-2">
                      {MONTH_NAMES[month.month - 1]}
                      {month.year}
                    </td>
                    <td class="text-sage-600 dark:text-sage-400 py-2 text-right">
                      ${month.total_income.toFixed(2)}
                    </td>
                    <td class="text-charcoal-600 dark:text-charcoal-400 py-2 text-right">
                      ${month.total_fixed.toFixed(2)}
                    </td>
                    <td class="text-terracotta-600 dark:text-terracotta-400 py-2 text-right">
                      ${month.total_spent.toFixed(2)}
                    </td>
                    <td
                      class="py-2 text-right font-medium {month.net >= 0
                        ? 'text-sage-600 dark:text-sage-400'
                        : 'text-terracotta-600 dark:text-terracotta-400'}"
                    >
                      ${month.net.toFixed(2)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</Modal>

<style>
  /* Optional: Add fade-in animation for stats content */
</style>
