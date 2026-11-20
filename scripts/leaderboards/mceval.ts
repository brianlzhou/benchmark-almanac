// McEval: AVG from the author leaderboard default Complete tab, meaning full code generation.
// The page initializes tab1 and associates it with Complete. The brief permits the author default view.
// AVG covers all 40 languages. It is converted from a fraction to percentage.
// Explanation and infilling are separate test sets, so they are not competing rows.
// The importer discovers the current JS bundle and reads its literal data without executing it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://mceval.github.io/leaderboard.html";
const board: Leaderboard = {
 benchmark: "mceval",
 parts: {
   AWK: { name: 'AWK', group: 'Language' },
   C: { name: 'C', group: 'Language' },
   'C++': { name: 'C++', group: 'Language' },
   'C#': { name: 'C#', group: 'Language' },
   Clisp: { name: 'Clisp', group: 'Language' },
   Dart: { name: 'Dart', group: 'Language' },
   Elisp: { name: 'Elisp', group: 'Language' },
   Elixir: { name: 'Elixir', group: 'Language' },
   Erlang: { name: 'Erlang', group: 'Language' },
   Fortran: { name: 'Fortran', group: 'Language' },
   'F#': { name: 'F#', group: 'Language' },
   Go: { name: 'Go', group: 'Language' },
   Groovy: { name: 'Groovy', group: 'Language' },
   Haskell: { name: 'Haskell', group: 'Language' },
   Html: { name: 'HTML', group: 'Language' },
   Java: { name: 'Java', group: 'Language' },
   JS: { name: 'JS', group: 'Language' },
   Json: { name: 'JSON', group: 'Language' },
   Julia: { name: 'Julia', group: 'Language' },
   Kotlin: { name: 'Kotlin', group: 'Language' },
   Lua: { name: 'Lua', group: 'Language' },
   Pascal: { name: 'Pascal', group: 'Language' },
   Perl: { name: 'Perl', group: 'Language' },
   PHP: { name: 'PHP', group: 'Language' },
   Python: { name: 'Python', group: 'Language' },
   R: { name: 'R', group: 'Language' },
   Racket: { name: 'Racket', group: 'Language' },
   Ruby: { name: 'Ruby', group: 'Language' },
   Rust: { name: 'Rust', group: 'Language' },
   Scala: { name: 'Scala', group: 'Language' },
   Scheme: { name: 'Scheme', group: 'Language' },
   Shell: { name: 'Shell', group: 'Language' },
   Swift: { name: 'Swift', group: 'Language' },
   Tcl: { name: 'Tcl', group: 'Language' },
   TS: { name: 'TS', group: 'Language' },
   VB: { name: 'VB', group: 'Language' },
   VimL: { name: 'VimL', group: 'Language' },
   Coffee: { name: 'CoffeeScript', group: 'Language' },
   MD: { name: 'Markdown', group: 'Language' },
   Power: { name: 'PowerShell', group: 'Language' },
 },
 url: "https://mceval.github.io/leaderboard.html",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 fetch: () => fetchMcEvalRows(),
};
export async function fetchMcEvalRows(tab = 'tab1'): Promise<LeaderboardRow[]> {

 const html=await fetchText(FEED);
 const src=html.match(/src="([^"<>]*static\/js\/main\.[^"<>]+\.js)"/);
 if(!src) throw new Error('McEval bundle not found');
 const bundle=await fetchText(new URL(src[1],FEED).href);
 if(!bundle.includes('useState)("tab1")') || !bundle.includes('children:"Complete"')) throw new Error('McEval default view changed');
 const which=bundle.split(`case"${tab}":return`)[1]?.match(/args:\[([A-Za-z_$][\w$]*),/ )?.[1];
 if(!which) throw new Error('McEval default data binding changed');
 const literal=[...bundle.matchAll(/([A-Za-z_$][\w$]*)=JSON\.parse\('((?:\\.|[^'\\])*)'\)/g)].find(m=>m[1]===which)?.[2];
 if(!literal) throw new Error('McEval default results missing');
 const data=JSON.parse(literal.replace(/\\'/g,"'"));
 const names:Record<string,string>={'GPT-4-Turbo-231106':'gpt-4-1106-preview','GPT-3.5-Turbo-240125':'gpt-3.5-turbo-0125','GPT-4o-240513':'gpt-4o-2024-05-13','CodeQwen-1.5-7b':'CodeQwen1.5-7B (variant unspecified)'};
 return checked(data.performances.map((r:{model:string,AVG:number})=>{
  if(typeof r.AVG!=='number'||r.AVG<0||r.AVG>1)throw new Error('McEval AVG scale changed');
  const metrics: Record<string, number> = {};
  for (const [k,v] of Object.entries(r)) if (k !== 'AVG' && typeof v === 'number') metrics[k] = v * 100;
  return {model:names[r.model]||r.model,score:r.AVG*100,metrics};
 }),tab === 'tab1' ? 10 : 1);

}
export default board;
