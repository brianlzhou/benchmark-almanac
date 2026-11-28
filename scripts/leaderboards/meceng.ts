// MecEng reports overall success on its published rigid-body run. The authors rank configurations in the overallResults workbook.
import type { Leaderboard } from './types.ts';
import { loadWorkbook } from './agentclue.ts';

const feed = "https://raw.githubusercontent.com/jgerstmayr/MecEng/main/misc/paperTableData/overallResults50models_2026-06-25_mergedLLMs.xlsx";


const board: Leaderboard = {
  benchmark: "meceng",
  url: "https://github.com/jgerstmayr/MecEng/blob/main/misc/paperTableData/overallResults50models_2026-06-25_mergedLLMs.xlsx",
  feed,
  terms: "The repository uses BSD 3-Clause. https://github.com/jgerstmayr/MecEng/blob/main/LICENSE The raw file host serves no robots.txt rules.",
  stats: {
    nTasks: { name: 'Tasks', unit: 'count' }, 'LLM dur. (min)': { name: 'LLM duration', unit: 'minutes', better: 'lower' }, 'nTokGen (k)': { name: 'Generated tokens', unit: 'thousands' }, 'nThkTok (k)': { name: 'Thinking tokens', unit: 'thousands' }, 'tokens / s': { name: 'Tokens per second', unit: 'tokens/s', better: 'higher' }, 'maxCtx (k)': { name: 'Maximum context', unit: 'thousands' }, 'choose items': { name: 'Choose items success', unit: 'score', better: 'higher' }, 'reached assemble': { name: 'Reached assembly success', unit: 'score', better: 'higher' }, 'finished assemble': { name: 'Finished assembly success', unit: 'score', better: 'higher' }, 'solver init': { name: 'Solver initialization success', unit: 'score', better: 'higher' }, 'solver success': { name: 'Solver success', unit: 'score', better: 'higher' }, 'topology match': { name: 'Topology match', unit: 'score', better: 'higher' }, 'solution match': { name: 'Solution match', unit: 'score', better: 'higher' }, 'graph content match': { name: 'Graph content match', unit: 'score', better: 'higher' }, 'overall success': { name: 'Overall success', unit: 'score', better: 'higher' }, 'kin./marker nERR': { name: 'Kinematic and marker errors', unit: 'count', better: 'lower' }, 'RB ref.conf. nERR': { name: 'Rigid-body reference configuration errors', unit: 'count', better: 'lower' }, 'vel. nERR': { name: 'Velocity errors', unit: 'count', better: 'lower' }, 'inertia/mass nERRs': { name: 'Inertia and mass errors', unit: 'count', better: 'lower' }, 'gravity/load nERR': { name: 'Gravity and load errors', unit: 'count', better: 'lower' }, 'connect./constr. nERR': { name: 'Connection and constraint errors', unit: 'count', better: 'lower' }, 'other nERR': { name: 'Other errors', unit: 'count', better: 'lower' }, 'graphs timeout': { name: 'Graph timeout rate', unit: 'score', better: 'lower' }, 'ctx window exceeded': { name: 'Context window exceeded rate', unit: 'score', better: 'lower' }, 'ctx exceeded tok. (max)': { name: 'Maximum context overflow tokens', unit: 'count', better: 'lower' }, 'LLM ctxSize (k)': { name: 'LLM context size', unit: 'thousands' }, 'ctx size used (P95)': { name: '95th percentile context used', unit: 'thousands' }, 'ctx size used (max)': { name: 'Maximum context used', unit: 'thousands' }, 'prompt tokens (mean)': { name: 'Mean prompt tokens', unit: 'tokens' }, 'api cost (EUR)': { name: 'API cost', unit: 'usd', better: 'lower', note: 'Source reports this value in euros.' }, 'api budget rem. (EUR)': { name: 'Remaining API budget', unit: 'usd', note: 'Source reports this value in euros.' }, 'VRAM (GB)': { name: 'VRAM', unit: 'gb' },
  },
  async fetch() {
    const table = (await loadWorkbook(feed)).sheets.get('overallResults');
    const start = table?.findIndex(c => c.includes('Case Name')) ?? -1;
    if (!table || start < 0) throw new Error('Missing results sheet');
    const header = table[start];
    const required = ['Case Name','overall success','nTasks','eval date','LLM full name','thinking','pipeline','temperature','batch','nTokGen (k)','api cost (EUR)','choose items','graph content match'];
    if (!required.every(k => header.includes(k))) throw new Error('Missing run columns');
    const rows = table.slice(start+1).filter(r => /^\d+$/.test(r[0])).map(r => {
      const get = (key:string) => r[header.indexOf(key)];
      const model = get('LLM full name');
      const tasks = Number(get('nTasks'));
      if (!model || !get('overall success') || !Number.isFinite(Number(get('overall success'))) || !(tasks > 0)) throw new Error('Invalid results row');
      const metrics:Record<string,number> = {};
      header.forEach((key,i) => {
        if (key && r[i] && Number.isFinite(Number(r[i])) && !['eval date','eval time','temperature','default temperature','batch','top_p','top_k','solver Sample timeout','solver LLM timeout'].includes(key)) metrics[key] = Number(r[i]);
      });
      return { model, setting:get('Case Name') + ' / thinking ' + get('thinking'), harness:get('pipeline'),
        date:new Date((Number(get('eval date'))-25569)*86400000).toISOString().slice(0,10),score:100*Number(get('overall success')),
        tokens:1000*Number(get('nTokGen (k)'))/tasks,metrics };
    });
    if(rows.length < 34) throw new Error('Incomplete engineering results');
    return rows;
  },
};
export default board;
