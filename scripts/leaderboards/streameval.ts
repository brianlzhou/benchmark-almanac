// StreamEval (streameval.ai) real-time interactive streaming video generation benchmark.
// Resolves the live Vite bundle from streameval.ai and parses the embedded streameval.v1-leaderboard/1
// object strictly as data (never executing remote JS). Tracks the site's default Avatar dialogue
// leaderboard (15 systems), where Overall adds five points for custom-portrait support to the equal-weight
// mean of Quality, Audio-visual sync, Stability, Dialogue and Identity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const SITE = 'https://streameval.ai/';

interface MetricCell {
  status: string;
  value?: number | null;
  score?: number | null;
  lower?: number | null;
}

interface StreamEntry {
  systemId: string;
  modelId: string;
  name: string;
  reportName?: string;
  provider?: string;
  group: string;
  population?: string;
  systemKind?: string;
  portraitPolicy?: string | null;
  sessionCapMs?: number | null;
  metrics: Record<string, MetricCell>;
}

interface StreamDataset {
  schemaVersion: string;
  entries: StreamEntry[];
}

function parseJsObjectLiteral<T>(src: string, from: number): T {
  let i = from;
  while (i < src.length && src[i] !== '{') i++;
  if (i >= src.length) throw new Error('StreamEval dataset object start missing');
  let out = '';
  let depth = 0;
  let quote: '`' | '"' | "'" | null = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') {
        const next = src[++i];
        out += next === '`' || next === "'" ? next : '\\' + next;
        continue;
      }
      if (c === quote) {
        out += '"';
        quote = null;
        continue;
      }
      if (c === '"') {
        out += '\\"';
        continue;
      }
      if (c === '\n') {
        out += '\\n';
        continue;
      }
      if (c === '\r') {
        out += '\\r';
        continue;
      }
      out += c;
      continue;
    }
    if (c === '`' || c === '"' || c === "'") {
      quote = c;
      out += '"';
      continue;
    }
    if (c === '!' && (src[i + 1] === '0' || src[i + 1] === '1')) {
      out += src[i + 1] === '0' ? 'true' : 'false';
      i++;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    out += c;
    if (depth === 0) break;
  }
  const json = out
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/([:\[,]\s*)(-?)\.(?=\d)/g, '$1$20.');
  return JSON.parse(json) as T;
}

function metricValue(cell: MetricCell | undefined): number | undefined {
  if (!cell || cell.status === 'not_applicable') return undefined;
  const v = cell.value ?? (cell.status === 'complete' ? cell.score : undefined) ?? cell.lower;
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

const PART_KEYS = ['visual_quality', 'av_sync', 'stability', 'dialogue', 'identity'] as const;

const board: Leaderboard = {
  benchmark: 'streameval',
  url: SITE,
  feed: SITE,
  terms: 'Public leaderboard data published at streameval.ai by the StreamEval authors.',
  headline: 'StreamEval publishes five separate task tables without a single cross-task average. This board tracks the default Avatar dialogue leaderboard, where Overall adds five points for custom-portrait support to the five-metric quality mean.',
  parts: {
    visual_quality: { name: 'Quality', group: 'Avatar dialogue' },
    av_sync: { name: 'Audio-visual sync', group: 'Avatar dialogue' },
    stability: { name: 'Stability', group: 'Avatar dialogue' },
    dialogue: { name: 'Dialogue', group: 'Avatar dialogue' },
    identity: { name: 'Identity', group: 'Avatar dialogue' },
  },
  stats: {
    quality_overall: { name: 'Quality overall', unit: 'score', better: 'higher', note: 'Equal-weight mean of the five Avatar dialogue metrics before the custom-portrait bonus.' },
    custom_bonus: { name: 'Custom portrait bonus', unit: 'score', better: 'higher', note: 'Five points for systems that accept a custom portrait, zero for fixed provider-stock avatars.' },
    session_cap_s: { name: 'Session cap', unit: 'seconds', better: 'higher', note: 'Maximum single-session duration when capped by the provider.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!match) throw new Error('StreamEval bundle script path missing');
    const js = await fetchText(new URL(match[1], SITE).toString());
    const idx = js.indexOf('{schemaVersion:`streameval.v1-leaderboard/1`');
    if (idx < 0) throw new Error('StreamEval leaderboard dataset missing in bundle');
    const dataset = parseJsObjectLiteral<StreamDataset>(js, idx);

    const groupEntries = dataset.entries.filter((e) => e.group === 'digital_human');
    const targetPop = groupEntries.some((e) => e.population === 'full') ? 'full' : 'core';
    const active = groupEntries.filter((e) => (e.population ?? 'core') === targetPop);
    if (active.length < 10) throw new Error('Expected at least ten StreamEval Avatar dialogue entries');

    const rows: LeaderboardRow[] = [];
    for (const e of active) {
      const qualityOverall = metricValue(e.metrics.overall);
      if (qualityOverall === undefined) continue;
      const customBonus = e.portraitPolicy?.startsWith('provider_stock') ? 0 : 5;
      const overall = Number((qualityOverall + customBonus).toFixed(2));

      const metrics: Record<string, number> = {
        quality_overall: qualityOverall,
        custom_bonus: customBonus,
      };
      for (const k of PART_KEYS) {
        const v = metricValue(e.metrics[k]);
        if (v !== undefined) metrics[k] = v;
      }
      if (typeof e.sessionCapMs === 'number' && Number.isFinite(e.sessionCapMs) && e.sessionCapMs > 0) {
        metrics.session_cap_s = e.sessionCapMs / 1000;
      }

      const settingParts = [
        e.systemKind === 'composition' ? 'shared dialogue stack' : e.systemKind === 'native' ? 'native' : '',
        e.portraitPolicy === 'provider_stock' ? 'provider stock portrait' : '',
      ].filter(Boolean);

      rows.push({
        model: (e.reportName || e.name).trim(),
        setting: settingParts.join(', ') || undefined,
        score: overall,
        metrics,
      });
    }
    return checked(rows, 15);
  },
};

export default board;
