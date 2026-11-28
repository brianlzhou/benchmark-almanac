// ColDeR tests whether retrieval shortcuts displace factual evidence. The official leaderboard ranks
// retrievers by accuracy on the foil task. Convert percent to the fraction of pairs ranked correctly.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/mohsenfayyaz/ColDeR/main/README.md';
const board: Leaderboard = {
  benchmark:'colder', url:'https://github.com/mohsenfayyaz/ColDeR#-leaderboard-', feed,
  terms:'Public results credited to the ColDeR authors. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  headline:'The leaderboard ranks models by accuracy on the foil task, the default ColDeR evaluation.',
  stats:{
    pairedTStatistic:{name:'Paired t-test statistic',unit:'score'},
  },
  async fetch() {
    const source = await fetchText(feed);
    const body = source.match(/^\| Model\s*\| Accuracy \| Paired t-Test Statistic \| p-value \|\s*\n[^\n]+\n((?:\|[^\n]+\n?)+)/m)?.[1];
    if (!body) throw new Error('Missing ColDeR leaderboard');
    return checked(body.trim().split('\n').map(line=>{
      const [entry,accuracy,statistic,p] = line.trim().slice(1,-1).split('|').map(c=>c.trim());
      const link = entry.match(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/);
      const score = accuracy.match(/^(\d+(?:\.\d+)?)\\?%$/);
      const limit = p.match(/^<\s*(\d*\.\d+)$/);
      if (!link || !score || !limit || !/^-?\d+(?:\.\d+)?$/.test(statistic)) throw new Error('Invalid ColDeR row');
      return {model:link[1],link:link[2],score:Number(score[1])/100,
        metrics:{pairedTStatistic:Number(statistic)}};
    }),8);
  },
};
export default board;
