// VLMsAreBiased: counterfactual counting accuracy, in percent. Read the five-model table and the
// separate GPT-6 Astra update. Reasoning-token bins describe subsets, not mean output tokens per task;
// keep these subset accuracy and bias rate scores as metrics on the overall row, never as competing scores.
import type { BoardPart, BoardStat, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://vlmsarebiased.github.io";
const CATEGORIES = ['Animal', 'Logo', 'Flag', 'Chess', 'Board', 'Illusion', 'Grid'] as const;
const TOKEN_BINS: [string, string][] = [
  ['tokens_0', '0'],
  ['tokens_1_64', '1 to 64'],
  ['tokens_65_128', '65 to 128'],
  ['tokens_129_256', '129 to 256'],
  ['tokens_257_500', '257 to 500'],
];

const parts: Record<string, BoardPart> = {
  ...Object.fromEntries(CATEGORIES.map((name) => [name.toLowerCase(), { name, group: 'Category' }])),
  ...Object.fromEntries(TOKEN_BINS.map(([k, label]) => [k, { name: label, group: 'Reasoning tokens' }])),
};

const stats: Record<string, BoardStat> = {
  original: { name: 'Original prompt accuracy', unit: '%', better: 'higher' },
  biasRate: { name: 'Overall bias rate', unit: '%', better: 'lower' },
  ...Object.fromEntries(CATEGORIES.map((name) => [`${name.toLowerCase()}BiasRate`, { name: `${name} bias rate`, unit: '%', better: 'lower' as const }])),
  ...Object.fromEntries(TOKEN_BINS.map(([k, label]) => [`${k}_bias`, { name: `Bias rate at ${label} reasoning tokens`, unit: '%', better: 'lower' as const }])),
};

const board: Leaderboard = {
  benchmark: "vlmsarebiased",
  url: "https://vlmsarebiased.github.io",
  feed: FEED,
  terms: 'The benchmark authors publish this public feed. Their source license and site terms apply.',
  parts,
  stats,
  aliases: { 'Sonnet-3.7': 'claude-3-7-sonnet' },
  async fetch() {
    const ts = tables(await fetchText(FEED));
    const rows: LeaderboardRow[] = [];
    const t = ts.find(t => t[0]?.some(c => c.text === 'CF mean'));
    if (!t) throw new Error('CF mean table missing');
    const categories = (row: NonNullable<typeof t>[number], bias = false) => {
      const metrics: Record<string, number> = {};
      for (let i = 1; i <= 7; i++) {
        const name = t[0][i].text;
        const key = name.toLowerCase();
        const score = num(row[i]?.text);
        if (score === undefined) continue;
        metrics[bias ? key + 'BiasRate' : key] = score;
      }
      return metrics;
    };
    for (const r of t.slice(1)) {
      const score = num(r[8]?.text);
      if (score === undefined || r[0].text === 'Mean') continue;
      let model = r[0].text;
      if (model === 'Gemini-2.5 Pro') model += ' [snapshot unspecified]';
      rows.push({ model, score, setting: 'Counterfactual images', metrics: { ...categories(r), original: num(r[9].text)! } });
    }
    const update = ts.find(t => t.some(r => r[0]?.text === 'GPT-6 Astra, accuracy'));
    const r = update?.find(r => r[0]?.text === 'GPT-6 Astra, accuracy');
    if (r) {
      const score = num(r[8]?.text);
      const bias = update?.find(row => row[0]?.text === 'GPT-6 Astra, bias rate');
      if (score !== undefined) {
        rows.push({
          model: 'GPT-6 Astra',
          score,
          setting: 'Counterfactual images',
          metrics: { ...categories(r), ...(bias ? { ...categories(bias, true), biasRate: num(bias[8].text)! } : {}) },
        });
      }
    }
    const bins = ts.find(t => t[0]?.[0]?.text === 'Reasoning tokens');
    if (bins) {
      for (const row of bins.slice(1)) {
        const score = num(row[2]?.text);
        if (score === undefined) continue;
        rows.push({ model: 'GPT-6 Astra', score, setting: `Reasoning token bin: ${row[0].text}`, metrics: { biasRate: num(row[3].text)! } });
      }
    }
    const result: LeaderboardRow[] = rows.filter(row => row.setting === 'Counterfactual images').map(row => ({
      ...row,
      setting: undefined,
      metrics: {
        ...row.metrics,
        ...Object.fromEntries(rows.filter(x => x.model === row.model && x.setting!.startsWith('Reasoning token bin:'))
          .flatMap(x => {
            const key = 'tokens_' + x.setting!.replace('Reasoning token bin: ', '').replace(/&ndash;/g, '_').replace(/[^0-9_]+/g, '');
            return [[key, x.score], [key + '_bias', x.metrics!.biasRate]];
          })),
      },
    }));
    const prompting = ts.find(t => t[0]?.some(c => c.text === '+ Debiased prompt'));
    if (prompting) {
      for (const row of prompting.slice(1)) {
        if (!row[0]?.text || row[0].text === 'Mean') continue;
        let model = row[0].text;
        if (model === 'Gemini-2.5 Pro') model += ' [snapshot unspecified]';
        for (let i = 2; i < row.length; i++) {
          const score = num(row[i].text);
          if (score === undefined) continue;
          result.push({ model, score, setting: 'Counterfactual images; ' + prompting[0][i].text, metrics: {} });
        }
      }
    }
    return result;
  },
};
export default board;
