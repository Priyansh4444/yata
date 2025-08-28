import { common, createLowlight } from 'lowlight'

// Create and configure lowlight instance with common languages
export const lowlight = createLowlight(common)

// Export supported languages for reference
export const supportedLanguages = common

// Export lowlight instance
export { common }
