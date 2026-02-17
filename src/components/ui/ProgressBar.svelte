<script>
  /**
   * Progress Bar Component
   * @prop {number} value - Current value
   * @prop {number} max - Maximum value
   * @prop {boolean} showOverage - Show overage text
   */
  export let value = 0
  export let max = 100
  export let showOverage = true

  $: percentage = max > 0 ? (value / max) * 100 : 0
  $: isOver = value > max
  $: overage = value - max

  export let color = 'chart-1'

  function getColor() {
    if (percentage >= 100) return 'bg-chart-3'
    return `bg-${color}`
  }
</script>

<div class="space-y-1">
  <div class="bg-muted h-1.5 overflow-hidden">
    <div
      class="h-full transition-all duration-300 {getColor()}"
      style="width: {Math.min(percentage, 100)}%"
    ></div>
  </div>
  {#if isOver && showOverage}
    <div class="text-destructive text-xs">
      +${overage.toFixed(2)} over
    </div>
  {/if}
</div>
