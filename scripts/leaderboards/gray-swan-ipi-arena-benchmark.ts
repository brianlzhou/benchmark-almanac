// Gray Swan IPI Arena measures how often indirect prompt injections succeed against an agent.
// Figure 6 reports the transfer success rate and counts across the full public benchmark.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2603.15714';
const board: Leaderboard = {
  benchmark: 'gray-swan-ipi-arena-benchmark', static: 'paper',
  url: FEED + '#S4.F6',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: { 'Nova 1 Premier': 'amazon-nova-premier' },
  async fetch() {
    const html = await paperHtml(FEED);
    const figure = html.match(/<figure id="S4.F6"[\s\S]*?<\/figure>/)?.[0];
    if (!figure?.includes('Transfer ASR by target model')) throw new Error('Missing transfer ASR chart');
    const labels = [...figure.matchAll(/<span id="S4\.F6\.pic1\.\d+" class="ltx_text"[^>]*>([^<]+)<\/span>/g)].map(m => m[1]);
    const firstCount = labels.findIndex(s => /^\d+\/\d+$/.test(s));
    const names = labels.slice(0, firstCount);
    const counts = labels.filter(s => /^\d+\/\d+$/.test(s));
    const percentages = [...figure.matchAll(/<math[^>]+alttext="(\d+(?:\.\d+)?)"/g)].map(m => Number(m[1]));
    const start = percentages.indexOf(60) + 1;
    const scores = percentages.slice(start);
    if (firstCount < 15 || counts.length !== names.length || scores.length !== names.length) throw new Error('Incomplete transfer ASR chart');
    return names.map((model, i) => {
      const [successes, attempts] = counts[i].split('/').map(Number);
      if (Math.abs(100 * successes / attempts - scores[i]) > 0.051) throw new Error('Transfer ASR does not match its counts');
      return { model, score: scores[i], metrics: { successes, attempts } };
    });
  },
};
export default board;
