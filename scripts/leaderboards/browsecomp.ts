// Read accuracy and calibration error for each browsing configuration in Table 3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
import { withKaggle } from '../lib/boards/kaggle.ts';
const feed='https://arxiv.org/html/2504.12516';
const board = {
  benchmark:'browsecomp', static: 'paper',url:'https://arxiv.org/abs/2504.12516',feed,terms:PAPER_TERMS,harnesses:'system',
  aliases:{"OpenAI o1": "o1"},
  stats:{ calibrationError:{ name:'Calibration error', unit:'%', better:'lower', note:'Difference between the model’s confidence and the likelihood that its answer is correct.' } },
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Model|Accuracy (%)|Calibration Error (%)');
    if(!t)throw new Error('BrowseComp results missing');
    const names:Record<string,string>={'GPT-4o':'gpt-4o-2024-08-06','GPT-4o w/ browsing':'gpt-4o-search-preview-2025-03-11','GPT-4.5':'gpt-4.5-preview-2025-02-27','OpenAI o1':'o1-2024-12-17'};
    const rows=t.slice(1).map(r=>({model:r[0].startsWith('Deep Research')?'OpenAI Deep Research (base model unspecified)':names[r[0]]??uncertain(r[0]),score:num(r[1])!,harness:r[0].startsWith('Deep Research')?'OpenAI Deep Research':undefined,setting:r[0]==='OpenAI o1'?'medium effort, no browsing':r[0].includes('w/ browsing')||r[0].startsWith('Deep Research')?'browsing enabled':'no browsing',metrics:{calibrationError:num(r[2])!}}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
export default withKaggle(board, { owner: 'openai', slug: 'browsecomp', task: 'Score', scale: 100 });
