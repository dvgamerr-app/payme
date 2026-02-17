<script>
  import { Plus } from 'lucide-svelte'
  import Input from './ui/Input.svelte'
  import SaveButtons from './ui/SaveButtons.svelte'
  import DeleteButton from './ui/DeleteButton.svelte'
  import { api } from '@/lib/api.js'
  import { settings } from '@/stores/settings.js'
  import { formatCurrency } from '@/lib/format-utils.js'

  export let categories = []
  export let onUpdate = () => {}

  $: currencySymbol = $settings.currencySymbol || '฿'

  let isAdding = false
  let editingId = null
  let label = ''
  let defaultAmount = ''
  let nameAddInput = null
  let nameEditInput = null

  $: if (editingId && nameEditInput) {
    nameEditInput.focus()
  }

  $: if (isAdding && nameAddInput) {
    nameAddInput.focus()
  }

  const handleAdd = async () => {
    if (!label) return
    try {
      await api.categories.create({
        label,
        default_amount: defaultAmount ? parseFloat(defaultAmount) : 0,
      })
      resetForm()
      await onUpdate()
    } catch (err) {
      console.error('Failed to add category:', err)
    }
  }

  const handleUpdate = async (id) => {
    if (!label) return
    try {
      await api.categories.update(id, {
        label,
        default_amount: defaultAmount ? parseFloat(defaultAmount) : 0,
      })
      resetForm()
      await onUpdate()
    } catch (err) {
      console.error('Failed to update category:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.categories.delete(id)
      await onUpdate()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  const startEdit = (category) => {
    editingId = category.id
    label = category.label
    defaultAmount = category.default_amount?.toString() || '0'
  }

  const resetForm = () => {
    editingId = null
    label = ''
    defaultAmount = ''
    isAdding = false
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (editingId) {
        handleUpdate(editingId)
      } else if (isAdding) {
        handleAdd()
      }
    }
  }
</script>

<div class="flex flex-col gap-2.5">
  {#if isAdding}
    <div class="flex items-end gap-2 pl-4">
      <div class="flex-1">
        <Input
          placeholder="Category name"
          bind:value={label}
          bind:this={nameAddInput}
          on:keydown={handleKeyDown}
        />
      </div>
      <div class="flex items-center gap-2">
        <div class="text-muted-foreground text-sm select-none">{currencySymbol}</div>
        <div class="w-32">
          <Input
            type="text"
            placeholder="Default amount"
            bind:value={defaultAmount}
            formatAsNumber={true}
            on:keydown={handleKeyDown}
          />
        </div>
      </div>
      <SaveButtons onSave={handleAdd} onCancel={resetForm} />
    </div>
  {/if}

  <div class="space-y-0">
    {#if !isAdding}
      <button
        on:click={() => (isAdding = true)}
        class="border-border hover:bg-accent flex w-full items-center gap-2 border border-dashed px-4 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        disabled={editingId}
      >
        <Plus size={16} />
        <span class="text-sm">Add New Category</span>
      </button>
    {/if}

    {#if categories.length === 0 && !isAdding}
      <div class="text-muted-foreground py-8 text-center text-sm">No categories yet</div>
    {:else}
      {#each categories as category (category.id)}
        <div class="group hover:bg-muted flex items-center justify-between">
          {#if editingId === category.id}
            <div class="flex flex-1 items-end gap-2 px-4 py-1">
              <div class="flex-1">
                <Input
                  placeholder="Category name"
                  bind:value={label}
                  bind:this={nameEditInput}
                  on:keydown={handleKeyDown}
                />
              </div>
              <div class="flex items-center gap-2">
                <div class="text-muted-foreground text-sm select-none">{currencySymbol}</div>
                <div class="w-32">
                  <Input
                    type="text"
                    placeholder="Default amount"
                    bind:value={defaultAmount}
                    formatAsNumber={true}
                    on:keydown={handleKeyDown}
                  />
                </div>
              </div>
              <SaveButtons onSave={() => handleUpdate(category.id)} onCancel={resetForm} />
            </div>
          {:else}
            <button
              on:dblclick={() => startEdit(category)}
              class="text-foreground flex flex-1 items-center justify-between px-4 py-3 text-left text-sm"
              disabled={isAdding || editingId}
            >
              <span class="flex-1">
                {category.label}
              </span>
              <span class="text-muted-foreground">
                {formatCurrency(category.default_amount || 0, currencySymbol)}
              </span>
            </button>
            <DeleteButton onDelete={() => handleDelete(category.id)} confirmText="Delete?" />
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
