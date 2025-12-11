import { Transform } from 'class-transformer';

/**
 * Decorator to trim string values
 * Usage: @Trim()
 */
export function Trim() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}
