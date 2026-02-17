<script>
  import { TrendingUp, TrendingDown, AlertCircle, PartyPopper } from 'lucide-svelte'
  import Modal from './ui/Modal.svelte'

  export let isOpen = false
  export let budgets = []
  export let totalIncome = 0
  export let totalFixed = 0
  export let totalBudgeted = 0

  function handleClose() {
    isOpen = false
  }

  $: {
    const overBudgetItems = []
    const underBudgetItems = []
    const unplannedItems = []

    budgets.forEach((b) => {
      const variance = b.spent_amount - b.allocated_amount
      const item = {
        label: b.category_label,
        allocated: b.allocated_amount,
        spent: b.spent_amount,
        variance,
        isUnplanned: b.allocated_amount === 0 && b.spent_amount > 0,
      }

      if (item.isUnplanned) {
        unplannedItems.push(item)
      } else if (variance > 0) {
        overBudgetItems.push(item)
      } else if (variance < 0) {
        underBudgetItems.push(item)
      }
    })

    overBudgetItems.sort((a, b) => b.variance - a.variance)
    unplannedItems.sort((a, b) => b.spent - a.spent)
    underBudgetItems.sort((a, b) => a.variance - b.variance)

    overBudget = overBudgetItems
    underBudget = underBudgetItems
    unplanned = unplannedItems
  }

  let overBudget = []
  let underBudget = []
  let unplanned = []

  $: totalOverspend = overBudget.reduce((sum, b) => sum + b.variance, 0)
  $: totalUnplanned = unplanned.reduce((sum, b) => sum + b.spent, 0)
  $: totalSaved = underBudget.reduce((sum, b) => sum + Math.abs(b.variance), 0)
  $: incomeNeeded = totalFixed + totalBudgeted
  $: incomeShortfall = incomeNeeded > totalIncome ? incomeNeeded - totalIncome : 0
  $: netVariance = totalOverspend + totalUnplanned - totalSaved
  $: isOnTrack = netVariance <= 0 && incomeShortfall === 0
</script>

<Modal bind:isOpen onClose={handleClose} title="Budget Analysis">
  <div class="space-y-6">
    {#if isOnTrack}
      <div class="bg-sage-100 dark:bg-sage-900/30 flex items-center gap-3 p-4">
        <PartyPopper class="text-sage-600 shrink-0" size={24} />
        <div>
          <p class="text-sage-700 dark:text-sage-400 font-semibold">
            {netVariance < 0 ? "You're ahead of budget!" : "You're right on track!"}
          </p>
          {#if netVariance < 0}
            <p class="text-sage-600 dark:text-sage-500 text-sm">
              You've saved ${Math.abs(netVariance).toFixed(2)} more than planned across your categories.
            </p>
          {/if}
          {#if underBudget.length > 0}
            <p class="text-sage-600 dark:text-sage-500 mt-1 text-sm">
              Great discipline! {underBudget.length}
              {underBudget.length === 1 ? 'category is' : 'categories are'} under budget.
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center gap-3 p-4">
        <AlertCircle class="text-terracotta-600 shrink-0" size={24} />
        <div>
          <p class="text-terracotta-700 dark:text-terracotta-400 font-semibold">
            You're ${(totalOverspend + totalUnplanned + incomeShortfall).toFixed(2)} over budget
          </p>
          <p class="text-terracotta-600 dark:text-terracotta-500 text-sm">
            Here's what's affecting your projected savings:
          </p>
        </div>
      </div>
    {/if}

    {#if incomeShortfall > 0}
      <div>
        <h4
          class="text-terracotta-700 dark:text-terracotta-400 mb-2 flex items-center gap-2 text-sm font-semibold"
        >
          <AlertCircle size={16} />
          Income Shortfall
        </h4>
        <p class="text-charcoal-600 dark:text-charcoal-300 text-sm">
          Your income (${totalIncome.toFixed(2)}) is short of your planned expenses (${incomeNeeded.toFixed(
            2
          )}) by <strong>${incomeShortfall.toFixed(2)}</strong>.
        </p>
      </div>
    {/if}

    {#if unplanned.length > 0}
      <div>
        <h4
          class="text-terracotta-700 dark:text-terracotta-400 mb-2 flex items-center gap-2 text-sm font-semibold"
        >
          <AlertCircle size={16} />
          Unplanned Spending (${totalUnplanned.toFixed(2)})
        </h4>
        <div class="space-y-2">
          {#each unplanned as item}
            <div class="flex items-center justify-between text-sm">
              <span class="text-charcoal-700 dark:text-sand-300">{item.label}</span>
              <span class="text-terracotta-600 dark:text-terracotta-400 font-medium">
                ${item.spent.toFixed(2)}
              </span>
            </div>
          {/each}
        </div>
        <p class="text-charcoal-500 dark:text-charcoal-400 mt-2 text-xs">
          These categories had no budget but you spent money on them.
        </p>
      </div>
    {/if}

    {#if overBudget.length > 0}
      <div>
        <h4
          class="text-terracotta-700 dark:text-terracotta-400 mb-2 flex items-center gap-2 text-sm font-semibold"
        >
          <TrendingUp size={16} />
          Over Budget (${totalOverspend.toFixed(2)})
        </h4>
        <div class="space-y-2">
          {#each overBudget as item}
            <div class="text-sm">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-charcoal-700 dark:text-sand-300">{item.label}</span>
                <span class="text-terracotta-600 dark:text-terracotta-400 font-medium">
                  +${item.variance.toFixed(2)}
                </span>
              </div>
              <div class="text-charcoal-500 dark:text-charcoal-400 text-xs">
                Budgeted: ${item.allocated.toFixed(2)}, Spent: ${item.spent.toFixed(2)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if underBudget.length > 0}
      <div>
        <h4
          class="text-sage-700 dark:text-sage-400 mb-2 flex items-center gap-2 text-sm font-semibold"
        >
          <TrendingDown size={16} />
          Under Budget (saved ${totalSaved.toFixed(2)})
        </h4>
        <div class="space-y-2">
          {#each underBudget as item}
            <div class="text-sm">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-charcoal-700 dark:text-sand-300">{item.label}</span>
                <span class="text-sage-600 dark:text-sage-400 font-medium">
                  ${Math.abs(item.variance).toFixed(2)}
                </span>
              </div>
              <div class="text-charcoal-500 dark:text-charcoal-400 text-xs">
                Budgeted: ${item.allocated.toFixed(2)}, Spent: ${item.spent.toFixed(2)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="border-sand-300 dark:border-charcoal-700 border-t pt-4">
      <div class="flex items-center justify-between text-sm">
        <span class="text-charcoal-700 dark:text-sand-300 font-medium">Net Impact on Savings:</span>
        <span
          class="text-lg font-semibold {netVariance <= 0
            ? 'text-sage-600 dark:text-sage-400'
            : 'text-terracotta-600 dark:text-terracotta-400'}"
        >
          {netVariance <= 0 ? '+' : '-'}${Math.abs(netVariance).toFixed(2)}
        </span>
      </div>
    </div>
  </div>
</Modal>

<style>
  /* Optional: Add styles for modal content */
</style>
