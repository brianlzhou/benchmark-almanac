// SummScreenFD tests summarization of television scripts from ForeverDreaming.
// SOTA2 ranks test-set systems by ROUGE-1. Other published ROUGE and BERTScore values accompany each row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/document-summarization-on-summscreenfd-test';
const board: Leaderboard = {
  benchmark: 'summscreenfd', host: 'SOTA2 Research', url: feed, feed,
  terms: 'SOTA2 publishes and credits each source on its comparison page. https://www.sota2.com/research/sota/document-summarization-on-summscreenfd-test',
  headline: 'The score is ROUGE-1 on the ForeverDreaming test set.',
  stats: {
    rouge2: {name: 'ROUGE-2', unit: '%', better: 'higher'},
    rougeL: {name: 'ROUGE-L', unit: '%', better: 'higher'},
    bertScoreF1: {name: 'BERTScore F1', unit: '%', better: 'higher'},
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Method|Links|ROUGE-1|ROUGE-2|ROUGE-L|BERTScore F1|ROUGE Geometric Mean');
    if (!table) throw new Error('SummScreenFD leaderboard columns changed');
    const rows: LeaderboardRow[] = [];
    for (const [method, , r1, ...other] of table.slice(1)) {
      if (r1.text === '—' || /oracle/i.test(method.text)) continue;
      const anchor = method.html.match(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/);
      if (!anchor || !/^\d+(?:\.\d+)?$/.test(r1.text)) throw new Error('Missing model or ROUGE-1');
      const model = text(anchor[2]);
      const setting = text(method.html.match(/role="tooltip"[^>]*>(.*?)<\/span>/)?.[1] ?? '');
      if (model === 'SLED' && setting === 'Fine-tuned parameters (millions)=406' || model === 'SUMMN' && !setting) continue;
      const metrics: Record<string, number> = {};
      other.forEach((cell, i) => {
        if (cell.text === '—') return;
        if (!/^\d+(?:\.\d+)?$/.test(cell.text)) throw new Error('Invalid secondary score for ' + model);
        metrics[['rouge2','rougeL','bertScoreF1','rougeGeometricMean'][i]] = Number(cell.text);
      });
      rows.push({model, setting: setting || undefined, score: Number(r1.text), metrics, link: new URL(anchor[1], feed).href});
    }
    return checked(rows, 20);
  },
};
export default board;
