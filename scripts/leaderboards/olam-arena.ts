// Olam Labs' Multi-Agent Arena: people and anonymized models share a table in social strategy games (Diplomacy,
// Social Poker, Codenames and Risk), every model through the same Pi harness. This file reads the overall rating, a
// Bradley-Terry fit over every game's pairwise finishes on an Elo scale, and holds the reader the four game boards
// share. The evaluations page draws each chart in its server HTML: one bar per player with its value printed on
// it, the 95% interval as --ev-cilo and --ev-cihi on the bar's own 0-to-1 scale, and the chart's date in the title
// of its "View more" link. Each chart shows its top 16 players, ranked by that chart's own number, so a game's
// behavior charts can name a different 16 than its headline chart. The per-chart pages load from /api/, which
// robots.txt closes, so this reads only the overview. Human rows ("Humans (top 25%)") are baselines and are left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const OLAM_PAGE = 'https://olamlabs.ai/evaluations';
export const OLAM_TERMS =
  'Public evaluations page. robots.txt allows it and closes /api/ except /api/poker/leaderboard. The site states no data license. Results are credited to Olam Labs.';
export const OLAM_HARNESS = { reference: ['Pi'] } satisfies Pick<Leaderboard, 'reference'>;

export interface OlamBar {
  name: string;
  value: number;
  low?: number;
  high?: number;
}
export interface OlamChart {
  bars: OlamBar[];
  date?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const isoDate = (s: string) => {
  const m = [...s.matchAll(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (20\d\d)/g)].at(-1);
  return m ? `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}` : undefined;
};
const css = (style: string, name: string) => {
  const m = style.match(new RegExp(`--${name}:([\\d.]+)`));
  return m ? Number(m[1]) : undefined;
};

/** Reads one chart's bars. The interval comes back on the value's scale: the bar heights map linearly to the values. */
function readChart(body: string): OlamChart {
  const meta = body.match(/class="ol-evmore" title="([^"]+)"/);
  const raw = [...body.matchAll(/<li class="ol-evcol"([^>]*)>([\s\S]*?)<\/li>/g)].map((m) => {
    const attrs = m[1];
    const kind = attrs.match(/data-kind="(\w+)"/)?.[1];
    const name = attrs.match(/title="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
    const style = attrs.match(/style="([^"]+)"/)?.[1] ?? '';
    const val = m[2].match(/<span class="ol-evval">([^<]+)<\/span>/)?.[1];
    return { kind, name, top: css(style, 'ev-top'), lo: css(style, 'ev-cilo'), hi: css(style, 'ev-cihi'), value: val === undefined ? NaN : Number(val.replace(/[,%\s]/g, '')) };
  });
  // value = a + b * height, from the two bars furthest apart (heights are rounded to four places)
  const fit = raw.filter((r) => r.top !== undefined && Number.isFinite(r.value)).sort((x, y) => x.top! - y.top!);
  const [p, q] = [fit[0], fit.at(-1)];
  const b = p && q && q.top! > p.top! ? (q.value - p.value) / (q.top! - p.top!) : undefined;
  const at = (h: number) => (b === undefined ? undefined : p.value + b * (h - p.top!));
  const digits = raw.some((r) => !Number.isInteger(r.value)) ? 10 : 1;
  const bars: OlamBar[] = [];
  for (const r of raw) {
    if (r.kind !== 'model' || !r.name || !Number.isFinite(r.value)) continue;
    const bar: OlamBar = { name: r.name, value: r.value };
    if (r.lo !== undefined && r.hi !== undefined && r.hi > r.lo && /ol-evci/.test(body)) {
      const lo = at(r.lo);
      const hi = at(r.hi);
      if (lo !== undefined && hi !== undefined) {
        bar.low = Math.round(lo * digits) / digits;
        bar.high = Math.round(hi * digits) / digits;
      }
    }
    bars.push(bar);
  }
  return { bars, date: meta ? isoDate(meta[1]) : undefined };
}

let page: Promise<Map<string, OlamChart>> | undefined;
/** Every chart on the evaluations page by its id ("overall-rating", "greatpowers-sos", ...), read once per run. */
export function olamCharts(): Promise<Map<string, OlamChart>> {
  page ??= fetchText(OLAM_PAGE).then((html) => {
    const out = new Map<string, OlamChart>();
    for (const m of html.matchAll(/<article class="ol-eveval" id="([^"]+)"([\s\S]*?)<\/article>/g)) {
      const chart = readChart(m[2]);
      if (chart.bars.length) out.set(m[1], chart);
    }
    if (!out.size) throw new Error('Olam Labs: no charts on the evaluations page');
    return out;
  });
  return page;
}

/**
 * One game's rows: the headline chart gives the score, and each other chart adds a metric to the models it names.
 * Metric charts can name models outside the headline's top 16, and those are left out.
 */
export async function olamRows(headline: string, metrics: Record<string, string> = {}, min = 8): Promise<LeaderboardRow[]> {
  const charts = await olamCharts();
  const head = charts.get(headline);
  if (!head) throw new Error(`Olam Labs: no chart ${headline}`);
  const rows: LeaderboardRow[] = head.bars.map((b) => ({
    model: b.name,
    score: b.value,
    harness: 'Pi',
    date: head.date,
    ...(b.low !== undefined ? { low: b.low, high: b.high } : {}),
  }));
  for (const [k, id] of Object.entries(metrics)) {
    const chart = charts.get(id);
    if (!chart) throw new Error(`Olam Labs: no chart ${id}`);
    for (const bar of chart.bars) {
      const row = rows.find((r) => r.model === bar.name);
      if (row) (row.metrics ??= {})[k] = bar.value;
    }
  }
  if (rows.length < min) throw new Error(`Olam Labs ${headline}: ${rows.length} models, expected at least ${min}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'olam-arena',
  url: OLAM_PAGE,
  feed: `${OLAM_PAGE} (the "Overall Arena Rating" chart in the page's HTML)`,
  terms: OLAM_TERMS,
  ...OLAM_HARNESS,
  fetch: () => olamRows('overall-rating'),
};
export default board;
