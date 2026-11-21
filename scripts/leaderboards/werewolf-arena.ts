// Werewolf Arena studies language-model agents in a social-deduction game.
// Table 1 reports five Seer behaviors. No whole-game score is published, so the headline uses Unmasked Wolf (%),
// the primary success-related measure in the table, with the remaining behaviors kept as metrics.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2407.13943';
const board: Leaderboard = {
  benchmark: 'werewolf-arena', url: 'https://arxiv.org/abs/2407.13943', feed, static: 'paper',
  terms: 'The authors publish the paper on arXiv. https://arxiv.org/licenses/',
  headline: 'The paper reports no whole-game score, so this is the Unmasked Wolf percentage, the success-related Seer measure.',
  parts: { unmaskedWolf: 'Unmasked Wolf' },
  stats: {
    revealsPerGame: { name: 'Reveals per game', unit: 'count' }, firstRevealRound: { name: 'First reveal round', unit: 'count', better: 'lower' },
    believed: { name: 'Believed rate', unit: '%', better: 'higher' }, backfired: { name: 'Backfired rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const text = await pdfText(feed);
    const section = text.split('Seer Reveals')[1]?.split('Table 1: Seer performance')[0];
    if (!section) throw Error('Missing Werewolf Arena table');
    const header = section.match(/1\.5 Pro/);
    const rows = [...section.matchAll(/\b(Per Game|First Reveal Round|Unmasked Wolf \(\%\)|Believed \(\%\)|Backfired \(\%\))\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)];
    if (!header || rows.length !== 5) throw Error('Werewolf Arena table changed');
    const names = ['Gemini 1.5 Pro', 'Gemini Pro', 'Gemini Flash', 'GPT-4', 'GPT-4o', 'GPT-3.5'];
    const values = names.map(() => ({} as Record<string, number>));
    for (const [, label, ...cells] of rows) cells.forEach((v, i) => { values[i][label] = Number(v); });
    return checked(names.map((model, i) => ({ model, score: values[i]['Unmasked Wolf (%)'],
      metrics: { revealsPerGame: values[i]['Per Game'], firstRevealRound: values[i]['First Reveal Round'],
        believed: values[i]['Believed (%)'], backfired: values[i]['Backfired (%)'] } })), 6);
  },
};
export default board;
