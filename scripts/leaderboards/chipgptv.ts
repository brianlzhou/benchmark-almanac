// ChipGPTV tests Verilog generation from diagrams and text. Table 3 reports the whole-benchmark
// functional testbench pass rate of the best of five candidates. Table 5 varies prompt detail.
// The complex prompts duplicate the combined-input rows from Table 3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2407.08473';
const chipParts = {
  'Logic: Johnson_Counter': {name: 'Johnson Counter', group: 'Logic benchmark', unit: '%'},
  'Logic: alu': {name: 'ALU', group: 'Logic benchmark', unit: '%'},
  'Logic: edge_detect': {name: 'Edge detect', group: 'Logic benchmark', unit: '%'},
  'Logic: freq_div': {name: 'Frequency divider', group: 'Logic benchmark', unit: '%'},
  'Logic: mux': {name: 'Multiplexer', group: 'Logic benchmark', unit: '%'},
  'Logic: parallel2serial': {name: 'Parallel to serial', group: 'Logic benchmark', unit: '%'},
  'Logic: pulse_detect': {name: 'Pulse detect', group: 'Logic benchmark', unit: '%'},
  'Logic: right_shifter': {name: 'Right shifter', group: 'Logic benchmark', unit: '%'},
  'Logic: serial2parallel': {name: 'Serial to parallel', group: 'Logic benchmark', unit: '%'},
  'Logic: width_8to16': {name: '8 to 16 bit width converter', group: 'Logic benchmark', unit: '%'},
  'Arithmetic: accu': {name: 'Accumulator', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: adder_16bit': {name: '16 bit adder', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: add_16bit_csa': {name: '16 bit carry-save adder', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: adder_8bit': {name: '8 bit adder', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: multi_booth': {name: 'Booth multiplier', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: multi_pipe_4bit': {name: '4 bit pipelined multiplier', group: 'Arithmetic benchmark', unit: '%'},
  'Arithmetic: multipipe_8bit': {name: '8 bit pipelined multiplier', group: 'Arithmetic benchmark', unit: '%'},
  'Advanced: 1x2nocpe': {name: '1x2 NOC PE', group: 'Advanced benchmark', unit: '%'},
  'Advanced: 1x4systolic': {name: '1x4 systolic', group: 'Advanced benchmark', unit: '%'},
  'Advanced: 2x2systolic': {name: '2x2 systolic', group: 'Advanced benchmark', unit: '%'},
  'Advanced: fsm': {name: 'FSM', group: 'Advanced benchmark', unit: '%'},
  'Advanced: macpe': {name: 'MAC PE', group: 'Advanced benchmark', unit: '%'},
  'Advanced: statemachine': {name: 'State machine', group: 'Advanced benchmark', unit: '%'},
  'Advanced: 5state_fsm': {name: '5 state FSM', group: 'Advanced benchmark', unit: '%'},
  'Advanced: 3state_fsm': {name: '3 state FSM', group: 'Advanced benchmark', unit: '%'},
  'Advanced: 4state_fsm': {name: '4 state FSM', group: 'Advanced benchmark', unit: '%'},
} as const;
function percent(s:string) {
  if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid ChipGPTV percentage: '+s);
  return parseFloat(s);
}
const board: Leaderboard = {
  benchmark:'chipgptv', static:'paper', url, feed:url,
  terms:'The authors publish these tables under the license at https://arxiv.org/abs/2407.08473.',
  parts:{syntax:'Syntax success rate', ...chipParts},
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const labels = ['GPT4-V (V+T)','GPT4 (T)','GPT4-V (V)','LLaVa (V+T)','Llama (T)','LLaVa(V)'];
    const main = tables.find(t => t[0]?.join('|') === ['benchmark','benchmark',...labels.flatMap(s=>[s,s])].join('|'));
    const prompts = tables.find(t => t[0]?.join('|') === 'Benchmark (function)|Benchmark (function)|LLaVa|LLaVa|LLaVa|GPT4-V|GPT4-V|GPT4-V');
    if (!main || !prompts || main[1].slice(2).join('|') !== Array(6).fill('syntax|function').join('|') ||
        prompts[1].slice(2).join('|') !== 'S|M|C|S|M|C') throw new Error('Missing Tables 3 or 5');
    const totals = main.at(-1)!, promptTotals = prompts.at(-1)!;
    if (totals[0] !== 'Success Rate' || promptTotals[0] !== 'Success Rate') throw new Error('Missing success rates');
    const rows: LeaderboardRow[] = labels.map((label,i) => {
      const model = label.split('(')[0].trim();
      const setting = label.includes('V+T') ? 'Vision and text, complex prompt' : label.includes('(T)') ? 'Text only' : 'Vision only';
      const metrics: Record<string,number> = {syntax:percent(totals[2+i*2])};
      for (const c of main.slice(2,-1)) metrics[c[0]+': '+c[1]] = percent(c[3+i*2]);
      return {model,setting,score:percent(totals[3+i*2]),metrics,trials:5};
    });
    for (const [i,model] of ['LLaVa','GPT4-V'].entries()) {
      for (const [j,detail] of ['simple','medium'].entries()) {
        const column = 2+i*3+j;
        const metrics = Object.fromEntries(prompts.slice(2,-1).map(c => [c[0]+': '+c[1],percent(c[column])]));
        rows.push({model,setting:'Vision and text, '+detail+' prompt',score:percent(promptTotals[column]),metrics,trials:5});
      }
    }
    board.parts = {syntax:'Syntax success rate',...Object.fromEntries(main.slice(2,-1).map(c => [c[0]+': '+c[1],{name:c[1],group:c[0]}]))};
    return checked(rows,10);
  },
};
export default board;
