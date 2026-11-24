// HLE-Diamond. The Center for AI Safety's lastexam.ai post "Introducing HLE-Diamond" is a Next.js page whose
// ResultsView component shows accuracy without tools at two reasoning settings. Its default view, "All
// models are evaluated with reasoning high" (GPT-6 Astra 59.9), comes from an object in the page's own
// chunk (app/blog/hle-diamond/page-<hash>.js: b = JSON.parse('{"model": [overall, reasoning, knowledge]}')).
// The "See reasoning max" view is the Model | Accuracy table passed to ResultsView in the page's flight data.
// Both are imported, with setting "high" and "max"; the with-tools table is a different setting and is not
// read. Every score is overall accuracy on the 1,000 questions. The same chunk publishes average output
// tokens (including reasoning) for high effort and max effort, with measured request counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter, num } from '../lib/html.ts';

const SITE = 'https://lastexam.ai';
const PAGE = `${SITE}/blog/hle-diamond`;

const board: Leaderboard = {
  benchmark: 'hle-diamond',
  url: PAGE,
  feed: `${PAGE} (page chunk object "b" for reasoning high; flight-data ResultsView table for reasoning max)`,
  terms: 'Public CAIS blog page; lastexam.ai serves no robots.txt (the path returns 404) and publishes no terms page.',
  parts: {
    reasoning: { name: 'Reasoning', unit: '%' },
    knowledge: { name: 'Knowledge', unit: '%' },
  },
  stats: {
    tokenRequests: { name: 'Token measurement requests', unit: 'count' },
    inputTokens: { name: 'Average input tokens', unit: 'tokens', better: 'lower' },
    reasoningOutputTokens: { name: 'Average reasoning output tokens', unit: 'tokens', better: 'lower' },
    knowledgeOutputTokens: { name: 'Average knowledge output tokens', unit: 'tokens', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];

    const chunkPath = html.match(/\/_next\/static\/chunks\/app\/blog\/hle-diamond\/page-[\w]+\.js/)?.[0];
    if (!chunkPath) throw new Error('HLE-Diamond page chunk not found');
    const chunk = await fetchText(`${SITE}${chunkPath}`);
    const parsedObjects = [...chunk.matchAll(/=JSON\.parse\('([^']+)'\)/g)].map((m) => {
      try { return JSON.parse(m[1]) as Record<string, unknown>; } catch { return null; }
    }).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object');

    const high = parsedObjects.find((obj) => Object.values(obj).some((v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number'))) as Record<string, number[]> | undefined;
    if (!high) throw new Error('reasoning-high scores not found in the page chunk');
    for (const [model, v] of Object.entries(high)) {
      rows.push({ model, score: v[0], setting: 'high', metrics: { reasoning: v[1], knowledge: v[2] } });
    }

    const max = jsonAfter<string[][]>(nextFlight(html), '{"headers":["Model","Accuracy"],"rows":');
    for (const [model, acc] of max) {
      const score = num(acc);
      if (score !== undefined) rows.push({ model, score, setting: 'max' });
    }
    type HighTok = { mean?: number; count?: number; input_tokens?: number };
    type MaxTok = { overall?: { mean?: number; count?: number }; reasoning?: { mean?: number }; knowledge?: { mean?: number } };
    const highTokens = parsedObjects.find((obj) => Object.values(obj).some((v) => !!v && typeof v === 'object' && typeof (v as HighTok).mean === 'number' && typeof (v as HighTok).count === 'number')) as Record<string, HighTok> | undefined;
    const maxTokens = parsedObjects.find((obj) => Object.values(obj).some((v) => !!v && typeof v === 'object' && typeof (v as MaxTok).overall?.mean === 'number')) as Record<string, MaxTok> | undefined;
    if (!highTokens || !maxTokens) throw new Error('HLE-Diamond token objects missing in page chunk');
    for (const r of rows) {
      if (r.setting === 'high') {
        const v = highTokens[r.model];
        if (typeof v?.mean === 'number') {
          r.tokens = v.mean;
          r.metrics = {
            ...(r.metrics ?? {}),
            ...(typeof v.count === 'number' ? { tokenRequests: v.count } : {}),
            ...(typeof v.input_tokens === 'number' && typeof v.count === 'number' && v.count > 0 ? { inputTokens: Math.round(v.input_tokens / v.count) } : {}),
          };
        }
      } else {
        const v = maxTokens[r.model];
        if (typeof v?.overall?.mean === 'number') {
          r.tokens = v.overall.mean;
          r.metrics = {
            ...(r.metrics ?? {}),
            ...(typeof v.overall.count === 'number' ? { tokenRequests: v.overall.count } : {}),
            ...(typeof v.reasoning?.mean === 'number' ? { reasoningOutputTokens: v.reasoning.mean } : {}),
            ...(typeof v.knowledge?.mean === 'number' ? { knowledgeOutputTokens: v.knowledge.mean } : {}),
          };
        }
      }
    }
    return rows;
  },
};
export default board;
