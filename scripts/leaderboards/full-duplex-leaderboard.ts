// Full-Duplex Leaderboard turn-taking track from the Hugging Face Space's unified-ratings.json.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/aufklarer/full-duplex-leaderboard/raw/main/data/unified-ratings.json';
const URL = 'https://huggingface.co/spaces/aufklarer/full-duplex-leaderboard';

interface FullDuplexEntry {
  id?: string;
  name?: string;
  test?: string;
  unranked?: boolean;
  run?: string;
  score?: number | null;
  latency_ms?: number | null;
  measured?: string;
  details?: string[];
}

interface FullDuplexPayload {
  rows: FullDuplexEntry[];
}

function parseRate(line: string, pctPattern: RegExp, fracPattern?: RegExp): number | undefined {
  const pm = line.match(pctPattern);
  if (pm) {
    const pct = Number(pm[1]);
    return Number.isFinite(pct) ? pct : undefined;
  }
  if (fracPattern) {
    const fm = line.match(fracPattern);
    if (fm) {
      const num = Number(fm[1]);
      const den = Number(fm[2]);
      if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
        return Math.round((num / den) * 1000) / 10;
      }
    }
  }
  return undefined;
}

function parseLatestDate(measured: string | undefined): string | undefined {
  if (!measured) return undefined;
  const dates = measured.match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates?.length) return undefined;
  return dates.sort().at(-1);
}

const board: Leaderboard = {
  benchmark: 'full-duplex-leaderboard',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. Full-Duplex Leaderboard publishes unified ratings and trace bundles publicly in its Space repository.',
  headline: "Turn-taking Youden's J (recall minus false positive rate) scaled to 100 on TurnBench dev. The source warns against averaging across separate tracks.",
  stats: {
    latency: { name: 'Turn-taking latency', unit: 'ms', better: 'lower' },
    caughtRate: { name: 'Turn ends caught', unit: '%', better: 'higher' },
    falseAlarmRate: { name: 'False alarm rate', unit: '%', better: 'lower' },
    interruptionsCaught: { name: 'Interruptions caught', unit: '%', better: 'higher' },
    interruptionFalseAlarmRate: { name: 'Interruption false alarm rate', unit: '%', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const payload = await fetchJson<FullDuplexPayload>(FEED);
    if (!Array.isArray(payload.rows)) {
      throw new Error('Unexpected Full-Duplex Leaderboard payload: missing rows array');
    }

    const rows: LeaderboardRow[] = [];
    for (const r of payload.rows) {
      if (r.test !== 'Turn-taking' || r.unranked) continue;
      if (!r.name || typeof r.score !== 'number' || !Number.isFinite(r.score)) continue;

      const score = Math.round(r.score * 10000) / 100;
      const metrics: Record<string, number> = {};

      if (typeof r.latency_ms === 'number' && Number.isFinite(r.latency_ms) && r.latency_ms > 0) {
        metrics.latency = r.latency_ms;
      }

      for (const line of r.details ?? []) {
        if (/^All \d+ dev conversations:/i.test(line)) continue;
        if (metrics.caughtRate === undefined) {
          const caught = parseRate(line, /\bCaught\s+(\d+(?:\.\d+)?)%/i, /\bCaught\s+(\d+)\/(\d+)/i);
          if (caught !== undefined) metrics.caughtRate = caught;
        }
        if (metrics.falseAlarmRate === undefined) {
          const fa = parseRate(line, /\bfalse alarms\s+(\d+(?:\.\d+)?)%/i, /\bfalse alarms\s+(\d+)\/(\d+)/i);
          if (fa !== undefined) metrics.falseAlarmRate = fa;
        }
        if (metrics.interruptionsCaught === undefined) {
          const ic = parseRate(line, /\bInterruptions caught\s+(\d+(?:\.\d+)?)%/i);
          if (ic !== undefined) metrics.interruptionsCaught = ic;
        }
        if (metrics.interruptionFalseAlarmRate === undefined) {
          const ifa = parseRate(line, /\bInterruption false alarms\s+(\d+(?:\.\d+)?)%/i);
          if (ifa !== undefined) metrics.interruptionFalseAlarmRate = ifa;
        }
      }

      const date = parseLatestDate(r.measured);
      rows.push({
        model: r.name.trim(),
        score,
        ...(r.run ? { setting: r.run.trim() } : {}),
        ...(date ? { date } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 10) {
      throw new Error(`Expected at least 10 ranked Turn-taking rows on Full-Duplex Leaderboard, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
