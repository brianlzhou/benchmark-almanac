// SynthDCB: live device-control leaderboard across Home, Car, and Phone domains and five task types, joined with cost and parameter data.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://x-lance.github.io/SynthDCB/';
const DATA_JS = 'https://x-lance.github.io/SynthDCB/assets/benchmark-data.js';
const TASKS_PER_TRIAL = 2560;

interface BenchmarkDataModel {
  id: string;
  name: string;
  passed?: number;
  attempts?: number;
  usdWithCache?: number;
  usdWithoutCache?: number;
  parameters?: number;
}

function extractAssignedJsonObject(js: string, marker: string): Record<string, unknown> {
  const pos = js.indexOf(marker);
  if (pos === -1) throw new Error(`Missing ${marker} in SynthDCB benchmark-data.js`);
  const start = js.indexOf('{', pos + marker.length);
  if (start === -1) throw new Error(`Missing object start for ${marker}`);
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < js.length; i++) {
    const ch = js[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(js.slice(start, i + 1)) as Record<string, unknown>;
      }
    }
  }
  throw new Error(`Unterminated object for ${marker}`);
}

const board: Leaderboard = {
  benchmark: 'synthdcb',
  url: 'https://x-lance.github.io/SynthDCB/#leaderboard',
  feed: DATA_JS,
  costPer: 'task',
  terms: 'Public leaderboard and benchmark data published by SJTU X-LANCE Lab on the SynthDCB site.',
  parts: {
    home: { name: 'Home', group: 'Domain' },
    car: { name: 'Car', group: 'Domain' },
    phone: { name: 'Phone', group: 'Domain' },
    control: { name: 'Control', group: 'Task' },
    query: { name: 'Query', group: 'Task' },
    aggregate: { name: 'Aggregate', group: 'Task' },
    goal: { name: 'Goal', group: 'Task' },
    workflow: { name: 'Workflow', group: 'Task' },
  },
  stats: {
    costUncached: {
      name: 'API cost per attempt (without cache)',
      unit: 'usd',
      better: 'lower',
      note: 'Average uncached API cost in US dollars per test attempt.',
    },
  },
  chart: {
    title: 'Cost and performance',
    x: {
      key: 'cost',
      label: 'API cost per attempt (with cache)',
      unit: '$',
      better: 'lower',
      log: true,
    },
    y: {
      key: 'score',
      label: 'Mean test pass@1',
      unit: '%',
      better: 'higher',
    },
    note: 'Mean test pass@1 against cached API cost per attempt in US dollars, matching the site cost scatter plot.',
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const [html, js] = await Promise.all([fetchText(PAGE), fetchText(DATA_JS)]);
    const parsed = extractAssignedJsonObject(js, 'const benchmarkData') as {
      models?: BenchmarkDataModel[];
    };
    const metaByName = new Map<string, BenchmarkDataModel>();
    for (const m of parsed.models ?? []) {
      if (m.name) metaByName.set(m.name.trim(), m);
    }

    const rows: LeaderboardRow[] = [];
    const tbodyRe = /<tbody\s+[^>]*data-model="([^"]+)"[^>]*>([\s\S]*?)<\/tbody>/gi;
    let match: RegExpExecArray | null;
    while ((match = tbodyRe.exec(html)) !== null) {
      const tag = match[0].slice(0, match[0].indexOf('>') + 1);
      const model = match[1].trim();
      const dateMatch = tag.match(/data-eval-date="(\d{4}-\d{2}-\d{2})"/);
      const body = match[2];
      const summaryMatch = body.match(/<tr\s+class="board-summary">([\s\S]*?)<\/tr>/i);
      if (!summaryMatch) continue;

      const scores: number[] = [];
      const tdRe = /<td[^>]*data-score="([0-9.eE+-]+)"[^>]*>/gi;
      let td: RegExpExecArray | null;
      while ((td = tdRe.exec(summaryMatch[1])) !== null) {
        scores.push(Number(td[1]) * 100);
      }
      if (scores.length < 9 || !Number.isFinite(scores[0])) continue;

      const round2 = (v: number) => Math.round(v * 100) / 100;
      const metrics: Record<string, number> = {
        home: round2(scores[1]),
        car: round2(scores[2]),
        phone: round2(scores[3]),
        control: round2(scores[4]),
        query: round2(scores[5]),
        aggregate: round2(scores[6]),
        goal: round2(scores[7]),
        workflow: round2(scores[8]),
      };

      const meta = metaByName.get(model);
      let cost: number | undefined;
      let params: number | undefined;
      let trials: number | undefined;
      if (meta) {
        if (typeof meta.usdWithCache === 'number' && Number.isFinite(meta.usdWithCache)) {
          cost = Math.round(meta.usdWithCache * 100000) / 100000;
        }
        if (typeof meta.usdWithoutCache === 'number' && Number.isFinite(meta.usdWithoutCache)) {
          metrics.costUncached = Math.round(meta.usdWithoutCache * 100000) / 100000;
        }
        if (typeof meta.parameters === 'number' && Number.isFinite(meta.parameters) && meta.parameters > 0) {
          params = Math.round((meta.parameters / 1e9) * 10) / 10;
        }
        if (typeof meta.attempts === 'number' && meta.attempts >= TASKS_PER_TRIAL) {
          const n = Math.round(meta.attempts / TASKS_PER_TRIAL);
          if (n >= 1) trials = n;
        }
      }

      rows.push({
        model,
        score: round2(scores[0]),
        date: dateMatch?.[1],
        cost,
        params,
        trials,
        metrics,
      });
    }

    if (rows.length < 15) {
      throw new Error(`Expected SynthDCB leaderboard rows, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
