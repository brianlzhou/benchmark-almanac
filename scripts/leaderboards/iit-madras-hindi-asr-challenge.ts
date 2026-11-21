// IIT Madras ranks Hindi speech recognition teams by word error rate. Google Sites embeds separate final tables for open and closed training.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://sites.google.com/view/asr-challenge/leaderboard";

const board: Leaderboard = {
  benchmark: "iit-madras-hindi-asr-challenge",
  url: "https://sites.google.com/view/asr-challenge/leaderboard",
  feed,
  terms: "Eight entries in the open track. The organizer gives no score reuse license. https://sites.google.com/view/asr-challenge/leaderboard The feed host publishes robots.txt at https://sites.google.com/robots.txt.",
  stats: { submissions: { name: 'Submissions', unit: 'count' } },
  async fetch() {
    const page = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const embed of page.matchAll(/data-code="([^"]+)"/g)) {
      const source = embed[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replace(/<!--[\s\S]*?-->/g, '');
      for (const section of source.split(/<h4\b/i).slice(1)) {
        const setting = section.match(/(Open Task|Closed Task)/i)?.[1];
        const [table] = tables(section);
        if (!setting || table?.[0]?.[2]?.text !== 'Best Score(WER %)') continue;
        for (const cells of table.slice(1)) {
          const [, model, wer, count, method] = cells.map(c => c.text);
          const score = Number.parseFloat(wer);
          if (!model || !Number.isFinite(score)) throw new Error('Invalid Hindi ASR score');
          rows.push({ model, score, setting, submitter: model, harness: method, metrics: { submissions: Number(count) } });
        }
      }
    }
    if (rows.length < 21) throw new Error('Incomplete Hindi ASR standings');
    return rows;
  },
};
export default board;
