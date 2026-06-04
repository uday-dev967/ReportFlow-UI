import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'

/**
 * Composable for converting rem values to pixels
 * Provides reactive rem-to-pixel conversion with automatic updates when root font size changes
 * Only use this in component setup() context
 */
export function useRemToPixel() {
  // Check if we're in a valid Vue component context
  const instance = getCurrentInstance()
  if (!instance) {
    console.warn('useRemToPixel: Not in component context, returning simple conversion functions')
    return {
      rootFontSize: ref(16),
      convertRemToPixels: remToPixels,
      convertMultipleRemToPixels: (remValues) => remValues.map(remToPixels),
      convertOffsetToPixels: (remOffset) => {
        if (!Array.isArray(remOffset) || remOffset.length !== 2) return [0, 0]
        return [remToPixels(remOffset[0]), remToPixels(remOffset[1])]
      },
      updateRootFontSize: () => {},
      setupMonitoring: () => {},
      cleanupMonitoring: () => {}
    }
  }
  const rootFontSize = ref(16) // Default fallback

  /**
   * Convert rem value to pixels
   * @param {number} remValue - The rem value to convert
   * @returns {number} - The equivalent pixel value
   */
  const convertRemToPixels = (remValue) => {
    if (typeof remValue !== 'number' || isNaN(remValue)) {
      return 0
    }
    return remValue * rootFontSize.value
  }

  /**
   * Update the root font size from the DOM
   */
  const updateRootFontSize = () => {
    try {
      const rootElement = document.documentElement
      const computedStyle = getComputedStyle(rootElement)
      const fontSize = parseFloat(computedStyle.fontSize)
      
      if (!isNaN(fontSize) && fontSize > 0) {
        rootFontSize.value = fontSize
      }
    } catch (e) {
      console.warn('Failed to get root font size, using fallback:', e)
      rootFontSize.value = 16
    }
  }

  /**
   * Convert multiple rem values to pixels
   * @param {number[]} remValues - Array of rem values
   * @returns {number[]} - Array of pixel values
   */
  const convertMultipleRemToPixels = (remValues) => {
    return remValues.map(convertRemToPixels)
  }

  /**
   * Convert rem offset array [x, y] to pixel offset
   * @param {number[]} remOffset - [x, y] offset in rem
   * @returns {number[]} - [x, y] offset in pixels
   */
  const convertOffsetToPixels = (remOffset) => {
    if (!Array.isArray(remOffset) || remOffset.length !== 2) {
      return [0, 0]
    }
    return [
      convertRemToPixels(remOffset[0]),
      convertRemToPixels(remOffset[1])
    ]
  }

  // Set up font size monitoring only if we're in a component context
  let resizeObserver = null
  let isSetup = false

  const setupMonitoring = () => {
    if (isSetup) return
    isSetup = true

    updateRootFontSize()

    // Monitor for font size changes using ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateRootFontSize()
      })
      resizeObserver.observe(document.documentElement)
    }

    // Fallback: listen for window resize events
    window.addEventListener('resize', updateRootFontSize)
  }

  const cleanupMonitoring = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    window.removeEventListener('resize', updateRootFontSize)
    isSetup = false
  }

  // Set up lifecycle hooks (we already checked instance above)
  onMounted(() => {
    setupMonitoring()
  })

  onUnmounted(() => {
    cleanupMonitoring()
  })

  return {
    rootFontSize,
    convertRemToPixels,
    convertMultipleRemToPixels,
    convertOffsetToPixels,
    updateRootFontSize,
    setupMonitoring,
    cleanupMonitoring
  }
}

/**
 * Simple utility function for one-off rem to pixel conversions
 * Use this when you don't need reactive updates
 * @param {number} remValue - The rem value to convert
 * @returns {number} - The equivalent pixel value
 */
export function remToPixels(remValue) {
  if (typeof remValue !== 'number' || isNaN(remValue)) {
    return 0
  }
  
  try {
    const rootElement = document.documentElement
    const computedStyle = getComputedStyle(rootElement)
    const rootFontSize = parseFloat(computedStyle.fontSize)
    
    if (isNaN(rootFontSize) || rootFontSize <= 0) {
      return remValue * 16 // fallback to 16px
    }
    
    return remValue * rootFontSize
  } catch (e) {
    console.warn('Failed to convert rem to pixels, using 16px fallback:', e)
    return remValue * 16
  }
}
