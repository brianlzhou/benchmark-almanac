// EmailBench evaluates agents on 206 simulated email and productivity scenarios.
// Table 3 gives the full-suite pass rate. Tables 16, 33 and 38 identify runs and break down the scores.
// The 95% Wilson intervals use the scenario-sampling formula and z value from Appendix C.2.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.31906';
const CATEGORIES = [
  'filters', 'folders', 'settings', 'messages-write', 'contacts', 'messages-read',
  'calendar-read', 'inbox-cleanup', 'todo', 'calendar-triage', 'meeting-prep',
  'multi-domain', 'calendar-write', 'cross-domain', 'orchestration', 'boards',
];
const LEVELS = ['D1', 'D2', 'D3'];
const board: Leaderboard = {
  benchmark:'emailbench', url:feed, feed, static:'paper',
  terms:'The authors publish the results under the terms at https://arxiv.org/abs/2609.31906.',
  parts: Object.fromEntries([...CATEGORIES, ...LEVELS].map(part => [part, part])),
  stats: {
    passed: { name: 'Scenarios passed', unit: 'count', better: 'higher', note: 'Count passed out of 206 scenarios.' },
    retained: { name: 'Retained subset pass rate', unit: '%', better: 'higher', note: 'Pass rate on the 152-scenario retained subset.' },
    remainder: { name: 'Removed slice pass rate', unit: '%', better: 'higher', note: 'Pass rate on the 54-scenario removed slice.' },
    staticScore: { name: 'Static assertion score', unit: 'score', better: 'higher', note: 'Mean over 163 scenarios with static checks, from 0 to 1.' },
    llmScore: { name: 'LLM judge score', unit: 'score', better: 'higher', note: 'Mean over all 206 scenarios, from 0 to 1.' },
    calls: { name: 'Mean tool calls per scenario', unit: 'count' },
    callSuccess: { name: 'Tool call success rate', unit: '%', better: 'higher' },
    clean: { name: 'Clean execution rate', unit: '%', better: 'higher', note: 'Share of 206 scenarios with at least one call and no API failure.' },
    latency: { name: 'Mean latency per scenario', unit: 'seconds', better: 'lower' },
  },
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
