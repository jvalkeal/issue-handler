/**
 * Returns value or default and handles if value is "falsy".
 */
export function numberValue(value: number | undefined, defaultValue: number): number {
  if (value === 0) {
    return value;
  }
  return value || defaultValue;
}
