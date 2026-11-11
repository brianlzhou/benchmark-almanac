// CulturalBench: Hard average accuracy, the official app’s initial display.
// The app sets display_leaderboard("CulturalBench_Hard", "average") as its default.
// Regional diagnostics and the Easy view do not become independent rows.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/kellycyy/CulturalBench/raw/main/data/CulturalBench_Hard_average.csv";
const board: Leaderboard = {
  benchmark: "culturalbench",
  url: "https://huggingface.co/spaces/kellycyy/CulturalBench/raw/main/data/CulturalBench_Hard_average.csv",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const rows=parseCsv(await fetchText(FEED));
    if(!rows.length)throw new Error('CulturalBench CSV empty');
    return rows.map(r=>({model:r.model,score:Number(r.accuracy)}));
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  if (/^(gpt35turbo|gpt4o)$/i.test(r.model)) return {...r, model: r.model + ' (snapshot unspecified)'};
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
