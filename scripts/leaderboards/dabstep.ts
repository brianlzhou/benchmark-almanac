// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// DABstep tests data agents on multi-step payment questions. The Validated tab reports Easy and Hard accuracy.
// Read the Gradio dataframe belonging to that tab. Both columns are already percentages.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const feed = 'https://adyen-dabstep.hf.space/config';
interface Layout {id:number; children?:Layout[]}
interface Component {id:number;type:string;props:{label?:string;value?:{headers:string[];data:unknown[][]}}}
function locate(node:Layout, id:number): Layout | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = locate(child,id);
    if (found) return found;
  }
}
const board: Leaderboard = {
  benchmark:'dabstep',url:'https://huggingface.co/spaces/adyen/DABstep',feed,
  terms:'Adyen and Hugging Face license DABstep under CC BY 4.0, https://creativecommons.org/licenses/by/4.0/.',
  aliases:{'GPT 40-mini':'gpt-4o-mini'},
  parts:{easy:'Easy',hard:'Hard'}, verified:'Validated by the DABstep organizers', harnesses:'system',
  async fetch() {
    const config = await fetchJson<{layout:Layout,components:Component[]}>(feed);
    const tab = config.components.find(c=>c.type==='tabitem' && c.props.label==='Validated');
    const children = tab && locate(config.layout,tab.id)?.children;
    const table = config.components.find(c=>children?.some(child=>child.id===c.id) && c.type==='dataframe')?.props.value;
    if (table?.headers.join('|') !== 'Agent|Easy Level Accuracy (%)|Hard Level Accuracy (%)|Organization|Repo URL|Model Family|Date') throw new Error('Missing validated DABstep dataframe');
    const rows = [];
    for (const [agent,easy,hard,org,url,family,day] of table.data) {
      if (easy === null || hard === null) continue;
      if (typeof easy !== 'number' || typeof hard !== 'number' || typeof family !== 'string' || !family.trim() || typeof agent !== 'string') throw new Error('Invalid validated entry');
      const harness = agent.replace(/\*\*/g,'').trim();
      const model = family.trim().replace(/^\[([^\]]+)\]\([^)]+\)$/,'$1');
      const link = String(url).match(/^\[Link\]\((https?:\/\/[^)]+)\)$/)?.[1];
      const date = String(day).match(/^(\d{2})-(\d{2})-(\d{4})$/);
      rows.push({model,harness,submitter:String(org).trim(),verified:true,link,date:date ? [date[3],date[2],date[1]].join('-') : undefined,
        score:(easy+hard)/2,metrics:{easy,hard}});
    }
    return checked(rows,28);
  },
};
export default board;
