// EmailBench evaluates agents on 206 simulated email and productivity scenarios.
// Table 3 gives the full-suite pass rate. Tables 16, 33 and 38 identify runs and break down the scores.
// The 95% Wilson intervals use the scenario-sampling formula and z value from Appendix C.2.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.31906';
const board: Leaderboard = {
  benchmark:'emailbench', url:feed, feed, static:'paper',
  terms:'The authors publish the results under the terms at https://arxiv.org/abs/2609.31906.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    function table(header: string) {
      const t = tables.find(t => t[0]?.join('|') === header);
      if (!t) throw new Error('Missing EmailBench table: ' + header);
      return t.slice(1);
    }
    const main = table('Configuration|Pass|Full|Ret.|Rem.|Static|LLM|Calls|Call ok|Clean|Latency');
    const dates = table('Configuration label|Internal endpoint ID|Run ID|Start time (UTC)');
    const columns = 'Son.|Opus|5.4-R|5.5-R|5.4|5.2|o3|GPT-5';
    const categories = table('Category|' + columns);
    const levels = table('Level|n|' + columns);
    const names = ['Sonnet 4.5','Opus 4.1','GPT-5.4-R','GPT-5.5-R','GPT-5.4','GPT-5.2','o3','GPT-5'];
    board.parts = Object.fromEntries([...categories, ...levels].map(([part]) => [part, part]));
    const rows = main.map(([label, pass, full, retained, remainder, stat, llm, calls, ok, clean, latency]) => {
      const i = names.indexOf(label);
      const model = label.replace(/^(Sonnet|Opus)/,'Claude $1').replace(/-R$/,'');
      const config = model + (label.endsWith('-R') ? '-reasoning' : '');
      const date = dates.find(row => row[0] === config)?.[3].slice(0,10);
      if (i < 0 || !date || !/^\d+\/206$/.test(pass)) throw new Error('Unknown EmailBench run ' + label);
      const count = parseInt(pass,10), n = 206, p = count/n, z = 1.959964;
      const denom = 1 + z*z/n;
      const center = (p + z*z/(2*n))/denom;
      const delta = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n))/denom;
      const metrics = {passed:count, retained:Number(retained), remainder:Number(remainder), staticScore:Number(stat),
        llmScore:Number(llm), calls:Number(calls), callSuccess:Number(ok), clean:Number(clean), latency:Number(latency),
        ...Object.fromEntries(categories.map(r => [r[0],Number(r[i+1])])),
        ...Object.fromEntries(levels.map(r => [r[0],Number(r[i+2])]))};
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid EmailBench metric');
      return {model, setting:label.endsWith('-R') ? 'Reasoning' : undefined, date, score:Number(full),
        trials:1, low:100*(center-delta), high:100*(center+delta), metrics};
    });
    return checked(rows,8);
  },
};
export default board;
