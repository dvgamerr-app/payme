<script>
  import { Plus, GripVertical } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import { dndzone } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import Card from './ui/Card.svelte'
  import Input from './ui/Input.svelte'
  import SaveButtons from './ui/SaveButtons.svelte'
  import DeleteButton from './ui/DeleteButton.svelte'

  export let monthId
  export let fixedExpenses = []
  export let totalFixed = 0
  export let onUpdate = () => {}

  let isAdding = false
  let editingId = null
  let name = ''
  let amount = ''
  let amountInput = null
  let isMobile = false

  const flipDurationMs = 0

  const checkMobile = () => {
    isMobile = window.innerWidth <= 768
  }

  if (typeof window !== 'undefined') {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: items = fixedExpenses.map((exp) => ({ id: exp.id, data: exp }))

  $: if (editingId && amountInput && !isMobile) {
    amountInput.focus()
  }

  async function handleAdd() {
    if (!name || !amount) return
    await api.fixedMonths.create(monthId, {
      name,
      amount: parseFloat(amount),
    })
    name = ''
    amount = ''
    isAdding = false
    await onUpdate()
  }

  async function handleUpdate(id) {
    if (!name || !amount) return
    await api.fixedMonths.update(monthId, id, {
      name,
      amount: parseFloat(amount),
    })
    editingId = null
    name = ''
    amount = ''
    onUpdate()
  }

  async function handleDelete(id) {
    await api.fixedMonths.delete(monthId, id)
    onUpdate()
  }

  function startEdit(expense) {
    isAdding = false
    editingId = expense.id
    name = expense.name
    amount = expense.amount.toString()
  }

  function cancelEdit() {
    editingId = null
    name = ''
    amount = ''
    isAdding = false
  }

  function startAdd() {
    cancelEdit()
    isAdding = true
  }

  function handleDndConsider(e) {
    items = e.detail.items
  }

  async function handleDndFinalize(e) {
    items = e.detail.items
    const newOrder = items.map((item) => item.data.id)
    try {
      await api.fixedMonths.reorder(monthId, newOrder)
    } catch (error) {
      console.error('Failed to reorder fixed months:', error)
      onUpdate()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (editingId) {
        handleUpdate(editingId)
      } else if (isAdding) {
        handleAdd()
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">Fixed</h3>
    <button
      on:click={startAdd}
      class="hover:bg-accent flex h-7 w-7 items-center justify-center transition-colors"
    >
      <Plus size={16} />
    </button>
  </div>

  <div class="space-y-0 overflow-y-auto md:max-h-60 md:min-h-60">
    <div
      use:dndzone={{
        items,
        flipDurationMs,
        type: 'fixedMonths',
        dragDisabled: editingId !== null || isAdding,
        dropTargetStyle: {},
      }}
      on:consider={handleDndConsider}
      on:finalize={handleDndFinalize}
    >
      {#each items as item (item.id)}
        {@const expense = item.data}
        <div
          animate:flip={{ duration: flipDurationMs }}
          class="group flex items-center justify-between outline-none focus:outline-none"
        >
          {#if editingId === expense.id}
            <div class="flex flex-1 items-end gap-2 pl-4">
              <div class="flex-1">
                <Input placeholder="Name" bind:value={name} on:keydown={handleKeyDown} />
              </div>
              <div class="w-26">
                <div class="flex items-center bg-transparent">
                  <div class="text-muted-foreground mr-2 text-sm select-none">
                    {currencySymbol}
                  </div>
                  <Input
                    type="text"
                    placeholder="Amount"
                    bind:value={amount}
                    bind:this={amountInput}
                    formatAsNumber={true}
                    on:keydown={handleKeyDown}
                  />
                </div>
              </div>
              <SaveButtons onSave={() => handleUpdate(expense.id)} onCancel={cancelEdit} />
            </div>
          {:else}
            <button
              on:click={() => isMobile && startEdit(expense)}
              on:dblclick={() => !isMobile && startEdit(expense)}
              class="text-foreground hover:bg-muted flex flex-1 items-center justify-between text-left text-sm
              {editingId || isAdding ? 'pr-3 pl-4' : 'px-3'}
              {isMobile ? 'py-3' : 'py-2'}"
            >
              {#if !editingId && !isAdding}
                <div
                  class="text-muted-foreground mr-1 -ml-1 cursor-grab opacity-40 active:cursor-grabbing"
                >
                  <GripVertical size={16} />
                </div>
              {/if}
              <span class="flex-1">{expense.name}</span>
              <span class="text-muted-foreground">
                {formatCurrency(expense.amount, currencySymbol)}
              </span>
            </button>
            <DeleteButton onDelete={() => handleDelete(expense.id)} />
          {/if}
        </div>
      {/each}
    </div>

    {#if isAdding}
      <div class="flex items-end gap-2 pl-4">
        <div class="flex-1">
          <Input placeholder="Name" bind:value={name} on:keydown={handleKeyDown} />
        </div>
        <div class="w-36">
          <div class="flex items-center bg-transparent">
            <div class="text-muted-foreground mr-2 text-sm select-none">
              {currencySymbol}
            </div>
            <Input
              type="text"
              placeholder="Amount"
              bind:value={amount}
              formatAsNumber={true}
              on:keydown={handleKeyDown}
            />
          </div>
        </div>
        <SaveButtons onSave={handleAdd} onCancel={cancelEdit} />
      </div>
    {/if}

    {#if fixedExpenses.length === 0 && !isAdding}
      <div class="text-muted-foreground py-6 text-center text-sm">No fixed expenses</div>
    {/if}
  </div>

  {#if fixedExpenses.length > 0}
    <div class="border-border mt-4 flex justify-between border-t pt-3">
      <span class="text-muted-foreground text-xs tracking-wide uppercase"> Total </span>
      <span class="text-foreground text-sm font-semibold">
        {formatCurrency(totalFixed, currencySymbol)}
      </span>
    </div>
  {/if}
</Card>
