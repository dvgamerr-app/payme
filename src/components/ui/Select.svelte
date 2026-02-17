<script>
  import { ChevronDown } from 'lucide-svelte'

  /**
   * Custom Select Component
   * @prop {string} label - Optional label text
   * @prop {Array} options - Array of {value, label} objects
   * @prop {string|number} value - Selected value
   * @prop {string} placeholder - Placeholder text when no value selected
   * @prop {boolean} disabled - Whether the select is disabled
   * @prop {string} name - Form field name
   * @prop {boolean} required - Whether the field is required
   * @prop {string} className - Additional CSS classes
   * @prop {Function} onchange - Callback function when value changes
   */
  export let label = ''
  export let options = []
  export let value = ''
  export let placeholder = 'เลือก...'
  export let disabled = false
  export let name = ''
  export let required = false
  export let className = ''
  export let onchange = () => {}

  let isOpen = false
  let highlightedIndex = -1
  let selectId = `select-${Math.random().toString(36).substr(2, 9)}`
  let buttonRef = null

  // Use == for loose comparison to handle string/number type differences
  $: selectedOption = options.find((opt) => opt.value == value)
  $: selectedLabel = selectedOption?.label || ''
  $: currentIndex = options.findIndex((opt) => opt.value == value)

  // Reset highlight when opening dropdown
  $: if (isOpen) {
    highlightedIndex = currentIndex >= 0 ? currentIndex : 0
  }

  function toggleDropdown() {
    if (disabled) return
    isOpen = !isOpen
  }

  function selectOption(optionValue) {
    const prevValue = value
    value = optionValue
    isOpen = false
    highlightedIndex = -1

    if (prevValue !== optionValue) {
      onchange({ value: optionValue })
    }

    // Return focus to button
    buttonRef?.focus()
  }

  function handleClickOutside(event) {
    if (!event.target.closest(`#${selectId}`)) {
      isOpen = false
      highlightedIndex = -1
    }
  }

  function handleKeyDown(event) {
    if (disabled) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          isOpen = true
        } else {
          highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          isOpen = true
        } else {
          highlightedIndex = Math.max(highlightedIndex - 1, 0)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
          selectOption(options[highlightedIndex].value)
        } else if (!isOpen) {
          isOpen = true
        }
        break
      case 'Escape':
        event.preventDefault()
        isOpen = false
        highlightedIndex = -1
        break
      case 'Tab':
        // Close dropdown on tab but allow default behavior
        isOpen = false
        highlightedIndex = -1
        break
      case 'Home':
        if (isOpen) {
          event.preventDefault()
          highlightedIndex = 0
        }
        break
      case 'End':
        if (isOpen) {
          event.preventDefault()
          highlightedIndex = options.length - 1
        }
        break
      default:
        // Type-ahead: find option starting with pressed key
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          const char = event.key.toLowerCase()
          const startIndex = isOpen ? highlightedIndex + 1 : 0

          // Search from current position
          let foundIndex = options.findIndex(
            (opt, idx) => idx >= startIndex && opt.label.toLowerCase().startsWith(char)
          )

          // Wrap around if not found
          if (foundIndex === -1) {
            foundIndex = options.findIndex((opt) => opt.label.toLowerCase().startsWith(char))
          }

          if (foundIndex !== -1) {
            if (!isOpen) isOpen = true
            highlightedIndex = foundIndex
          }
        }
        break
    }
  }

  function scrollToHighlighted(node) {
    return {
      update(highlighted) {
        if (highlighted && node) {
          const highlightedEl = node.querySelector(`[data-highlighted="true"]`)
          if (highlightedEl) {
            highlightedEl.scrollIntoView({ block: 'nearest' })
          }
        }
      },
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex flex-col gap-1 {className}" id={selectId}>
  {#if label}
    <label for="{selectId}-button" class="text-foreground text-sm font-medium">
      {label}
      {#if required}
        <span class="text-destructive">*</span>
      {/if}
    </label>
  {/if}

  <!-- Hidden input for form submission -->
  {#if name}
    <input type="hidden" {name} {value} {required} />
  {/if}

  <div class="relative">
    <button
      bind:this={buttonRef}
      id="{selectId}-button"
      type="button"
      role="combobox"
      on:click|stopPropagation={toggleDropdown}
      on:keydown={handleKeyDown}
      class="border-border placeholder:text-muted-foreground w-full border-b bg-transparent px-0 py-2 text-left text-sm transition-colors focus:outline-none
        {isOpen ? 'border-foreground' : 'focus:border-foreground hover:border-accent'}
        {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls="{selectId}-listbox"
      aria-activedescendant={isOpen && highlightedIndex >= 0
        ? `${selectId}-option-${highlightedIndex}`
        : undefined}
      aria-disabled={disabled}
      {disabled}
      {...$$restProps}
    >
      <div class="flex items-center justify-between">
        <span class={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          class="text-muted-foreground transition-transform {isOpen ? 'rotate-180' : ''}"
        />
      </div>
    </button>

    {#if isOpen}
      <div
        id="{selectId}-listbox"
        role="listbox"
        aria-label={label || 'Select options'}
        class="bg-card border-border absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-xs border shadow-lg"
        use:scrollToHighlighted={highlightedIndex}
      >
        {#each options as opt, index (opt.value)}
          <button
            id="{selectId}-option-{index}"
            type="button"
            role="option"
            aria-selected={opt.value === value}
            data-highlighted={highlightedIndex === index}
            on:click={() => selectOption(opt.value)}
            on:mouseenter={() => (highlightedIndex = index)}
            class="text-foreground block w-full px-3 py-2 text-left text-sm transition-colors
              {opt.value === value ? 'bg-muted font-medium' : ''}
              {highlightedIndex === index ? 'bg-accent' : 'hover:bg-muted'}"
          >
            {opt.label}
          </button>
        {/each}

        {#if options.length === 0}
          <div class="text-muted-foreground px-3 py-2 text-center text-sm">ไม่มีตัวเลือก</div>
        {/if}
      </div>
    {/if}
  </div>
</div>
