<script>
  /**
   * Button Component
   * @prop {string} variant - Button style variant
   * @prop {string} size - Button size
   * @prop {string} type - Button HTML type
   * @prop {boolean} disabled - Disabled state
   */
  export let variant = 'primary'
  export let size = 'md'
  export let type = 'button'
  export let disabled = false

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
    danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
    ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  }
</script>

<button
  {type}
  {disabled}
  class="{baseStyles} {variants[variant]} {sizes[size]} cursor-pointer"
  on:click
  {...$$restProps}
>
  <slot />
</button>
