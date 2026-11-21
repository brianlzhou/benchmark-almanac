// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2307.16039';
export default {
  benchmark:'okapi-mmlu', static: 'paper', parts: {
  Russian: { name: 'Russian', group: 'Language' },
  German: { name: 'German', group: 'Language' },
  Chinese: { name: 'Chinese', group: 'Language' },
  French: { name: 'French', group: 'Language' },
  Spanish: { name: 'Spanish', group: 'Language' },
  Italian: { name: 'Italian', group: 'Language' },
  Dutch: { name: 'Dutch', group: 'Language' },
  Vietnamese: { name: 'Vietnamese', group: 'Language' },
  Indonesian: { name: 'Indonesian', group: 'Language' },
  Arabic: { name: 'Arabic', group: 'Language' },
  Hungarian: { name: 'Hungarian', group: 'Language' },
  Romanian: { name: 'Romanian', group: 'Language' },
  Danish: { name: 'Danish', group: 'Language' },
  Slovak: { name: 'Slovak', group: 'Language' },
  Ukrainian: { name: 'Ukrainian', group: 'Language' },
  Catalan: { name: 'Catalan', group: 'Language' },
  Serbian: { name: 'Serbian', group: 'Language' },
  Croatian: { name: 'Croatian', group: 'Language' },
  Hindi: { name: 'Hindi', group: 'Language' },
  Bengali: { name: 'Bengali', group: 'Language' },
  Tamil: { name: 'Tamil', group: 'Language' },
  Nepali: { name: 'Nepali', group: 'Language' },
  Malayalam: { name: 'Malayalam', group: 'Language' },
  Marathi: { name: 'Marathi', group: 'Language' },
  Telugu: { name: 'Telugu', group: 'Language' },
  Kannada: { name: 'Kannada', group: 'Language' },
},url:'https://arxiv.org/abs/2307.16039',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    // Tables 3/4/5 share the header: Table 5 is MMLU on all 26 non-English languages.
    const candidates=ts.filter(t=>t[0]?.join('|')==='|Language|BLOOM|BLOOMZ|SFT|RLHF');
    const t=candidates[2];
    if(candidates.length!==3 || !t || t.length!==31)throw new Error('Okapi MMLU table layout changed');
    const avg=t.find(r=>r[1]==='Average');if(!avg)throw new Error('Okapi MMLU average missing');
    const names=['BLOOM 7B','BLOOMZ 7B','Okapi BLOOM 7B SFT','Okapi BLOOM 7B RLHF'];
    const rows=names.map((model,i)=>({model,score:num(avg[i+2])!,setting:'26 non-English languages',params:7,metrics:Object.fromEntries(t.slice(1).filter(r=>r[0]).map(r=>[r[1],num(r[i+2])!]))}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
