<script>
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import Layout from './Layout.svelte'
  import MonthNav from './MonthNav.svelte'
  import Summary from './Summary.svelte'
  import SavingsCard from './SavingsCard.svelte'
  import RetirementSavingsCard from './RetirementSavingsCard.svelte'
  import ProjectedSavingsCard from './ProjectedSavingsCard.svelte'
  import VarianceModal from './VarianceModal.svelte'
  import IncomeSection from './IncomeSection.svelte'
  import FixedExpenses from './FixedExpenses.svelte'
  import FixedMonths from './FixedMonths.svelte'
  // import BudgetSection from './BudgetSection.svelte'
  import ItemsSection from './ItemsSection.svelte'
  import Stats from './Stats.svelte'

  export let year = undefined
  export let month = undefined

  let layoutComponent

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

  let showVarianceModal = false
  let summary = null
  let categories = []
  let selectedMonthId = null
  let isCurrentMonth = false

  onMount(async () => {
    await loadData()
  })

  const loadData = async () => {
    // Load categories
    categories = await api.categories.list()
    const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === month?.toLowerCase())

    let current = null
    if (year && month) {
      current = await api.months.create(parseInt(year), monthIndex + 1)
    } else {
      current = await api.months.current()
    }

    if (monthIndex < 0) {
      if (!current || !current.id) {
        console.error('Failed to get current month:', current)
        return
      }
      selectedMonthId = current.id
      isCurrentMonth = true
      await loadMonthSummary(current.id)

      return
    }

    selectedMonthId = current.id
    const now = new Date()
    isCurrentMonth = current.year === now.getFullYear() && current.month === now.getMonth() + 1
    await loadMonthSummary(current.id)
  }

  // async function loadCurrentMonth() {

  // }

  async function loadMonthSummary(monthId) {
    if (!monthId) {
      console.error('invalid monthId:', monthId)
      return
    }

    try {
      const month = await api.months.get(monthId)
      const items = await api.items.list(monthId)

      // ใช้ fixed_expenses สำหรับ current month, fixed_months สำหรับเดือนย้อนหลัง
      let fixedExpenses
      let totalFixed
      if (isCurrentMonth) {
        fixedExpenses = await api.fixedExpenses.list()
        totalFixed = fixedExpenses.reduce((sum, e) => {
          const monthlyAmount = e.frequency === 'yearly' ? e.amount / 12 : e.amount
          const exchangeRate = e.exchange_rate || 1
          return sum + monthlyAmount * exchangeRate
        }, 0)
      } else {
        fixedExpenses = await api.fixedMonths.list(monthId)
        totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
      }

      const totalSpent = items.reduce((sum, i) => sum + i.amount, 0)

      month.remaining = month.remaining + totalFixed
      summary = {
        ...month,
        items,
        fixed_expenses: fixedExpenses,
        total_fixed: totalFixed,
        total_spent: totalSpent,
      }
    } catch (err) {
      console.error('Failed to load month summary:', err)
    }
  }

  async function refresh() {
    if (!selectedMonthId) {
      await loadData()
      return
    }
    await loadMonthSummary(selectedMonthId)
  }

  async function closeMonth() {
    if (!selectedMonthId) {
      alert('No month selected')
      return
    }
    try {
      await api.months.close(selectedMonthId)
      await loadData()
    } catch (err) {
      alert(err.message || 'Failed to close month')
    }
  }
</script>

<Layout bind:this={layoutComponent}>
  <MonthNav {year} {month} />

  {#key selectedMonthId}
    <div
      class="space-y-6"
      in:fly={{ y: 20, duration: 300, delay: 50 }}
      out:fade={{ duration: 200 }}
    >
      {#if summary}
        <Summary
          totalIncome={summary.total_income}
          totalFixed={summary.total_fixed}
          totalSpent={summary.total_spent}
          remaining={summary.remaining}
        />

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <IncomeSection
            monthId={selectedMonthId}
            entries={summary.income_entries}
            totalIncome={summary.total_income}
            isReadOnly={summary.month.is_closed}
            onUpdate={refresh}
          />
          {#if isCurrentMonth}
            <FixedExpenses
              expenses={summary.fixed_expenses}
              totalFixed={summary.total_fixed}
              onUpdate={refresh}
            />
          {:else}
            <FixedMonths
              monthId={selectedMonthId}
              fixedExpenses={summary.fixed_expenses}
              totalFixed={summary.total_fixed}
              onUpdate={refresh}
            />
          {/if}
          <!-- <BudgetSection
          monthId={selectedMonthId}
          budgets={summary.budgets}
          {categories}
          isReadOnly={summary.month.is_closed}
          onUpdate={refresh}
        /> -->
        </div>

        <ItemsSection
          monthId={selectedMonthId}
          items={summary.items}
          {categories}
          isReadOnly={summary.month.is_closed}
          onUpdate={refresh}
        />
      {/if}
    </div>
  {/key}

  <VarianceModal
    bind:isOpen={showVarianceModal}
    budgets={summary?.budgets}
    totalIncome={summary?.total_income}
    totalFixed={summary?.total_fixed}
    totalBudgeted={0}
  />
</Layout>
