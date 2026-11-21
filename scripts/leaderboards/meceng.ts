// MecEng reports overall success on its published rigid-body run. The authors rank configurations in the overallResults workbook.
import type { Leaderboard } from './types.ts';
import { loadWorkbook } from './agentclue.ts';

const feed = "https://raw.githubusercontent.com/jgerstmayr/MecEng/main/misc/paperTableData/overallResults50models_2026-06-25_mergedLLMs.xlsx";


const board: Leaderboard = {
  benchmark: "meceng",
  url: "https://github.com/jgerstmayr/MecEng/blob/main/misc/paperTableData/overallResults50models_2026-06-25_mergedLLMs.xlsx",
  feed,
  terms: "The repository uses BSD 3-Clause. https://github.com/jgerstmayr/MecEng/blob/main/LICENSE The raw file host serves no robots.txt rules.",
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
        if (key && r[i] && Number.isFinite(Number(r[i])) && !['eval date','eval time'].includes(key)) metrics[key] = Number(r[i]);
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
