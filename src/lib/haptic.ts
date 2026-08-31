export function vibrate(ms = 10): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}
