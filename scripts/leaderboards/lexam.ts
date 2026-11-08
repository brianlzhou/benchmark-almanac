// LEXam. lexam-benchmark.github.io shows two static leaderboard tables: "Judge Scores on Open Questions"
// (an LLM judge grades open answers against reference answers, 0 to 100) and "Accuracy on Multiple-Choice
// Questions". The page leads with the open-question table, so its judge score is the score here; the
// multiple-choice accuracy is a separate number the page ranks on its own. Medal emoji are stripped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://lexam-benchmark.github.io/';

const board: Leaderboard = {
  benchmark: 'lexam',
  url: PAGE,
  feed: `${PAGE} (open-question judge scores and multiple-choice accuracy)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the page states no terms.',
  aliases: {
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    'Llama-3.1-405B-it': 'llama-3-1-405b',
    'Llama-3.3-70B-it': 'llama-3-3-70b-instruct',
    'Llama-3.1-8B-it': 'llama-3-1-8b',
    'Gemma-3-12B-it': 'gemma-3-12b',
    'Gemma-2-9B-it': 'gemma-2-9b',
    'Qwen-2.5-7B-it': 'qwen2-5-7b',
    'Ministral-8B-it': 'ministral-8b',
    'Qwen3-235B': 'qwen3-235b-a22b',
  },
  async fetch() {
    const ts=tables(await fetchText(PAGE));const rows:LeaderboardRow[]=[];
    for(const kind of ['Judge Scores on Open Questions','Accuracy on Multiple-Choice Questions']){
      const t=ts.find(t=>t[0]?.some(c=>c.text===kind));if(!t)throw new Error('Missing '+kind);
      for(const r of t.slice(1)){const model=r[1]?.text.replace(/[🥇🥈🥉]/gu,'').trim();const score=num(r[2]?.text);if(model&&score!==undefined)rows.push({model,score,setting:kind});}
    }
    return rows.filter(r => r.setting === 'Judge Scores on Open Questions').map(r => {
      const mcq = rows.find(x => x.model===r.model && x.setting==='Accuracy on Multiple-Choice Questions');
      return {...r, setting:undefined, ...(mcq ? {metrics:{mcq:mcq.score}} : {})};
    });
  },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
