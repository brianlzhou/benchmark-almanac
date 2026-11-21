// A benchmark's launch post on X and the engagement it had when we read it (data/traction.json), read through Grok
// Build. It shows how far a benchmark's launch reached, so pages and insights can compare reach with later use.
import tractionJson from '../../data/traction.json';

export interface Launch {
  url: string;
  author: string;
  posted: string;
  views: number | null;
  likes: number | null;
  reposts: number | null;
  replies: number | null;
  quotes: number | null;
  bookmarks: number | null;
  /** The day we read the counts. */
  read: string;
}
const BY = (tractionJson as { benchmarks: Record<string, { x?: Launch }> }).benchmarks;
/** A benchmark's launch post on X, when we found one. */
export const launchOf = (id: string): Launch | undefined => BY[id]?.x;
export const launchCount = Object.values(BY).filter((x) => x.x).length;

/** A count as people read it on X: 872,260 -> "872K", 1,240,000 -> "1.2M", 950 -> "950". */
export function compact(n: number): string {
  if (n >= 1e6) return `${Number((n / 1e6).toFixed(n >= 1e7 ? 0 : 1))}M`;
  if (n >= 1e3) return `${Number((n / 1e3).toFixed(n >= 1e4 ? 0 : 1))}K`;
  return String(n);
}
