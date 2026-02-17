<script>
  import { Moon, Sun, LogOut, ChartColumn, Settings, ArrowLeft } from 'lucide-svelte'
  import { onMount } from 'svelte'
  import { theme } from '@/stores/theme.js'
  import { auth } from '@/stores/auth.js'
  import SettingsModal from './SettingsModal.svelte'

  export let showBack = false

  let isSettingsOpen = false
  let settingsModal

  export const openSettingsToCategories = () => {
    isSettingsOpen = true
    if (settingsModal) {
      settingsModal.openTab('categories')
    }
  }

  // Initialize theme on mount
  onMount(() => {
    theme.init()
  })

  $: isDark = $theme
  $: user = $auth.user

  const openSettings = () => {
    isSettingsOpen = true
  }

  const closeSettings = () => {
    isSettingsOpen = false
  }

  function goToStats() {
    window.location.href = '/stats'
  }
</script>

<div class="min-h-screen">
  <header class="bg-background/95 sticky top-0 z-40 backdrop-blur-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6 md:py-6">
      <div class="flex items-center gap-2 md:gap-3">
        {#if showBack}
          <a
            href="/"
            class="hover:bg-accent -ml-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </a>
        {/if}
        <div>
          <h1 class="text-xl font-bold md:text-2xl">Payme</h1>
          <p class="text-muted-foreground hidden text-sm sm:block">
            Track your family's money.{#if user}
              Hi, <span
                class="bg-primary text-primary-foreground rounded px-1 py-0.5 text-sm font-medium uppercase"
                >{user.username}</span
              >.{/if}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        {#if user}
          <button
            on:click={goToStats}
            class="hover:bg-accent inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Statistics"
          >
            <ChartColumn size={16} />
          </button>
          <button
            on:click={openSettings}
            class="hover:bg-accent inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        {/if}
        <button
          on:click={() => theme.toggle()}
          class="hover:bg-accent inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
          title="Toggle theme"
        >
          {#if isDark}
            <Sun size={16} />
          {:else}
            <Moon size={16} />
          {/if}
          <span class="sr-only">Toggle theme</span>
        </button>
        {#if user}
          <button
            on:click={() => auth.logout()}
            class="hover:bg-accent inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        {/if}
      </div>
    </div>
  </header>
  <main class="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
    <slot />
  </main>
</div>

<SettingsModal bind:this={settingsModal} isOpen={isSettingsOpen} onClose={closeSettings} />
