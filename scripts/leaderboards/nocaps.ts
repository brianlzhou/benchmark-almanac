// nocaps tests image captioning on novel objects. The organizers' EvalAI test leaderboard
// ranks submissions by CIDEr across the entire dataset. Domain scores are joined on submission ID.
// Team names and checkpoint filenames alone do not establish a model identity.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const root = 'https://eval.ai/api/jobs/challenge_phase_split/';
const endpoint = (split:number) => root+split+'/leaderboard/?page_size=1000';
const labels = ['B1','B2','B3','B4','ROUGE-L','METEOR','CIDEr','SPICE'];
const splits = [[1011,'Entire dataset'],[1008,'In-domain'],[1009,'Near-domain'],[1010,'Out-of-domain']] as const;
const parts: Record<string,BoardPart> = {};
for (const [,group] of splits) for (const name of labels) parts[group+' '+name] = {name,group,unit:'score'};
interface Entry {
  submission__id:number; submission__participant_team__team_name:string; submission__method_name:string;
  submission__submitted_at:string; submission__is_verified_by_host:boolean; result:number[];
  leaderboard__schema:{labels:string[];default_order_by:string};
}
const namedTeams: Record<string,string> = {'PaLI - Google Research':'PaLI','CoCa - Google Brain':'CoCa','Prismer - Nvidia':'Prismer',
  'SimVLM - Google Brain':'SimVLM','VinVL (Microsoft Cognitive Services + MSR)':'VinVL'};
function identity(team:string,method:string) {
  if (namedTeams[team]) return {model:namedTeams[team],setting:method || undefined};
  if (/^GIT2?, Single Model$/.test(method)) return {model:method.split(',')[0],setting:'Single Model'};
  if (/^(EVCap|Oscar|RCAL|UpDown|Neural Baby Talk)(?: \+.*)?$/.test(method)) {
    const [model,...extra]=method.split(' + ');
    return {model,setting:extra.join(' + ') || undefined};
  }
  if (/^phi 1\.5 /.test(method)) return {model:method};
  if (method.startsWith('ViTCAP-')) return {model:'ViTCAP',setting:method.slice(7)};
  if (method === 'vinvl_yuan_cbs') return {model:'VinVL',setting:method};
  if (method === 'camel XE') return {model:'camel',setting:'XE'};
  if (method.startsWith('IVLT-')) return {model:'IVLT',setting:method.slice(5)};
}
const board: Leaderboard = {
  benchmark:'nocaps',url:'https://nocaps.org/leaderboard',feed:endpoint(1011),parts,
  terms:'The organizers publish submissions through the public EvalAI API. https://eval.ai/terms-and-conditions',
  verified:'Verified by the EvalAI challenge host.',
  async fetch() {
    const rows = new Map<number,LeaderboardRow>();
    let requests=0;
    for (const [split,group] of splits) {
      let next:string|null=endpoint(split);
      const visited=new Set<string>();
      let read=0;
      while (next) {
        if (visited.has(next) || !next.startsWith(root+split+'/leaderboard/?')) throw new Error('Invalid nocaps pagination');
        visited.add(next);
        if (requests++) await new Promise(resolve => setTimeout(resolve,1050));
        const page:{count:number;next:string|null;results:Entry[]} = await fetchJson(next);
        read+=page.results.length;
        for (const entry of page.results) {
          if (entry.leaderboard__schema.labels.join('|') !== labels.join('|') || entry.leaderboard__schema.default_order_by !== 'CIDEr' ||
            entry.result.length !== labels.length || !entry.result.every(Number.isFinite)) throw new Error('Invalid nocaps metrics');
          const id=entry.submission__id;
          if (split === 1011) {
            const team=entry.submission__participant_team__team_name;
            const named=identity(team,entry.submission__method_name || '');
            if (!named) continue;
            rows.set(id,{...named,submitter:team,score:entry.result[6],date:entry.submission__submitted_at.slice(0,10),
              verified:entry.submission__is_verified_by_host,metrics:{}});
          }
          const row=rows.get(id);
          if (row) labels.forEach((name,i) => row.metrics![group+' '+name]=entry.result[i]);
        }
        next=page.next;
        if (!next && read !== page.count) throw new Error('Incomplete nocaps leaderboard');
      }
    }
    return checked([...rows.values()],21);
  },
};
export default board;
