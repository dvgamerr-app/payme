<script>
  import { Plus, Trash2, Pen, EllipsisVertical } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'
  import Input from './ui/Input.svelte'
  import Select from './ui/Select.svelte'
  import SaveButtons from './ui/SaveButtons.svelte'
  import Modal from './ui/Modal.svelte'
  import DatePicker from './ui/DatePicker.svelte'

  export let monthId
  export let items = []
  export let categories = []
  export let isReadOnly = false
  export let onUpdate = () => {}

  let isAdding = false
  let editingId = null
  let description = ''
  let amount = ''
  let categoryId = ''
  let spentOn = new Date().toISOString().split('T')[0]

  let descriptionInput = null
  let amountInput = null
  let openDropdownId = null
  let showMoveModal = false
  let selectedItemToMove = null
  let availableMonths = []
  let targetMonthId = ''

  $: currencySymbol = $settings.currencySymbol || '฿'
  $: categoryOptions = categories.map((c) => ({ value: c.id, label: c.label }))

  async function handleAdd() {
    if (!description || !amount) return
    await api.items.create(monthId, {
      description,
      amount: parseFloat(amount),
      category_id: categoryId ? parseInt(categoryId) : null,
      spent_on: formatDateFromInput(spentOn),
    })
    resetForm()
    await onUpdate()
  }

  async function handleUpdate(id) {
    if (!description || !amount) return
    await api.items.update(monthId, id, {
      description,
      amount: parseFloat(amount),
      category_id: categoryId ? parseInt(categoryId) : null,
      spent_on: formatDateFromInput(spentOn),
    })
    resetForm()
    await onUpdate()
  }

  async function handleDelete(id) {
    await api.items.delete(monthId, id)
    await onUpdate()
  }

  function startEdit(item) {
    editingId = item.id
    description = item.description
    amount = item.amount.toString()
    categoryId = item.category_id ? item.category_id.toString() : ''
    spentOn = formatDateForInput(item.spent_on)
  }

  function resetForm() {
    editingId = null
    description = ''
    amount = ''
    categoryId = ''
    spentOn = new Date().toISOString().split('T')[0]
    isAdding = false
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const parts = dateString.split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      // อยู่ในรูปแบบ yyyy-mm-dd แล้ว
      return dateString
    }
    // ถ้าเป็น dd-mm-yyyy แปลงเป็น yyyy-mm-dd
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    return dateString
  }

  const formatDateFromInput = (dateString) => {
    if (!dateString) return ''
    // Input type="date" ให้ค่าเป็น yyyy-mm-dd เสมอ
    return dateString
  }

  function startAdd() {
    resetForm()
    isAdding = true
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
      resetForm()
    }
  }

  const toggleDropdown = (itemId) => {
    openDropdownId = openDropdownId === itemId ? null : itemId
  }

  const closeDropdown = () => {
    openDropdownId = null
  }

  const openMoveModal = async (item) => {
    selectedItemToMove = item
    closeDropdown()

    // โหลด months ทั้งหมด
    try {
      const response = await fetch('/api/months')
      const monthsData = await response.json()
      availableMonths = monthsData.map((m) => ({
        value: m.id,
        label: `${m.month}/${m.year}`,
      }))
      targetMonthId = monthId.toString()
      showMoveModal = true
    } catch (error) {
      console.error('Failed to load months:', error)
    }
  }

  const handleMoveToMonth = async () => {
    if (!selectedItemToMove || !targetMonthId) return

    try {
      await fetch(`/api/months/${monthId}/items/${selectedItemToMove.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ target_month_id: parseInt(targetMonthId) }),
      })
      showMoveModal = false
      selectedItemToMove = null
      await onUpdate()
    } catch (error) {
      console.error('Failed to move item:', error)
      alert('Failed to move transaction')
    }
  }

  $: if (isAdding && descriptionInput) {
    descriptionInput.focus()
  }

  $: if (editingId && descriptionInput) {
    descriptionInput.focus()
  }
</script>

<Card className="col-span-full">
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold tracking-wide uppercase">Transactions</h3>
    {#if !isReadOnly && !isAdding}
      <button
        on:click={startAdd}
        class="hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        title="Add transaction"
      >
        <Plus size={16} />
      </button>
    {/if}
  </div>

  <table class="w-full text-sm">
    <thead>
      <tr class="border-border border-b">
        <th class="text-muted-foreground w-22 py-3 text-left text-xs font-medium">Date</th>
        <th class="text-muted-foreground py-3 text-left text-xs font-medium">Description</th>
        <th class="text-muted-foreground w-28 py-3 text-left text-xs font-medium">Category</th>
        <th class="text-muted-foreground w-36 py-3 text-right text-xs font-medium">Amount</th>
        {#if !isReadOnly}
          <th class="w-20"></th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#if isAdding}
        <tr class="hover:bg-accent/50 transition-colors">
          <td class="py-0.5">
            <DatePicker bind:value={spentOn} className="text-xs" on:keydown={handleKeyDown} />
          </td>
          <td class="py-0.5">
            <Input
              placeholder="Description"
              bind:value={description}
              bind:this={descriptionInput}
              className="text-xs"
              on:keydown={handleKeyDown}
            />
          </td>
          <td class="py-0.5">
            <Select
              options={categoryOptions}
              bind:value={categoryId}
              className="text-xs"
              placeholder="Optional"
              on:keydown={handleKeyDown}
            />
          </td>
          <td class="py-0.5 text-right">
            <Input
              type="text"
              placeholder="Amount"
              bind:value={amount}
              bind:this={amountInput}
              formatAsNumber={true}
              className="text-xs text-right"
              on:keydown={handleKeyDown}
            />
          </td>
          <td class="py-0.5">
            <SaveButtons onSave={handleAdd} onCancel={resetForm} />
          </td>
        </tr>
      {/if}
      {#each items as item (item.id)}
        <tr
          class="hover:bg-accent/50 transition-colors last:border-0 {editingId !== item.id
            ? 'border-border cursor-pointer border-b'
            : ''}"
          on:dblclick={() => !isReadOnly && !isAdding && !editingId && startEdit(item)}
        >
          {#if editingId === item.id}
            <td class="py-1">
              <DatePicker bind:value={spentOn} className="text-xs" on:keydown={handleKeyDown} />
            </td>
            <td>
              <Input
                placeholder="Description"
                bind:value={description}
                bind:this={descriptionInput}
                className="text-xs"
                on:keydown={handleKeyDown}
              />
            </td>
            <td>
              <Select
                options={categoryOptions}
                bind:value={categoryId}
                className="text-xs"
                on:keydown={handleKeyDown}
              />
            </td>
            <td>
              <Input
                type="text"
                placeholder="Amount"
                bind:value={amount}
                bind:this={amountInput}
                formatAsNumber={true}
                textAlign="right"
                className="text-xs"
                on:keydown={handleKeyDown}
              />
            </td>
            <td>
              <SaveButtons onSave={() => handleUpdate(item.id)} onCancel={resetForm} />
            </td>
          {:else}
            <td class="text-muted-foreground py-3 text-sm">{formatDate(item.spent_on)}</td>
            <td class="text-foreground py-3 text-sm">{item.description}</td>
            <td class="py-3">
              {#if item.category_label}
                <span
                  class="bg-accent text-accent-foreground inline-block rounded-full px-2 py-0.5 text-xs"
                >
                  {item.category_label}
                </span>
              {:else}
                <span class="text-muted-foreground text-xs italic">No category</span>
              {/if}
            </td>
            <td class="text-foreground py-3 text-right text-sm font-medium">
              {formatCurrency(item.amount, currencySymbol)}
            </td>
            {#if !isReadOnly && editingId !== item.id}
              <td class="py-2">
                <div class="flex justify-center">
                  <div class="relative">
                    <button
                      on:click|stopPropagation={() => toggleDropdown(item.id)}
                      class="hover:bg-sand-200 dark:hover:bg-charcoal-800 rounded p-1"
                      disabled={isAdding || editingId}
                    >
                      <EllipsisVertical size={14} />
                    </button>
                    {#if openDropdownId === item.id}
                      <div
                        class="bg-background border-border absolute right-0 z-10 mt-1 w-40 rounded-md border shadow-lg"
                      >
                        <button
                          on:click={() => openMoveModal(item)}
                          class="hover:bg-accent text-foreground block w-full px-4 py-2 text-left text-xs"
                        >
                          Move
                        </button>
                        <button
                          on:click={() => {
                            if (confirm('Are you sure you want to delete this transaction?')) {
                              handleDelete(item.id)
                            }
                            closeDropdown()
                          }}
                          class="hover:bg-destructive/10 text-destructive block w-full px-4 py-2 text-left text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </td>
            {/if}
          {/if}
        </tr>
      {/each}

      {#if items.length === 0 && !isAdding}
        <tr>
          <td colspan={isReadOnly ? 4 : 5} class="text-muted-foreground py-8 text-center text-sm">
            No spending items yet
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</Card>

<Modal bind:isOpen={showMoveModal} title="Move Transaction" size="sm">
  <div class="space-y-4">
    <p class="text-muted-foreground text-sm">Select the month to move this transaction to:</p>
    {#if selectedItemToMove}
      <div class="bg-accent/50 rounded-md p-3">
        <p class="text-foreground text-xs font-medium">{selectedItemToMove.description}</p>
        <p class="text-muted-foreground text-xs">
          {formatCurrency(selectedItemToMove.amount, currencySymbol)}
        </p>
      </div>
    {/if}
    <Select
      label="Target Month"
      options={availableMonths}
      bind:value={targetMonthId}
      placeholder="Select month"
    />
    <div class="flex justify-end gap-2">
      <button
        on:click={() => (showMoveModal = false)}
        class="hover:bg-accent text-foreground rounded-md px-4 py-2 text-sm transition-colors"
      >
        Cancel
      </button>
      <button
        on:click={handleMoveToMonth}
        class="bg-foreground text-background rounded-md px-4 py-2 text-sm transition-opacity hover:opacity-90"
        disabled={!targetMonthId || targetMonthId === monthId.toString()}
      >
        Move
      </button>
    </div>
  </div>
</Modal>

<svelte:window on:click={closeDropdown} />
