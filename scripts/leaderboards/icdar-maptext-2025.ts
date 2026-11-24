// ICDAR 2025 MapText Competition (Robust Reading Competition challenge 32).
// Tests text detection, recognition and phrase linking on historical maps across three collections:
// Rumsey (General), IGN (French) and TWH (Chinese). Reads the live RRC evaluation tables across all four
// tasks. Because each task accepts separate submissions and has no single cross-task aggregate on RRC, the
// headline score is the Task 1 word detection H-mean on the default Rumsey collection, with IGN and TWH
// Task 1 scores plus Tasks 2, 3 and 4 Rumsey H-mean scores in parts and Task 1 component metrics in stats.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { rrcPage } from '../lib/boards/rrc.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const BASE = 'https://rrc.cvc.uab.es/';
const FEED = `${BASE}?ch=32&com=evaluation&task=1`;

interface RrcRow {
  date?: string;
  method: string;
  hmean: number;
  precision?: number;
  recall?: number;
  tightness?: number;
  quality?: number;
  fscore?: number;
}

const pct = (s: string | undefined): number | undefined => {
  const m = s?.trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) : undefined;
};

function parseTable(html: string): RrcRow[] {
  const table = html.match(/<table id='table-\d+-\d+'[\s\S]*?<\/table>/i)?.[0];
  if (!table) throw new Error('MapText 2025 RRC results table missing');
  const out: RrcRow[] = [];
  for (const tr of table.matchAll(/<tr class='(?:competition|normal)'>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1].replace(/<[^>]+>/g, '').trim());
    const method = cells[4];
    const hmean = pct(cells[5]);
    if (!method || hmean === undefined) continue;
    out.push({
      date: /^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? '') ? cells[0] : undefined,
      method,
      hmean,
      precision: pct(cells[6]),
      recall: pct(cells[7]),
      tightness: pct(cells[8]),
      quality: pct(cells[9]),
      fscore: pct(cells[10]),
    });
  }
  return out;
}

function normMethod(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/\s*\+\s*heuristic mst$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bestByKey(rows: RrcRow[]): Map<string, RrcRow> {
  const map = new Map<string, RrcRow>();
  for (const r of rows) {
    const k = normMethod(r.method);
    const prev = map.get(k);
    if (!prev || r.hmean > prev.hmean) map.set(k, r);
  }
  return map;
}

const board: Leaderboard = {
  benchmark: 'icdar-maptext-2025',
  url: FEED,
  feed: FEED,
  terms: 'Public competition leaderboard on the Robust Reading Competition portal at rrc.cvc.uab.es.',
  headline: 'The RRC portal ranks each task separately, so this is Task 1 word detection H-mean on the default Rumsey collection, with other collections and tasks in parts.',
  parts: {
    t1_ign: { name: 'Task 1 Detection: IGN (French)', group: 'Collection' },
    t1_twh: { name: 'Task 1 Detection: TWH (Chinese)', group: 'Collection' },
    t2_rumsey: { name: 'Task 2 Detection and Linking: Rumsey', group: 'Task' },
    t3_rumsey: { name: 'Task 3 Detection and Recognition: Rumsey', group: 'Task' },
    t4_rumsey: { name: 'Task 4 End-to-End Phrase: Rumsey', group: 'Task' },
  },
  stats: {
    precision: { name: 'Word precision', unit: '%', better: 'higher' },
    recall: { name: 'Word recall', unit: '%', better: 'higher' },
    tightness: { name: 'Polygon tightness', unit: '%', better: 'higher' },
    quality: { name: 'Detection quality', unit: '%', better: 'higher' },
    fscore: { name: 'Word F-score', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t1Rumsey = parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=1&f=1&e=1`));
    const t1Ign = bestByKey(parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=1&f=2&e=1`)));
    const t1Twh = bestByKey(parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=1&f=3&e=1`)));
    const t2Rumsey = bestByKey(parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=2&f=1&e=1`)));
    const t3Rumsey = bestByKey(parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=3&f=1&e=1`)));
    const t4Rumsey = bestByKey(parseTable(await rrcPage(`${BASE}?ch=32&com=evaluation&task=4&f=1&e=1`)));

    // Keep the highest non-zero submission per method on Task 1 Rumsey (drops failed 0.00% re-uploads).
    const dedup = new Map<string, RrcRow>();
    for (const r of t1Rumsey) {
      if (r.hmean <= 0) continue;
      const k = normMethod(r.method);
      const prev = dedup.get(k);
      if (!prev || r.hmean > prev.hmean) dedup.set(k, r);
    }

    const rows: LeaderboardRow[] = [];
    for (const [k, r] of dedup) {
      const metrics: Record<string, number> = {};
      if (r.precision !== undefined) metrics.precision = r.precision;
      if (r.recall !== undefined) metrics.recall = r.recall;
      if (r.tightness !== undefined) metrics.tightness = r.tightness;
      if (r.quality !== undefined) metrics.quality = r.quality;
      if (r.fscore !== undefined) metrics.fscore = r.fscore;

      const ign = t1Ign.get(k);
      if (ign && ign.hmean > 0) metrics.t1_ign = ign.hmean;
      const twh = t1Twh.get(k);
      if (twh && twh.hmean > 0) metrics.t1_twh = twh.hmean;
      const t2 = t2Rumsey.get(k);
      if (t2 && t2.hmean > 0) metrics.t2_rumsey = t2.hmean;
      const t3 = t3Rumsey.get(k);
      if (t3 && t3.hmean > 0) metrics.t3_rumsey = t3.hmean;
      const t4 = t4Rumsey.get(k);
      if (t4 && t4.hmean > 0) metrics.t4_rumsey = t4.hmean;

      rows.push({ model: r.method, score: r.hmean, date: r.date, metrics });
    }
    return checked(rows, 8);
  },
};

export default board;
