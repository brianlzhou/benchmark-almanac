// The Progress page's data: a list of benchmarks for the picker (/progress/benchmarks.json) and one small file per
// benchmark with its record steps from each source (/progress/b/<id>.json). The steps come from the reign rows
// (src/lib/reigns.ts), so a record here is the same one the leaders page and the benchmark page count. The page
// fetches only the files of the benchmarks it shows. The math and the markup are in progress-view.ts.
import { benchmarks, benchById, benchSummary, modelById, AS_OF } from './data.ts';
import { reignRow, type Origin } from './reigns.ts';
import { sourceName } from './pools.ts';
import { makerParts } from './makers.ts';
import { SATURATED } from './data.ts';
import type { IndexRow, Pool, PoolLine, ProgressFile, ProgressIndex, Step } from './progress-view.ts';

const ORIGIN_INDEX: Record<Origin, number> = { leaderboard: 0, epoch: 1, collected: 2, card: 3, claim: 4 };

/** The maker as a short credit: one or two names, or the first and "others". */
function makerShort(org: string | undefined): string {
  const parts = makerParts(org ?? '').map((p) => p.text.replace(/\s*\(.*\)\s*$/, '').trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(' and ');
  return `${parts[0]} and others`;
}

let files: Map<string, ProgressFile> | null = null;
function build(): Map<string, ProgressFile> {
  if (files) return files;
  files = new Map();
  for (const b of benchmarks) {
    const pools: Partial<Record<Pool, PoolLine>> = {};
    const models: [string, string][] = [];
    const at = new Map<string, number>();
    const idx = (id: string) => {
      if (!at.has(id)) {
        at.set(id, models.length);
        models.push([id, modelById.get(id)?.name ?? id]);
      }
      return at.get(id)!;
    };
    const s = benchSummary(b.id);
    for (const pool of ['headline', 'independent', 'all'] as Pool[]) {
      const row = reignRow(b.id, pool);
      if (!row) continue;
      const steps: Step[] = row.reigns.flatMap((r) => r.steps.map((st): Step => [st.date, st.value, idx(r.model), ORIGIN_INDEX[st.from ?? 'card']]));
      if (!steps.length) continue;
      pools[pool] = { label: pool === 'headline' ? sourceName(s.boardSource, s) : pool === 'independent' ? 'All independent runs' : 'Every reported score', steps, last: row.lastTested };
    }
    if (!Object.keys(pools).length) continue;
    files.set(b.id, { v: 1, id: b.id, name: b.name, maker: makerShort(b.org), unit: b.unit ?? '%', better: b.better === 'lower' ? 'lower' : 'higher', pools, models });
  }
  return files;
}

export const progressFile = (id: string): ProgressFile | undefined => build().get(id);
export const progressIds = (): string[] => [...build().keys()];

export function progressIndex(): ProgressIndex {
  const rows: IndexRow[] = [...build().values()]
    .map((f): IndexRow => {
      const b = benchById.get(f.id)!;
      return [f.id, f.name, (b.aliases ?? []).join(' | '), f.unit, f.maker, benchSummary(f.id).nScores];
    })
    .sort((a, b) => b[5] - a[5]);
  return { asOf: AS_OF, rows };
}

/**
 * The view the page opens on: the most-cited benchmarks in recent launch posts that are still open (best score under
 * 85%), in percentages, so they share an axis. The same pick as the home page's "Leaderboards to watch", four of them.
 */
export function defaultPicks(): string[] {
  const recent = (id: string) => benchSummary(id).cites.filter((c) => c.card.date >= `${Number(AS_OF.slice(0, 4)) - 1}${AS_OF.slice(4)}`).length;
  return progressIds()
    .map((id) => benchSummary(id))
    .filter((s) => s.status === 'in use' && s.board.length >= 5 && (s.b.unit ?? '%') === '%' && s.b.better !== 'lower' && (s.best?.value ?? 100) < SATURATED)
    .map((s) => ({ id: s.b.id, r: recent(s.b.id), n: s.board.length }))
    .sort((a, b) => b.r - a.r || b.n - a.n)
    .slice(0, 4)
    .map((x) => x.id);
}
