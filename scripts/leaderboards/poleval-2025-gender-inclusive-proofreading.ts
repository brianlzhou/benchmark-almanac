// PolEval publishes the three final proofreading scores under Task 2a. Read the named entrants and their F1 scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

export function polevalRanking(html:string, section:string, minimum:number) {
  const body = html.split('id="'+section+'"')[1]?.match(/<ol>([\s\S]*?)<\/ol>/)?.[1];
  if (!body) throw new Error('PolEval section missing: '+section);
  const rows = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(entry => {
    const match = text(entry[1]).match(/^(.+?) \(([\d.]+)\)$/);
    if (!match || !Number.isFinite(Number(match[2]))) throw new Error('Invalid PolEval score');
    return {model:match[1],submitter:match[1],score:Number(match[2])};
  });
  if (rows.length < minimum) throw new Error('Incomplete PolEval rankings');
  return rows;
}
const board: Leaderboard = {
  benchmark:'poleval-2025-gender-inclusive-proofreading',url:'https://poleval.pl/2025/results/',feed:'https://poleval.pl/2025/results/',
  terms:'PolEval publishes the finalist scores without separate reuse terms. Its robots.txt allows the results page.',
  async fetch() { return polevalRanking(await fetchText(this.url),'task-2a-gender-inclusive-llms-for-polish-proofreading',3); },
};
export default board;
