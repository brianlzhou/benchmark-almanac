// What the hover card on the Benchmarks and Arenas tables shows for one benchmark (src/scripts/peek.ts): its
// scores over time with the best-so-far line, the top five, and score against cost when the board prices runs.
// One small file per benchmark, fetched when the pointer rests on its row, so the tables carry none of it.
import { benchmarks, benchSummary, modelById, AS_OF, LEADERBOARDS } from '../../lib/data.ts';
import { COLOR_MARKS, MONO_MARKS } from '../../lib/marks.ts';
import { LEVEL_BY_ID } from '../../lib/taxonomy.ts';
import { score as fmt, monthYear } from '../../lib/format.ts';
import type { Score } from '../../lib/types.ts';

const STATUS: Record<string, string> = { 'in use': 'In use', fading: 'Fading', dropped: 'Dropped', 'system cards': 'System cards only', 'not in cards': 'Not in cards' };
const FROM: Record<string, string> = { leaderboard: 'its own leaderboard', epoch: 'Epoch AI', card: 'lab model cards' };
const DAY = 86_400_000;
const T0 = Date.parse('2019-01-01');
const day = (d: string) => Math.round((Date.parse(d.length === 7 ? `${d}-01` : d) - T0) / DAY);
const mark = (lab?: string) => (!lab ? '' : COLOR_MARKS.has(lab) ? 'c' : MONO_MARKS.has(lab) ? 'm' : '');

export function getStaticPaths() {
  return benchmarks.map((b) => ({ params: { id: b.id } }));
}

export function GET({ params }: { params: { id: string } }) {
  const s = benchSummary(params.id);
  const b = s.b;
  const unit = b.unit ?? '%';
  const sign = b.better === 'lower' ? -1 : 1;

  // each model's best dated score, in date order, marking the ones that set a new best. Percentages pool
  // every source. A rating or a count stays with the board's own source, since each source has its own scale.
  const pool = unit === '%' ? [...s.leaderboardBoard, ...s.epochBoard, ...s.cardBoard] : s.board;
  const best = new Map<string, Score>();
  for (const x of pool) {
    if (!x.date || x.date > AS_OF || x.unit !== unit) continue;
    const y = best.get(x.model);
    if (!y || sign * x.value > sign * y.value) best.set(x.model, x);
  }
  const dated = [...best.values()].sort((x, y) => x.date!.localeCompare(y.date!) || sign * (y.value - x.value));
  let top = -Infinity;
  const all = dated.map((x) => {
    const f = sign * x.value > top;
    if (f) top = sign * x.value;
    return [day(x.date!), +x.value.toFixed(2), f ? 1 : 0, modelById.get(x.model)?.lab ?? ''] as [number, number, number, string];
  });
  // a busy board keeps every record and an even sample of the rest, so the file stays small
  const step = Math.max(1, Math.ceil(all.filter((p) => !p[2]).length / 160));
  let k = 0;
  const pts = all.filter((p) => p[2] || k++ % step === 0);

  // score against cost, when the leaderboard prices five or more runs
  const priced = s.leaderboardBoard.filter((x) => x.cost && x.cost > 0 && x.unit === unit);
  let cost: [number, number, number, string][] | undefined;
  if (priced.length >= 5) {
    const byCost = [...priced].sort((x, y) => x.cost! - y.cost! || sign * (y.value - x.value));
    let run = -Infinity;
    cost = byCost.map((x) => {
      const f = sign * x.value > run;
      if (f) run = sign * x.value;
      return [x.cost!, +x.value.toFixed(2), f ? 1 : 0, modelById.get(x.model)?.lab ?? ''];
    });
  }

  const body = {
    n: b.name,
    org: b.org ?? '',
    d: b.description ?? '',
    st: STATUS[s.status] ?? '',
    sc: `status-${s.status.replace(/ /g, '-')}`,
    lv: b.level ? (LEVEL_BY_ID.get(b.level)?.name ?? '') : '',
    u: unit,
    lo: sign < 0 ? 1 : 0,
    t1: day(AS_OF),
    p: pts,
    top: s.board.slice(0, 5).map((x) => {
      const m = modelById.get(x.model);
      return [m?.name ?? x.model, m?.lab ?? '', mark(m?.lab), fmt(x.value, unit), x.value];
    }),
    from: s.boardSource ? FROM[s.boardSource] : '',
    c: cost,
    // what a cost covers: one task, or the full run of the test set (ARC-AGI-3)
    cr: LEADERBOARDS[s.b.id]?.costPer === 'run' ? 1 : undefined,
    last: s.lastAdded ? monthYear(s.lastAdded.date) : '',
  };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
}
