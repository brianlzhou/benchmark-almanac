// MathVerse (CUHK MMLab). mathverse-cuhk.github.io serves its leaderboard as a static HTML table: Model,
// Method, Source, Date, then ALL and six problem versions, each as a pair of columns: the CoT-E score
// (GPT-4 grades the reasoning steps) and "w/o" (plain answer accuracy, 0 to 100). The board ranks by ALL
// accuracy, the number model cards cite. Use ALL accuracy as the score; CoT-E is a secondary metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://mathverse-cuhk.github.io/';

const board: Leaderboard = {
  benchmark: 'mathverse',
  url: `${URL}#leaderboard`,
  feed: `${URL} (results table, ALL accuracy and CoT-E)`,
  terms: 'Static GitHub Pages project page with no stated terms; the MathVerse repository is MIT-licensed.',
  stats: {
    cotE: { name: 'CoT-E score', unit: '%', better: 'higher', note: 'GPT-4 grades the reasoning steps.' },
  },
  parts: {
    textDominantWoutCotE: { name: 'Text Dominant answer accuracy', group: 'Modality', unit: '%' },
    textLiteWoutCotE: { name: 'Text Lite answer accuracy', group: 'Modality', unit: '%' },
    textOnlyWoutCotE: { name: 'Text Only answer accuracy', group: 'Modality', unit: '%' },
    visionIntensiveWoutCotE: { name: 'Vision Intensive answer accuracy', group: 'Modality', unit: '%' },
    visionDominantWoutCotE: { name: 'Vision Dominant answer accuracy', group: 'Modality', unit: '%' },
    visionOnlyWoutCotE: { name: 'Vision Only answer accuracy', group: 'Modality', unit: '%' },
    textDominantCotE: { name: 'Text Dominant CoT-E', group: 'Modality CoT-E', unit: '%' },
    textLiteCotE: { name: 'Text Lite CoT-E', group: 'Modality CoT-E', unit: '%' },
    textOnlyCotE: { name: 'Text Only CoT-E', group: 'Modality CoT-E', unit: '%' },
    visionIntensiveCotE: { name: 'Vision Intensive CoT-E', group: 'Modality CoT-E', unit: '%' },
    visionDominantCotE: { name: 'Vision Dominant CoT-E', group: 'Modality CoT-E', unit: '%' },
    visionOnlyCotE: { name: 'Vision Only CoT-E', group: 'Modality CoT-E', unit: '%' },
  },
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'ALL'));
    if (!t) throw new Error('results table not found');
    const head = t[0].map((c) => c.text);
    const sub = t[1].map((c) => c.text);
    if (head[1] !== 'Model' || head[4] !== 'Date' || head[5] !== 'ALL' || sub[0] !== 'CoT-E' || sub[1] !== 'w/o') {
      throw new Error(`unexpected columns: ${head.join(' | ')} / ${sub.join(' | ')}`);
    }
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const model = r[1]?.text.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const score = num(r[6]?.text);
      if (!model || /^(human|random)/i.test(model)) continue;
      const date = /^\d{4}-\d\d-\d\d$/.test(r[4].text) ? r[4].text : undefined;
      const link = r[3]?.html.match(/href="(https?:\/\/[^"]+)"/)?.[1];
      const cot = num(r[5]?.text);
      const metrics: Record<string, number> = {};
      if (cot !== undefined) metrics.cotE = cot;
      for (const [key, index] of [
        ['textDominantCotE', 7], ['textDominantWoutCotE', 8], ['textLiteCotE', 9], ['textLiteWoutCotE', 10],
        ['textOnlyCotE', 11], ['textOnlyWoutCotE', 12], ['visionIntensiveCotE', 13], ['visionIntensiveWoutCotE', 14],
        ['visionDominantCotE', 15], ['visionDominantWoutCotE', 16], ['visionOnlyCotE', 17], ['visionOnlyWoutCotE', 18],
      ] as const) {
        const value = num(r[index]?.text);
        if (value !== undefined) metrics[key] = value;
      }
      if (score !== undefined) rows.push({model, score, date, link, params: model.match(/(?:^|[- ])(\d+(?:\.\d+)?)B(?:$|[- ])/i) ? Number(model.match(/(?:^|[- ])(\d+(?:\.\d+)?)B(?:$|[- ])/i)![1]) : undefined, metrics: Object.keys(metrics).length ? metrics : undefined});
    }
    return rows;
  },
};
export default board;
