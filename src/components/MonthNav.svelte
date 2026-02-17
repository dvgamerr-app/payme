<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
  import { settings } from '@/stores/settings.js'
  import { onMount } from 'svelte'

  export let year = undefined
  export let month = undefined

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

  // Load settings on mount
  onMount(() => {
    settings.load()
  })

  // Reactive payday from settings store
  $: payday = $settings.payday || 'end'

  // Determine current year/month from props or current date
  $: currentYear = year || new Date().getFullYear().toString()
  $: currentMonth =
    (month
      ? MONTH_NAMES.findIndex((m) => m.toLowerCase() === month?.toLowerCase())
      : new Date().getMonth()) + 1

  function goPrev() {
    let prevYear = currentYear
    let prevMonth = currentMonth - 1

    if (prevMonth < 1) {
      prevMonth = 12
      prevYear--
    }

    const monthName = MONTH_NAMES[prevMonth - 1]
    const link = document.createElement('a')
    link.href = `/${prevYear}/${monthName}`
    link.dataset.astroTransition = 'backward'
    link.click()
  }

  function goNext() {
    let nextYear = currentYear
    let nextMonth = currentMonth + 1

    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    }

    const link = document.createElement('a')
    link.href = `/${nextYear}/${MONTH_NAMES[nextMonth - 1]}`
    link.dataset.astroTransition = 'forward'
    link.click()
  }

  // Check if user can access next month based on payday setting
  function canAccessNextMonth(paydaySetting) {
    const now = new Date()
    const today = now.getDate()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1 // 1-indexed

    // Calculate target month/year for next button
    let targetMonth = currentMonth + 1
    let targetYear = parseInt(currentYear)
    if (targetMonth > 12) {
      targetMonth = 1
      targetYear++
    }

    // If target is in the past or current month, allow
    if (targetYear < nowYear) return true
    if (targetYear === nowYear && targetMonth <= nowMonth) return true

    // If target is next month, check if payday has passed
    if (targetYear === nowYear && targetMonth === nowMonth + 1) {
      let paydayDate
      if (paydaySetting === 'end') {
        // Last day of current month
        paydayDate = new Date(nowYear, nowMonth, 0).getDate()
      } else {
        paydayDate = parseInt(paydaySetting)
      }
      return today >= paydayDate
    }

    // For January next year when we're in December
    if (targetYear === nowYear + 1 && targetMonth === 1 && nowMonth === 12) {
      let paydayDate
      if (paydaySetting === 'end') {
        paydayDate = new Date(nowYear, 12, 0).getDate() // Last day of December
      } else {
        paydayDate = parseInt(paydaySetting)
      }
      return today >= paydayDate
    }

    return false
  }

  $: nextDisabled = !canAccessNextMonth(payday)
</script>

<div class="mb-4 flex items-center justify-between md:mb-6">
  <div class="flex items-center gap-2">
    <button
      on:click={goPrev}
      class="hover:bg-accent flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-20"
    >
      <ChevronLeft size={18} />
    </button>
    <div class="text-base font-medium md:text-lg">
      {MONTH_NAMES[currentMonth - 1]}
      {currentYear}
    </div>
    <button
      on:click={goNext}
      disabled={nextDisabled}
      class="hover:bg-accent flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-20"
    >
      <ChevronRight size={18} />
    </button>
  </div>

  <div class="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
    Savings goal
    <span class="text-accent-gold font-medium">฿10,000</span>
  </div>
</div>
