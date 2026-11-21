// Inverse IFEval measures compliance with instructions that conflict with common model habits.
// Table 3 gives the overall score and eight instruction-type scores for each language.
// The bilingual score averages the two overall scores, as the authors do in Figure 4(a).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2509.04292';
const types = ['QC', 'ITF', 'CC', 'CCF', 'DIA', 'II', 'MIM', 'CA'];
const languages = ['English', 'Chinese'];
export default {
  benchmark: 'inverse-ifeval', static: 'paper', url: 'https://arxiv.org/abs/2509.04292', feed,
  terms: 'arXiv allows the HTML paper under robots.txt. The authors published it under CC0.',
  parts: Object.fromEntries(languages.flatMap(lang => [
    [lang, { name: lang, group: 'Language' }],
    ...types.map(type => [lang + type, { name: type, group: lang }]),
  ])),
  aliases: { 'o3-high': 'o3', 'GPT-5-high': 'gpt-5', 'o4-mini-high': 'o4-mini',
    'Claude-4-Opus-Thinking': 'claude-opus-4', 'Claude-4-Sonnet-Thinking': 'claude-sonnet-4' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const results = new Map<string, LeaderboardRow>();
    for (const lang of languages) {
      const header = ['Models', 'Overall Score (' + lang + ')', ...types];
      const table = tables.find(t => t[1]?.join('|') === header.join('|'));
      if (!table) throw new Error('Missing Inverse IFEval ' + lang + ' results');
      let open: boolean | undefined;
      for (const cells of table.slice(2)) {
        const model = cells[0];
        if (model === 'Open-Source Large Language Models' || model === 'Closed-Source Large Language Models') {
          open = model.startsWith('Open');
          continue;
        }
        if (open === undefined || cells.length !== header.length) throw new Error('Incomplete Inverse IFEval row');
        const row = results.get(model) ?? { model, open, score: 0, metrics: {} };
        const metrics = row.metrics!;
        if (lang in metrics) throw new Error('Duplicate Inverse IFEval result: ' + model);
        metrics[lang] = numberCell(cells[1]);
        types.forEach((key, i) => { metrics[lang + key] = numberCell(cells[i + 2]); });
        if (/-high$/i.test(model)) row.setting = 'high';
        if (/-thinking(?:-|$)/i.test(model)) row.setting = 'thinking';
        results.set(model, row);
      }
    }
    // Table 3 labels the English run o4-mini-high and the Chinese run o4-mini.
    // Keep a bilingual score only where the same configuration appears in both panels.
    for (const model of ['o4-mini-high', 'o4-mini']) {
      const row = results.get(model);
      if (row && !(languages.every(lang => lang in row.metrics!))) results.delete(model);
    }
    if (results.size < 21) throw new Error('Expected at least 21 Inverse IFEval models');
    for (const row of results.values()) {
      row.score = (row.metrics!.English + row.metrics!.Chinese) / 2;
      if (!Number.isFinite(row.score)) throw new Error('Missing language for ' + row.model);
    }
    return [...results.values()];
  },
} satisfies Leaderboard;
