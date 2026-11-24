// StereoTales tests which demographic associations recur in generated stories.
// Giskard's model chart counts distinct associations judged harmful across the dataset. Lower counts are better.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://research.giskard.ai/blog/stereotales/';
const board: Leaderboard = {
  benchmark:'stereotales', url:feed,feed,
  terms:'The study links the dataset license at https://huggingface.co/datasets/giskardai/StereoTales.',
  // the study lists the model as Mistral Small 2603, the March 2026 release: Mistral Small 4
  aliases: { "Mistral Small": "mistral-small-4" },
  headline:'The chart counts distinct harmful associations for each model. A lower count is better.',
  stats:{benign:{name:'Benign associations',unit:'count'},total:{name:'Total associations',unit:'count'}},
  async fetch() {
    const page = await fetchText(feed);
    const path = page.match(/component-url="([^"]*\/ModelAssociationsChart\.[^"]+\.js)"/)?.[1];
    if (!path) throw new Error('Missing association chart module');
    await new Promise(resolve => setTimeout(resolve,1000));
    const js = await fetchText(new URL(path,feed).href);
    const rows = [...js.matchAll(/model_short:"([^"]+)",n_benign:(\d+),n_harmful:(\d+),n_total:(\d+)/g)].map(([,model,b,h,t]) => {
      if (Number(b)+Number(h)!==Number(t)) throw new Error('Invalid association counts');
      return {model,score:Number(h),metrics:{benign:Number(b),total:Number(t)}};
    });
    return checked(rows,23);
  },
};
export default board;
