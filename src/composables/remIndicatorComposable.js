import { ref, onMounted, onUnmounted, provide } from 'vue'

export function useRemIndicator() {
  const remToPixel = ref(16) // Default value is usually 16px = 1rem
  const remIndicatorRef = ref(null) // Reference to the REM indicator element

  // Function to calculate rem value using the existing rem indicator
  const calculateRemValue = () => {
    if (remIndicatorRef.value) {
      // Get the actual width of the 1rem indicator element in pixels
      remToPixel.value = remIndicatorRef.value.offsetWidth
    }
  }

  // Convert rem to pixels
  const convertRemToPixels = (rem) => {
    return rem * remToPixel.value
  }

  // Convert pixels to rem
  const convertPixelsToRem = (pixels) => {
    return pixels / remToPixel.value
  }

  // Calculate rem value on mount and update on window resize
  onMounted(() => {
    calculateRemValue()
    window.addEventListener('resize', calculateRemValue)
  })

  // Clean up event listener on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', calculateRemValue)
  })

  // Provide the functions and value to be injected in other components
  provide('remToPixel', remToPixel)
  provide('convertRemToPixels', convertRemToPixels)
  provide('convertPixelsToRem', convertPixelsToRem)

  return {
    remToPixel,
    remIndicatorRef,
    convertRemToPixels,
    convertPixelsToRem
  }
}
