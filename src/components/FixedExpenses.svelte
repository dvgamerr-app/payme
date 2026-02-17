<script>
  import { Plus, GripVertical } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import { dndzone } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import Card from './ui/Card.svelte'
  import FixedExpenseForm from './FixedExpenseForm.svelte'
  import DeleteButton from './ui/DeleteButton.svelte'
  import Modal from './ui/Modal.svelte'
  import Input from './ui/Input.svelte'
  import Select from './ui/Select.svelte'

  export let expenses = []
  export let totalFixed = 0
  export let onUpdate = () => {}

  let isAdding = false
  let editingId = null
  let label = ''
  let amount = ''
  let frequency = 'monthly'
  let currency = 'THB'
  let currencySymbol = '฿'
  let isMobile = false
  let showModal = false
  let modalMode = 'add'

  const flipDurationMs = 0

  const checkMobile = () => {
    isMobile = window.innerWidth <= 768
  }

  if (typeof window !== 'undefined') {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: baseCurrency = $settings.baseCurrency || 'THB'

  $: items = expenses.map((exp) => ({ id: exp.id, data: exp }))

  function getMonthlyAmount(expense) {
    const monthlyAmount = expense.frequency === 'yearly' ? expense.amount / 12 : expense.amount
    const exchangeRate = expense.exchange_rate || 1
    return monthlyAmount * exchangeRate
  }

  async function fetchExchangeRate(fromCurrency) {
    if (fromCurrency === baseCurrency) {
      return 1
    }
    try {
      const response = await fetch(`/api/exchange-rates?from=${fromCurrency}&to=${baseCurrency}`)
      if (!response.ok) throw new Error('Failed to fetch exchange rate')
      const data = await response.json()
      return data.rate
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      return 1
    }
  }

  async function handleAdd() {
    if (!label || !amount) return
    const exchangeRate = await fetchExchangeRate(currency)
    await api.fixedExpenses.create({
      label,
      amount: parseFloat(amount),
      frequency,
      currency,
      exchange_rate: exchangeRate,
    })
    label = ''
    amount = ''
    frequency = 'monthly'
    currency = 'THB'
    isAdding = false
    showModal = false
    await onUpdate()
  }

  async function handleUpdate(id) {
    if (!label || !amount) return
    const exchangeRate = await fetchExchangeRate(currency)
    await api.fixedExpenses.update(id, {
      label,
      amount: parseFloat(amount),
      frequency,
      currency,
      exchange_rate: exchangeRate,
    })
    editingId = null
    label = ''
    amount = ''
    frequency = 'monthly'
    currency = 'THB'
    showModal = false
    onUpdate()
  }

  async function handleDelete(id) {
    await api.fixedExpenses.delete(id)
    onUpdate()
  }

  function startEdit(expense) {
    isAdding = false
    editingId = expense.id
    label = expense.label
    amount = expense.amount.toString()
    frequency = expense.frequency || 'monthly'
    currency = expense.currency || 'THB'

    if (isMobile) {
      modalMode = 'edit'
      showModal = true
    }
  }

  function cancelEdit() {
    editingId = null
    label = ''
    amount = ''
    frequency = 'monthly'
    currency = 'THB'
    isAdding = false
    showModal = false
  }

  function startAdd() {
    cancelEdit()
    isAdding = true

    if (isMobile) {
      modalMode = 'add'
      showModal = true
    }
  }

  function handleDndConsider(e) {
    items = e.detail.items
  }

  async function handleDndFinalize(e) {
    items = e.detail.items
    const newOrder = items.map((item) => item.data.id)
    try {
      await api.fixedExpenses.reorder(newOrder)
      // ไม่ต้อง refetch ทุกอย่าง เพราะ UI update แล้ว
      // expenses จะถูก update จาก parent component ผ่าน prop
    } catch (error) {
      console.error('Failed to reorder expenses:', error)
      onUpdate()
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
        type: 'fixedExpenses',
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
          class="group hover:bg-muted flex items-center justify-between outline-none focus:outline-none"
        >
          {#if editingId === expense.id && !isMobile}
            <FixedExpenseForm
              mode="edit"
              bind:label
              bind:amount
              bind:frequency
              bind:currency
              onSave={() => handleUpdate(expense.id)}
              onCancel={cancelEdit}
            />
          {:else}
            <button
              on:click={() => isMobile && startEdit(expense)}
              on:dblclick={() => !isMobile && startEdit(expense)}
              class="text-foreground flex flex-1 items-center justify-between text-left text-sm
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
              <span class=" flex-1">
                {expense.label}
                {#if expense.currency && expense.currency !== baseCurrency}
                  <span class="text-muted-foreground ml-2 text-xs">({expense.currency})</span>
                {/if}
              </span>
              <span class="text-muted-foreground">
                {formatCurrency(getMonthlyAmount(expense), currencySymbol)}
              </span>
            </button>
            <DeleteButton onDelete={() => handleDelete(expense.id)} />
          {/if}
        </div>
      {/each}
    </div>

    {#if isAdding && !isMobile}
      <FixedExpenseForm
        mode="add"
        bind:label
        bind:amount
        bind:frequency
        bind:currency
        onSave={handleAdd}
        onCancel={cancelEdit}
      />
    {/if}

    {#if expenses.length === 0 && !isAdding}
      <div class="text-muted-foreground py-6 text-center text-sm">No fixed expenses</div>
    {/if}
  </div>

  {#if expenses.length > 0}
    <div class="border-border mt-4 flex justify-between border-t pt-3">
      <span class="text-muted-foreground text-xs tracking-wide uppercase"> Total </span>
      <span class="text-foreground text-sm font-semibold">
        {formatCurrency(totalFixed, currencySymbol)}
      </span>
    </div>
  {/if}
</Card>

<Modal
  bind:isOpen={showModal}
  onClose={cancelEdit}
  title={modalMode === 'add' ? 'Add Fixed Expense' : 'Edit Fixed Expense'}
  size="sm"
  variant="slide"
>
  <div class="space-y-4">
    <div>
      <label for="fixed-label" class="text-foreground mb-2 block text-sm font-medium">Label</label>
      <Input id="fixed-label" placeholder="Enter label" bind:value={label} />
    </div>
    <div>
      <label for="fixed-amount" class="text-foreground mb-2 block text-sm font-medium">Amount</label
      >
      <Input
        id="fixed-amount"
        type="text"
        placeholder="Enter amount"
        bind:value={amount}
        formatAsNumber={true}
      />
    </div>
    <div>
      <label for="fixed-frequency" class="text-foreground mb-2 block text-sm font-medium"
        >Frequency</label
      >
      <Select
        id="fixed-frequency"
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
        bind:value={frequency}
      />
    </div>
    <div>
      <label for="fixed-currency" class="text-foreground mb-2 block text-sm font-medium"
        >Currency</label
      >
      <Select
        id="fixed-currency"
        options={[
          { value: 'THB', label: 'THB (฿)' },
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'GBP', label: 'GBP (£)' },
          { value: 'JPY', label: 'JPY (¥)' },
        ]}
        bind:value={currency}
      />
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button
        on:click={cancelEdit}
        class="hover:bg-accent text-foreground px-4 py-2 text-sm transition-colors"
      >
        Cancel
      </button>
      <button
        on:click={() => (modalMode === 'add' ? handleAdd() : handleUpdate(editingId))}
        class="bg-foreground text-background px-4 py-2 text-sm transition-opacity hover:opacity-90"
        disabled={!label || !amount}
      >
        {modalMode === 'add' ? 'Add' : 'Update'}
      </button>
    </div>
  </div>
</Modal>
