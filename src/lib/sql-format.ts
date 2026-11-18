// How the /sql/ page prints a column of numbers: each value with as many decimals as the most precise value in the
// column needs, up to 3, so the decimal points line up ("40.0" beside "58.7", not "40"). The server's first table
// (pages/sql.astro) and the browser's later ones (scripts/sql.ts) both use it. Copies and the CSV keep the raw values.

/** The decimals a column needs, 0 to 3. Values that aren't numbers don't count. */
export function columnDecimals(values: unknown[]): number {
  let d = 0;
  for (const v of values) {
    if (typeof v !== 'number' || Number.isInteger(v) || !Number.isFinite(v)) continue;
    const s = String(Math.round(v * 1000) / 1000);
    const dot = s.indexOf('.');
    if (dot >= 0 && !s.includes('e')) d = Math.max(d, s.length - dot - 1);
    if (d >= 3) return 3;
  }
  return d;
}

/** A number as its column prints it. */
export const showNumber = (v: number, decimals: number) => (Number.isFinite(v) ? v.toFixed(decimals) : String(v));
