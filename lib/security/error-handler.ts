export function toSafeErrorMessage(error: unknown, fallback: string): string {
  console.error(`[error-handler] ${fallback}:`, error)
  return fallback
}
