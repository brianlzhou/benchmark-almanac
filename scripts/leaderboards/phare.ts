// Phare (Giskard). phare.giskard.ai is a static page whose leaderboard table gives, per model, Average Safety
// (the mean of hallucination, harm, bias and jailbreak resistance, 0 to 100, the ranking) and the four
// sub-scores. Average Safety is the score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://phare.giskard.ai/';

const board: Leaderboard = {
  benchmark: 'phare',
  url: URL,
  feed: `${URL} (static HTML table, Average Safety)`,
  terms: 'Static public page; the site publishes no robots.txt and no terms.',
  aliases: {
    'Llama 3.1 405B Instruct': 'llama-3-1-405b',
    'Llama 3.1 8B Instruct': 'llama-3-1-8b',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    'Command A': 'cohere-command-a',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Average Safety'));
    if (!t) throw new Error('Phare table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore] = [head.indexOf('Model'), head.indexOf('Average Safety')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      let model = (r[iModel]?.text ?? '').replace(/\s+OR$/, ''); // "OR": run through OpenRouter
      // "Claude 4.5 Haiku": the board puts the version before the tier
      model = model.replace(/^Claude (\d(?:\.\d)?) (Opus|Sonnet|Haiku)$/, 'Claude $2 $1');
      const off = /\s+No Reasoning$/i.test(model);
      if (off) model = model.replace(/\s+No Reasoning$/i, '');
      const score = num(r[iScore]?.text);
      const metrics:Record<string,number>={};
      for(let i=iScore+1;i<head.length;i++){const n=num(r[i]?.text);if(n!==undefined)metrics[head[i]]=n;}
      if (model && score !== undefined) rows.push({ model, score, setting: off ? 'non-reasoning' : undefined, metrics });
    }
    return rows;
  },
};
export default board;
