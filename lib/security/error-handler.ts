export function toSafeErrorMessage(error: unknown, fallback: string): string {
  console.error(`[error-handler] ${fallback}:`, error)
  return fallback
}

export function toClassifiedErrorMessage(
  error: unknown,
  fallback: string,
  classify: (error: unknown) => string | null,
): string {
  console.error(`[error-handler] ${fallback}:`, error)
  return classify(error) ?? fallback
}
