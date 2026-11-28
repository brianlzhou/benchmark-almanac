// AI All-Round Bench (AI Decathlon, Wendystar0628): timed 10-category, 13-task coding and
// engineering challenge suite spanning formal proofs, performance optimization, algorithm battles,
// spatial reasoning, geometric modeling, interactive apps, game dev, physics, visuals, and systems.
// Reads decathlon/data/models.json and decathlon/data/scores.json.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://octathlon.wendystars.com/decathlon/';
const MODELS_FEED = `${SITE}data/models.json`;
const SCORES_FEED = `${SITE}data/scores.json`;

interface DecathlonModel {
  id: string;
  name: string;
  agent?: string;
  effort?: string;
  tested?: string;
}

interface DecathlonScore {
  total: number;
  kinds?: { standard?: number; design?: number };
  categories?: Record<string, number>;
  cost?: {
    api_usd?: number;
    tokens?: number;
    hours?: number;
    tps?: number;
  };
}

interface DecathlonScoresFeed {
  scores: Record<string, DecathlonScore>;
}

const CAT_KEYS: readonly [string, string][] = [
  ['reason', 'mathReasoning'],
  ['algo', 'perfOptimization'],
  ['battle', 'algoBattle'],
  ['spatial', 'spatialReasoning'],
  ['drawing', 'geometricModeling'],
  ['interact', 'interactiveApps'],
  ['game', 'gameDev'],
  ['physics', 'physicsSim'],
  ['visual', 'visualRendering'],
  ['system', 'systemArch'],
];

const board: Leaderboard = {
  benchmark: 'ai-all-round-bench',
  url: SITE,
  feed: SCORES_FEED,
  terms: 'Public benchmark website and JSON feeds published by AI All-Round Bench.',
  harnesses: 'system',
  costPer: 'run',
  parts: {
    standardTrack: { name: 'Standard Track', group: 'Track', unit: 'score', better: 'higher' },
    designTrack: { name: 'Design Track', group: 'Track', unit: 'score', better: 'higher' },
    mathReasoning: { name: 'Math Reasoning', group: 'Category', unit: 'score', better: 'higher' },
    perfOptimization: { name: 'Performance Optimization', group: 'Category', unit: 'score', better: 'higher' },
    algoBattle: { name: 'Algorithm Battle', group: 'Category', unit: 'score', better: 'higher' },
    spatialReasoning: { name: 'Spatial Reasoning', group: 'Category', unit: 'score', better: 'higher' },
    geometricModeling: { name: 'Geometric Modeling', group: 'Category', unit: 'score', better: 'higher' },
    interactiveApps: { name: 'Complex Interactive Apps', group: 'Category', unit: 'score', better: 'higher' },
    gameDev: { name: 'Game Design and Development', group: 'Category', unit: 'score', better: 'higher' },
    physicsSim: { name: 'Physics Simulation', group: 'Category', unit: 'score', better: 'higher' },
    visualRendering: { name: 'Visual Design and Rendering', group: 'Category', unit: 'score', better: 'higher' },
    systemArch: { name: 'System Architecture', group: 'Category', unit: 'score', better: 'higher' },
  },
  stats: {
    totalTokens: { name: 'Total tokens', unit: 'tokens', better: 'lower', note: 'Total tokens consumed across the 13 Decathlon tasks.' },
    tokensPerSec: { name: 'Generation speed', unit: 'tokens/s', better: 'higher', note: 'Average output generation speed in tokens per second.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [modelsText, scoresText] = await Promise.all([fetchText(MODELS_FEED), fetchText(SCORES_FEED)]);
    const models = JSON.parse(modelsText) as DecathlonModel[];
    const scoresMap = (JSON.parse(scoresText) as DecathlonScoresFeed).scores ?? {};

    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const sc = scoresMap[m.id];
      if (!m.name || !sc || !Number.isFinite(sc.total)) continue;
      const metrics: Record<string, number> = {};
      if (typeof sc.kinds?.standard === 'number' && Number.isFinite(sc.kinds.standard)) metrics.standardTrack = sc.kinds.standard;
      if (typeof sc.kinds?.design === 'number' && Number.isFinite(sc.kinds.design)) metrics.designTrack = sc.kinds.design;
      for (const [src, dst] of CAT_KEYS) {
        const v = sc.categories?.[src];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[dst] = v;
      }
      if (typeof sc.cost?.tokens === 'number' && Number.isFinite(sc.cost.tokens) && sc.cost.tokens > 0) {
        metrics.totalTokens = sc.cost.tokens;
      }
      if (typeof sc.cost?.tps === 'number' && Number.isFinite(sc.cost.tps) && sc.cost.tps > 0) {
        metrics.tokensPerSec = sc.cost.tps;
      }
      const date = m.tested && /^\d{4}-\d{2}-\d{2}$/.test(m.tested) ? m.tested : undefined;
      const cost = typeof sc.cost?.api_usd === 'number' && Number.isFinite(sc.cost.api_usd) && sc.cost.api_usd > 0 ? sc.cost.api_usd : undefined;
      const rawAgent = m.agent?.trim();
      const harness = rawAgent && /^Antigravity CLI$/i.test(rawAgent) ? 'Antigravity' : rawAgent;

      rows.push({
        model: m.name.trim(),
        score: sc.total,
        ...(m.effort ? { setting: m.effort.trim() } : {}),
        ...(harness ? { harness } : {}),
        ...(date ? { date } : {}),
        ...(cost !== undefined ? { cost } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
