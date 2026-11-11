// ClemBench v4, all languages and games, follows the official default leaderboard.
// The official reader says "the model score is then the mean of those per-language clemscores".
// The CSV repeats each published language clemscore across its games. Count each language once.
// Source: https://clembench.github.io/assets/js/leaderboard.js
// Costs and token counts are full-suite totals, retained as metrics rather than per-task values.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num, jsonAfter } from '../lib/html.ts';

const FEED = "https://clembench.github.io/assets/benchmark_results/v4/combined_results.csv";
const board: Leaderboard = {
  benchmark: "clembench",
  url: "https://clembench.github.io/leaderboard.html",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    await new Promise(r => setTimeout(r,1100));
    const costs = parseCsv(await fetchText('https://clembench.github.io/assets/benchmark_results/v4/cost_by_language.csv'));
    await new Promise(r => setTimeout(r,1100));
    const script = await fetchText('https://clembench.github.io/assets/js/leaderboard.js');
    const aliases = jsonAfter(script, 'var MODEL_ALIAS =') as Record<string,string>;
    const canon = (s:string) => aliases[s.toLowerCase()] || s.toLowerCase();
    const models = [...new Set(rows.map(r=>canon(r.model)))];
    return models.map(model=>{
      const rs=rows.filter(r=>canon(r.model)===model);
      const langs=[...new Set(rs.map(r=>r.language))];
      const scores=langs.map(l=>{const values=[...new Set(rs.filter(r=>r.language===l).map(r=>num(r.clemscore)))];
        if(values.length!==1 || values[0]===undefined) throw new Error('Missing or inconsistent published language clemscore');
        return values[0];});
      const cs=costs.filter(r=>canon(r.model_folder || r.model_label)===model);
      return {model,score:scores.reduce((s,x)=>s+x,0)/scores.length,setting:'v4, all languages',
        metrics:{languages:langs.length,totalCost:cs.reduce((s,r)=>s+(num(r.total_cost)||0),0),totalInputTokens:cs.reduce((s,r)=>s+(num(r.input_tokens)||0),0),totalOutputTokens:cs.reduce((s,r)=>s+(num(r.output_tokens)||0),0)}};
    });
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
