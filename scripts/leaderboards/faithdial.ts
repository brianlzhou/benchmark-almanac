// FaithDial tests dialogue grounded in supplied knowledge. Table 5 lists the Critic hallucination
// rate first, measured as the percentage of responses the critic flags. Table 7 adds human ratings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2204.10757';

const board: Leaderboard = {
  benchmark: 'faithdial', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2204.10757",
  headline: 'The headline is the Critic hallucination rate in Table 5, where a lower percentage is better.',
  stats: {
    'Q2 F1': { name: 'Q2 F1', unit: '%', better: 'higher' },
    'Q2 NLI': { name: 'Q2 NLI', unit: '%', better: 'higher' },
    BERTScore: { name: 'BERTScore', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    F1: { name: 'Token F1', unit: '%', better: 'higher' },
    BLEU: { name: 'BLEU', unit: 'score', better: 'higher' },
    ROUGE: { name: 'ROUGE', unit: 'score', better: 'higher' },
    'Human: Interpretable': { name: 'Human interpretable rate', unit: '%', better: 'higher' },
    'Human: Hallucination': { name: 'Human hallucination rate', unit: '%', better: 'lower' },
    'Human: Cooperativeness': { name: 'Human cooperativeness', unit: 'score', better: 'higher', note: 'Likert scale from 1 to 4.' },
    'Human: Abstractiveness': { name: 'Human abstractiveness', unit: 'score', better: 'higher', note: 'Likert scale from 1 to 4.' },
    'Human: Engagingness': { name: 'Human engagingness', unit: 'score', better: 'higher', note: 'Likert scale from 1 to 4.' },
    'Human: Generic': { name: 'Human generic response rate', unit: '%', better: 'lower' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.[2]?.startsWith('Critic') && t[0]?.[5]?.startsWith('BERTScore'));
    const human = tables.find(t => t[0]?.[2] === 'Interpretable' && t[0]?.[3] === 'Hallucination');
    if (!main || !human) throw new Error('Missing FaithDial results');
    const measure = (s:string) => numberCell(s.replace(/^0\s+/, '').replace(/[%\s∗]+$/, ''));
    const metrics = ['Q2 F1','Q2 NLI','BERTScore','F1','BLEU','ROUGE'];
    const rows: LeaderboardRow[] = main.slice(2).map(([training,model,critic,...values]) => {
      if (values.length !== 6) throw new Error('Missing automatic metric');
      return {model,setting:'Trained on ' + training,score:measure(critic),metrics:Object.fromEntries(metrics.map((k,i) => [k,measure(values[i])]))};
    });
    const humanMetrics = ['Interpretable','Hallucination','Cooperativeness','Abstractiveness','Engagingness','Generic'];
    for (const [training,label,...values] of human.slice(2)) {
      const model = label === 'T5-WoW' ? 'T5' : label;
      const dataset = label === 'T5-WoW' ? 'FaithDial (+WoW)' : training;
      const row = rows.find(r => r.model === model && r.setting === 'Trained on ' + dataset);
      if (!row || values.length !== 6) throw new Error('Unmatched human evaluation');
      humanMetrics.forEach((k,i) => {row.metrics!['Human: ' + k] = measure(values[i]);});
    }
    return checked(rows,20);
  },
};
export default board;
