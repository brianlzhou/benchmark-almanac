// Transluce tests how a simulated user identity changes a model's answers.
// Figure 7a gives confidence shifts in percentage points and grading shifts on a ten-point scale.
// The first panel is the headline. Each model has two identity contrasts against ordinary Gmail users.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://transluce.org/figures/user-awareness/family_sweep_trend.html';
const board: Leaderboard = {
  benchmark: 'transluce-user-awareness', static: 'paper',
  url: 'https://transluce.org/user-awareness', feed,
  terms: 'Transluce releases this study under MIT. https://github.com/TransluceAI/user-awareness/blob/main/LICENSE',
  aliases: { 'DeepSeek V3 (snapshot unspecified)': 'deepseek-v3-mar-2025', 'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025' },
  headline: 'The study gives no overall score, so this is the change in behavioral self-prediction confidence, in percentage points.',
  parts: { direct: { name: 'Grading (direct)', unit: 'score' }, prefill: { name: 'Grading (prefill)', unit: 'score' } },
  stats: { userAwareness: { name: 'Verbalized user awareness', unit: '%' },
    evaluationAwareness: { name: 'Verbalized evaluation awareness', unit: '%' },
    adjustedP: { name: 'Adjusted p-value', unit: 'score' } },
  async fetch() {
    const html = await fetchText(feed);
    const rows = new Map<string, LeaderboardRow>();
    const panels = html.split(/<text\b[^>]*class="row-title">/).slice(1);
    const names = ['Behavioral self-pred.', 'Grading (direct)', 'Grading (prefill)', 'Verbalized awareness'];
    if (panels.length !== names.length) throw new Error('Missing Figure 7a panels');
    for (const [index, panel] of panels.entries()) {
      if (text(panel.split('</text>')[0]) !== names[index]) throw new Error('Figure 7a panel changed');
      for (const mark of panel.matchAll(/data-tip="([^"]+)"/g)) {
        const d = JSON.parse(text(mark[1]));
        const setting = d.awareness ? 'Amanda - ordinary@gmail (total)' : d.series;
        const key = d.model + '/' + setting;
        const score = parseFloat(d.mean);
        if (!Number.isFinite(score)) throw new Error('Invalid figure value');
        if (index === 0) {
          const interval = d.ci.match(/^\[([+-]?[\d.]+)%, ([+-]?[\d.]+)%\]$/);
          if (!interval || !Number.isInteger(d.n) || rows.has(key)) throw new Error('Invalid confidence shift');
          rows.set(key, { model: d.model, setting: setting.endsWith('(total)') ? 'Amanda versus ordinary Gmail users' : 'Anthropic affiliation versus Gmail', score, low: Number(interval[1]), high: Number(interval[2]),
            trials: d.n, metrics: { adjustedP: d.p } });
        } else {
          const row = rows.get(key);
          if (!row) throw new Error('Missing identity contrast');
          const metric = index === 1 ? 'direct' : index === 2 ? 'prefill' :
            d.series.startsWith('User awareness') ? 'userAwareness' : 'evaluationAwareness';
          row.metrics![metric] = score;
        }
      }
    }
    for (const row of rows.values()) {
      if (row.metrics!.direct === undefined || row.metrics!.prefill === undefined) throw new Error('Missing grading shift');
    }
    return checked([...rows.values()], 48);
  },
};
export default board;
