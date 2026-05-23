/** Drop duplicate tickers (first occurrence wins). */
export function dedupeBySymbol<T extends { symbol: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const sym = item.symbol.trim().toUpperCase();
    if (!sym || seen.has(sym)) return false;
    seen.add(sym);
    return true;
  });
}

/** Remove items whose symbols appear in any exclude set. */
export function excludeSymbols<T extends { symbol: string }>(
  items: T[],
  ...excludeSets: Iterable<string>[]
): T[] {
  const blocked = new Set<string>();
  for (const set of excludeSets) {
    for (const s of set) blocked.add(String(s).toUpperCase());
  }
  return items.filter((item) => !blocked.has(item.symbol.trim().toUpperCase()));
}
