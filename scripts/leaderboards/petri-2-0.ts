// Petri scores alignment behavior across 181 seeds. The main chart starts with Misaligned Behavior.
// Read the vector bars and their 95% intervals against each subplot's own axis. We verified
// the headline independently against the separately rendered main chart and guard the appendix SVG by hash.
import type { Leaderboard, BoardPart } from './types.ts';
import { createHash } from 'node:crypto';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://alignment.anthropic.com/2026/petri-v2/';
const feed = url+'figures/petri_behavior_audit_scores.svg';
const primary = 'Misaligned Behavior';
const board: Leaderboard = {
  benchmark:'petri-2-0',url,feed,static:'paper',
  terms:'Anthropic publishes the figure at '+url+' under its site terms.',
  headline:'The headline is Misaligned Behavior, the first dimension in the main chart, scaled from 0 to 1 into percent.',
  async fetch() {
    const svg = await fetchText(feed);
    if (createHash('sha256').update(svg).digest('hex')!=='5b0abb9658738bebb3e9f349ca535da2fe3602e666f2a922d0705bc6f6334efd')
      throw new Error('Petri appendix chart changed');
    const panels = svg.split(/<g id="axes_\d+">/).slice(1);
    const models = [...panels[0].matchAll(/<g id="ytick_\d+">[\s\S]*?<!-- ([^<>]+) -->/g)].map(m=>m[1]);
    if (models.length!==10 || panels.length!==34) throw new Error('Unexpected Petri dimensions');
    const rows = models.map(model=>({model,score:NaN,low:NaN,high:NaN,trials:362,metrics:{} as Record<string,number>}));
    const parts: Record<string,BoardPart> = {};
    for (const panel of panels) {
      const name = panel.match(/^    <!-- ([^<>]+) -->/m)?.[1];
      const ticks = [...panel.matchAll(/<g id="xtick_\d+">[\s\S]*?<use [^>]+ x="([\d.]+)"[^>]*>[\s\S]*?<!-- ([\d.]+) -->/g)];
      const bars = [...panel.matchAll(/<path d="M ([\d.]+) [\d.]+\s+L ([\d.]+) [\d.]+[^"]+" clip-path="[^"]+" style="fill: #/g)];
      const errorBars = panel.match(/<g id="LineCollection_\d+">([\s\S]*?)<\/g>/)?.[1] ?? '';
      const intervals = [...errorBars.matchAll(/<path d="M ([\d.]+) [\d.]+\s+L ([\d.]+) /g)];
      if (!name || ticks.length<2 || bars.length!==10 || intervals.length!==10) throw new Error('Incomplete Petri subplot');
      const [a,b] = ticks;
      const percent = (x:string) => Number((100*(Number(a[2])+(Number(x)-Number(a[1]))*
        (Number(b[2])-Number(a[2]))/(Number(b[1])-Number(a[1])))).toFixed(3));
      parts[name] = {name,unit:'%',better:name==='Admirable'?'higher':'lower'};
      rows.forEach((row,i)=>{
        const value = percent(bars[i][2]);
        row.metrics[name] = value;
        if (name===primary) Object.assign(row,{score:value,low:percent(intervals[i][1]),high:percent(intervals[i][2])});
      });
    }
    board.parts=parts;
    return checked(rows,10);
  },
};
export default board;
