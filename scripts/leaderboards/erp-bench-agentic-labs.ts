// ERP-Bench reports pass@1 for each model using three interfaces to the same ERP tasks.
// Agentic Labs publishes the percentages as text on the leaderboard's bars.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://erpbench.ai/';
const board: Leaderboard = {
  benchmark: 'erp-bench-agentic-labs', url, feed: url,
  terms: 'Public leaderboard published by Agentic Labs with its benchmark paper.',
  reference: ['pi'],
  async fetch() {
    const html = await fetchText(url);
    const models = html.split('<div class="lb-row">').slice(1);
    if (models.length < 4) throw new Error('Incomplete ERP-Bench chart');
    return models.flatMap(section => {
      const model = section.match(/class="m-name">([^<]+)/)?.[1];
      const values = [...section.matchAll(/class="lb-label">([^<]+)<\/span>\s*<div class="lb-track">.*?class="lb-val[^"]*">([\d.]+)(<sup>†<\/sup>)?<\/span>/g)];
      if (!model || !['Coding', 'Browser', 'Computer'].every(k => values.some(v => v[1] === k))) throw new Error('Missing ERP interface score');
      return values.map(v => ({
        model, score: Number(v[2]), harness: 'pi', setting: v[1] + (v[3] ? ' (halted early)' : ''),
        open: section.match(/class="m-vendor">([^<]+)/)?.[1].includes('open-weight'),
      }));
    });
  },
};
export default board;
