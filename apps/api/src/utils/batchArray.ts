/**
 * Split an array into batches of a given size.
 *
 * @param items  - The array to split
 * @param size   - Maximum items per batch (default 20)
 * @returns        Array of sub-arrays, each with at most `size` elements
 */
export function batchArray<T>(items: T[], size: number = 20): T[][] {
  if (size <= 0) throw new Error("Batch size must be greater than 0");
  if (items.length === 0) return [];

  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
