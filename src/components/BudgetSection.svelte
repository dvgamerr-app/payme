<script>
  import { Plus, Trash2, Pen, Check, X, Settings } from 'lucide-svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'
  import Card from './ui/Card.svelte'
  import Input from './ui/Input.svelte'
  import Button from './ui/Button.svelte'
  import ProgressBar from './ui/ProgressBar.svelte'
  import Modal from './ui/Modal.svelte'

  export let monthId
  export let budgets = []
  export let categories = []
  export let isReadOnly = false
  export let onUpdate = () => {}

  let isManaging = false
  let isAddingCategory = false
  let editingCategoryId = null
  let editingBudgetId = null
  let label = ''
  let amount = ''
  let isMobile = false
  let showBudgetModal = false

  const checkMobile = () => {
    isMobile = window.innerWidth <= 768
  }

  if (typeof window !== 'undefined') {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }

  $: currencySymbol = $settings.currencySymbol || '฿'

  // Reset form when modal closes
  $: if (!isManaging) {
    isAddingCategory = false
    editingCategoryId = null
    label = ''
    amount = ''
  }

  $: if (!showBudgetModal) {
    editingBudgetId = null
    amount = ''
  }

  function closeModal() {
    isManaging = false
  }

  async function handleAddCategory() {
    if (!label || !amount) return
    await api.categories.create({ label, default_amount: parseFloat(amount) })
    label = ''
    amount = ''
    isAddingCategory = false
    await onUpdate()
  }

  async function handleUpdateCategory(id) {
    if (!label || !amount) return
    await api.categories.update(id, { label, default_amount: parseFloat(amount) })
    editingCategoryId = null
    label = ''
    amount = ''
    await onUpdate()
  }

  async function handleDeleteCategory(id) {
    await api.categories.delete(id)
    await onUpdate()
  }

  async function handleUpdateBudget(budgetId) {
    if (!amount) return
    await api.budgets.update(monthId, budgetId, parseFloat(amount))
    editingBudgetId = null
    amount = ''
    showBudgetModal = false
    await onUpdate()
  }

  function startEditCategory(cat) {
    editingCategoryId = cat.id
    label = cat.label
    amount = cat.default_amount.toString()
  }

  function startEditBudget(budget) {
    editingBudgetId = budget.id
    amount = budget.allocated_amount.toString()

    if (isMobile) {
      showBudgetModal = true
    }
  }

  function cancelEdit() {
    editingCategoryId = null
    editingBudgetId = null
    label = ''
    amount = ''
    isAddingCategory = false
    showBudgetModal = false
  }
</script>

<Card>
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-foreground text-sm font-semibold">Budget</h3>
    <button
      on:click={() => (isManaging = true)}
      class="hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md transition-colors"
    >
      <Settings size={16} />
    </button>
  </div>

  <div class="space-y-4">
    {#each budgets as budget (budget.id)}
      <div>
        {#if editingBudgetId === budget.id && !isReadOnly && !isMobile}
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <div class="mb-1 text-sm">{budget.category_label}</div>
            </div>
            <div class="w-24">
              <Input type="text" placeholder="Budget" bind:value={amount} formatAsNumber={true} />
            </div>
            <button
              on:click={() => handleUpdateBudget(budget.id)}
              class="text-sage-600 hover:bg-sage-100 dark:hover:bg-charcoal-800 p-2"
            >
              <Check size={16} />
            </button>
            <button
              on:click={cancelEdit}
              class="text-charcoal-500 hover:bg-sand-200 dark:hover:bg-charcoal-800 p-2"
            >
              <X size={16} />
            </button>
          </div>
        {:else}
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-foreground text-sm">
                {budget.category_label}
              </span>
              <div class="flex items-center gap-2">
                <span class="text-muted-foreground text-xs">
                  {formatCurrency(budget.spent_amount, currencySymbol)} / {formatCurrency(
                    budget.allocated_amount,
                    currencySymbol
                  )}
                </span>
                {#if !isReadOnly}
                  <button
                    on:click={() => isMobile && startEditBudget(budget)}
                    on:dblclick={() => !isMobile && startEditBudget(budget)}
                    class="hover:bg-accent rounded p-1"
                  >
                    <Pen size={12} />
                  </button>
                {/if}
              </div>
            </div>
            <ProgressBar
              value={budget.spent_amount}
              max={budget.allocated_amount}
              color={`chart-${(budget.id % 5) + 1}`}
            />
          </div>
        {/if}
      </div>
    {/each}
    {#if budgets.length === 0}
      <div class="text-charcoal-400 dark:text-charcoal-600 py-4 text-center text-sm">
        No budget categories
      </div>
    {/if}
  </div>
</Card>

<Modal
  bind:isOpen={showBudgetModal}
  onClose={cancelEdit}
  title="Edit Budget"
  size="sm"
  variant="slide"
>
  {#if editingBudgetId}
    {@const budget = budgets.find((b) => b.id === editingBudgetId)}
    {#if budget}
      <div class="space-y-4">
        <div>
          <label for="budget-category" class="text-foreground mb-2 block text-sm font-medium"
            >Category</label
          >
          <div
            id="budget-category"
            class="text-foreground border-border bg-muted rounded-md border px-3 py-2 text-sm"
          >
            {budget.category_label}
          </div>
        </div>
        <div>
          <label for="budget-amount" class="text-foreground mb-2 block text-sm font-medium"
            >Budget Amount</label
          >
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-sm">{currencySymbol}</span>
            <Input
              id="budget-amount"
              type="text"
              placeholder="Enter budget amount"
              bind:value={amount}
              formatAsNumber={true}
            />
          </div>
        </div>
        <div class="text-muted-foreground text-xs">
          Current spent: {formatCurrency(budget.spent_amount, currencySymbol)}
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            on:click={cancelEdit}
            class="hover:bg-accent text-foreground rounded-md px-4 py-2 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={() => handleUpdateBudget(editingBudgetId)}
            class="bg-foreground text-background rounded-md px-4 py-2 text-sm transition-opacity hover:opacity-90"
            disabled={!amount}
          >
            Update
          </button>
        </div>
      </div>
    {/if}
  {/if}
</Modal>

<Modal bind:isOpen={isManaging} onClose={closeModal} title="Manage Categories" variant="slide">
  <p class="text-muted-foreground mb-4 text-sm">
    Categories define your budget types. Default amounts apply to new months.
  </p>
  <div class="space-y-3">
    {#each categories as cat (cat.id)}
      <div>
        {#if editingCategoryId === cat.id}
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <Input placeholder="Label" bind:value={label} />
            </div>
            <div class="w-24">
              <Input type="text" placeholder="Default" bind:value={amount} formatAsNumber={true} />
            </div>
            <button
              on:click={() => handleUpdateCategory(cat.id)}
              class="p-1.5 opacity-70 hover:opacity-100"
            >
              <Check size={16} />
            </button>
            <button on:click={cancelEdit} class="p-1.5 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        {:else}
          <div class="border-border flex items-center justify-between border-b py-2.5">
            <span class="text-foreground text-sm">{cat.label}</span>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">
                {formatCurrency(cat.default_amount, currencySymbol)} default
              </span>
              <button
                on:click={() => isMobile && startEditCategory(cat)}
                on:dblclick={() => !isMobile && startEditCategory(cat)}
                class="p-1 opacity-70 hover:opacity-100"
              >
                <Pen size={14} />
              </button>
              <button
                on:click={() => handleDeleteCategory(cat.id)}
                class="text-destructive p-1 opacity-70 hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}

    {#if isAddingCategory}
      <div class="flex items-end gap-2 pt-2">
        <div class="flex-1">
          <Input placeholder="Label" bind:value={label} />
        </div>
        <div class="w-24">
          <Input type="number" placeholder="Default" bind:value={amount} />
        </div>
        <Button size="sm" on:click={handleAddCategory}>
          <Check size={16} />
        </Button>
        <Button size="sm" variant="ghost" on:click={cancelEdit}>
          <X size={16} />
        </Button>
      </div>
    {:else}
      <Button
        variant="secondary"
        size="sm"
        on:click={() => (isAddingCategory = true)}
        className="w-full mt-2"
      >
        <Plus size={16} class="mr-2" />
        Add Category
      </Button>
    {/if}
  </div>
</Modal>
