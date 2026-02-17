// Utility for handling double touch/click events
// Works for both mobile (touch) and desktop (click)

export const createDoubleTapHandler = (callback) => {
  let lastTap = 0
  let tapTimer = null

  return (event) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap

    // Clear any existing timer
    if (tapTimer) {
      clearTimeout(tapTimer)
      tapTimer = null
    }

    // If tapped within 300ms, it's a double tap
    if (tapLength < 300 && tapLength > 0) {
      event.preventDefault()
      callback(event)
      lastTap = 0
    } else {
      // Set timer to reset lastTap after 300ms
      lastTap = currentTime
      tapTimer = setTimeout(() => {
        lastTap = 0
      }, 300)
    }
  }
}

// Action to use with Svelte's use: directive
export const doubleTap = (node, callback) => {
  const handler = createDoubleTapHandler(callback)

  // Handle both touch and click events
  node.addEventListener('touchend', handler)
  node.addEventListener('dblclick', callback)

  return {
    destroy() {
      node.removeEventListener('touchend', handler)
      node.removeEventListener('dblclick', callback)
    },
  }
}
