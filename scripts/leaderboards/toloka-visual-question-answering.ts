// Toloka reran the submitted models on its private test set for the final WSDM Cup ranking. The competition overview embeds the reproduction-phase IoU percentages.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://codalab.lisn.upsaclay.fr/competitions/7434#results";


const board: Leaderboard = {
  benchmark: "toloka-visual-question-answering",
  url: "https://codalab.lisn.upsaclay.fr/competitions/7434#results",
  feed,
  terms: "The dataset card names the competition board. CodaLab embeds the final scores in the public competition overview. Its robots.txt route returns HTML.",
  async fetch(){
    const page=await fetchText(feed);
    const section=page.split(/const content = '/).find(s=>s.includes('Reproduction phase are ready'));
    if(!section) throw new Error('Missing organizer results');
    const html=section.split("';")[0].replace(/\\u([\da-f]{4})/gi,(_,n)=>String.fromCharCode(parseInt(n,16)));
    const table=tables(html).find(t=>t[0].some(c=>c.text.includes('CodaLab usernames')));
    if(!table || !table[0].some(c=>c.text.includes('IOU')) || table.length<10) throw new Error('Missing reproduction table');
    return table.slice(1).map(r=>{
      const model=r[1].text.trim(),score=Number(r[2].text.trim());
      if(!model || !Number.isFinite(score)) throw new Error('Invalid final IoU');
      return {model,submitter:model,score,setting:'Reproduction (private test)'};
    });
  },
};
export default board;
