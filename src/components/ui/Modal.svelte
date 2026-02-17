<script>
  import { onDestroy } from 'svelte'
  import { X } from 'lucide-svelte'

  /**
   * Modal Component
   * @prop {boolean} isOpen - Modal visibility state
   * @prop {string} title - Optional modal title
   */
  export let isOpen = false
  export let title = ''
  export let onClose = () => {}
  export let size = 'md' // 'sm', 'md', 'lg', 'xl'
  export let noScroll = false // When true, content manages its own scrolling
  export let variant = 'center' // 'center' or 'slide'

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  let isMobile = false
  const checkMobile = () => {
    isMobile = window.innerWidth <= 768
  }

  if (typeof window !== 'undefined') {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  function handleClose() {
    isOpen = false
    onClose()
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  })

  // Reactive statement to handle body overflow
  $: if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-50 flex {isMobile || variant === 'slide'
      ? 'items-end md:items-center md:justify-end'
      : 'items-center justify-center'}"
    on:keydown={handleKeydown}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div
      class="bg-charcoal-900/50 absolute inset-0 backdrop-blur-sm"
      on:click={handleBackdropClick}
    ></div>
    <div
      class="bg-card relative {isMobile || variant === 'slide'
        ? 'animate-slideIn h-full w-full md:h-full md:w-[480px] md:max-w-[90vw]'
        : 'animate-fadeIn mx-4 w-full ' + sizeClasses[size]} overflow-hidden shadow-md"
      style={isMobile || variant === 'slide' ? '' : 'height: 600px; max-height: 90vh;'}
    >
      <div class="flex h-full flex-col">
        <div
          class="border-border mb-0 flex flex-shrink-0 items-center justify-between border-b px-4 py-4 md:px-6"
        >
          {#if title}
            <h2 class="text-foreground text-lg font-semibold">
              {title}
            </h2>
          {/if}
          <button
            on:click={handleClose}
            class="hover:bg-accent ml-auto p-1.5 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div class="flex-1 px-4 py-4 md:px-6 {noScroll ? 'overflow-hidden' : 'overflow-y-auto'}">
          <slot />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
</style>
