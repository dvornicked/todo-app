/**
 * Generate a unique ID using crypto.randomUUID if available,
 * fallback to timestamp + random for older browsers
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
