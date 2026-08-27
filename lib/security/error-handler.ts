export function toSafeErrorMessage(error: unknown, fallback: string): string {
  console.error(`[error-handler] ${fallback}:`, error)
  return fallback
}

/**
 * Like toSafeErrorMessage, but lets known, non-sensitive error categories
 * surface a more specific message to the client. Anything not matched by
 * `classify` falls back to the generic message (still logged in full).
 */
export function toClassifiedErrorMessage(
  error: unknown,
  fallback: string,
  classify: (error: unknown) => string | null,
): string {
  console.error(`[error-handler] ${fallback}:`, error)
  return classify(error) ?? fallback
}
