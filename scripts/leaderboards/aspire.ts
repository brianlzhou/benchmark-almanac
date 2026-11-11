// Aspire's final-only protocol publishes a macro average across all six goal groups in its prose.
// The score is the published raw final-checkpoint macro average. The base model average remains a metric.
// These are Qwen3.5-4B and Qwen3.5-9B evolution results, not the separate S3Gym game leaderboard.
// The harness-creation table covers only 20 writing items and is excluded.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2608.31111";
const board: Leaderboard = {
  benchmark: "aspire",
  url: "https://arxiv.org/html/2608.31111",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const source=text(await fetchText(FEED));
    const m=source.match(/raw final-checkpoint macro average\s+falls from ([\d.]+) to ([\d.]+) for 4B and from ([\d.]+) to ([\d.]+) for 9B/);
    if(!m)throw new Error('Final-only macro averages missing');
    return [{model:'Qwen3.5-4B',score:Number(m[2]),setting:'Final-only evolution',metrics:{baseMacro:Number(m[1])}},
      {model:'Qwen3.5-9B',score:Number(m[4]),setting:'Final-only evolution',metrics:{baseMacro:Number(m[3])}}];
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
