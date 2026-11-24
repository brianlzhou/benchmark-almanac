// Aspire's final-only protocol publishes a macro average across all six goal groups in its prose.
// Read each goal’s base score, two independent runs, final mean, and change from base.
// These are Qwen3.5-4B and Qwen3.5-9B evolution results, not the separate S3Gym game leaderboard.
// The harness-creation table covers only 20 writing items and is excluded.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2608.31111";
const goals: Record<string,string> = {
  science: 'Scientific and academic reasoning', humanities: 'Humanities and social sciences',
  math: 'Mathematical reasoning', health: 'Health and medicine',
  logic: 'Logic, reliability, and instruction following', writing: 'Academic and scientific writing',
};
const board: Leaderboard = {
  benchmark: "aspire", static: 'paper',
  url: "https://arxiv.org/html/2608.31111",
  feed: FEED,
  parts: Object.fromEntries(Object.entries(goals).map(([key,name]) => [key,{name,group:'Vague goal'}])),
  stats: {
    baseMacro: { name: 'Base macro average', unit: '%', better: 'higher' },
    ...Object.fromEntries(Object.entries(goals).flatMap(([key, name]) => [
      [key + 'Base', { name: name + ' base score', unit: '%' as const, better: 'higher' as const }],
      [key + 'RunA', { name: name + ' run A', unit: '%' as const, better: 'higher' as const }],
      [key + 'RunB', { name: name + ' run B', unit: '%' as const, better: 'higher' as const }],
      [key + 'Delta', { name: name + ' change from base', unit: 'score' as const, better: 'higher' as const, note: 'Change from base score in percentage points.' }],
    ])),
  },
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const html=await fetchText(FEED);
    const source=text(html);
    const m=source.match(/raw final-checkpoint macro average\s+falls from ([\d.]+) to ([\d.]+) for 4B and from ([\d.]+) to ([\d.]+) for 9B/);
    if(!m)throw new Error('Final-only macro averages missing');
    const table=paperTables(html).map(grid).find(t => t[1]?.[0] === 'Vague goal' && t[1]?.[4] === 'Mean');
    if (!table) throw new Error('Final-only goal scores missing');
    return [4,9].map((params,index) => {
      const metrics: Record<string,number> = {baseMacro:Number(m[1+2*index])};
      const offset = 1+5*index;
      for (const [key,name] of Object.entries(goals)) {
        const row = table.find(r => r[0] === name);
        if (!row) throw new Error('Missing final-only goal: '+name);
        for (const [i,suffix] of ['Base','RunA','RunB','','Delta'].entries()) {
          if (/^[+-]?[\d.]+$/.test(row[offset+i])) metrics[key+suffix] = Number(row[offset+i]);
        }
      }
      return {model:'Qwen3.5-'+params+'B', score:Number(m[2+2*index]), setting:'Final-only evolution',
        params, trials:2, metrics};
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
