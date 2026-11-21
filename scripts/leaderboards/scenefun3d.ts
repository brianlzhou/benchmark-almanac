// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// SceneFun3D's test leaderboard covers functionality segmentation and task-driven affordance grounding.
// AP at 50% overlap is the first metric common to both. Tables 2 and 3 supply the original LERF test-set baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://scenefun3d.github.io/benchmark';
const feed = 'https://teal-heliotrope-3b9297.netlify.app/.netlify/functions/leaderboard';
const pdf = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Delitzas_SceneFun3D_Fine-Grained_Functionality_and_Affordance_Understanding_in_3D_Scenes_CVPR_2024_paper.pdf';
const groups = ['Functionality Segmentation','Task-Driven Affordance Grounding'];
const headers = [['AP','AP_50','AP_25'],['AP_50','AP_25']];
type Entry = { submission__method_name:string; submission__participant_team__team_name:string;
  leaderboard__schema:{labels:string[]}; result:number[] };
const board: Leaderboard = {
  benchmark: 'scenefun3d', url, feed, static: 'paper',
  terms: 'The makers publish their leaderboard at https://scenefun3d.github.io/benchmark and the CVPR paper at https://openaccess.thecvf.com/.',
  headline: 'The leaderboard has no overall score, so this is the plain mean of AP at 50% overlap on its two test tasks.',
  parts: Object.fromEntries(groups.flatMap((group,i) => headers[i].map(name => ['t'+i+name,{name,group,unit:'%'}]))),
  async fetch() {
    const rows = new Map<string,LeaderboardRow>();
    const site = await fetchText(url);
    const paper = await pdfText(pdf);
    for (const i of [0,1]) {
      const json = await fetchJson<{results:Entry[];next:string|null}>(feed + (i ? '2' : ''));
      if (json.next) throw new Error('Leaderboard now paginates');
      function add(model:string,submitter:string,values:number[]) {
        const key = submitter + '|' + model;
        const row = rows.get(key) ?? {model,submitter,score:NaN,metrics:{}};
        if (values.length !== headers[i].length || !values.every(Number.isFinite)) throw new Error('Invalid AP for '+model);
        for (const [c,name] of headers[i].entries()) row.metrics!['t'+i+name] = values[c];
        rows.set(key,row);
      }
      for (const r of json.results) {
        if (r.leaderboard__schema.labels.join() !== headers[i].join()) throw new Error('AP headers changed');
        const team = r.submission__participant_team__team_name;
        let model = r.submission__method_name.trim();
        if (team === 'pico-mr' && /"pico-mr"\s*:\s*\{[^}]*title:\s*"OpenTrack3D:/.test(site)) model = 'OpenTrack3D';
        if (!model || /^\d+$|^Entry \d+$/i.test(model)) continue;
        add(model,team,r.result);
      }
      const match = i === 0 ? paper.match(/LERF \[\d+\]\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\n/) :
        paper.match(/LERF \[\d+\][ \t]+([\d.]+)[ \t]+([\d.]+)[ \t]*\n/);
      if (!match) throw new Error('Missing LERF paper baseline');
      add('LERF','SceneFun3D',match.slice(1).map(Number));
    }
    const complete = [...rows.values()].filter(r => ['t0AP_50','t1AP_50'].every(k => k in r.metrics!));
    for (const row of complete) row.score = (row.metrics!.t0AP_50 + row.metrics!.t1AP_50) / 2;
    return checked(complete,2);
  },
};
export default board;
