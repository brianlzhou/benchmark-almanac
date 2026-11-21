// Country211 tests image geolocation across 211 countries. The OpenCLIP benchmark publishes
// zero-shot accuracy per checkpoint. Read its Country211 column and convert it to percent.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://raw.githubusercontent.com/mlfoundations/open_clip/main/docs/openclip_results.csv';
export default {
  benchmark:'country211',url:'https://github.com/mlfoundations/open_clip/blob/main/docs/openclip_results.csv',feed,host:'OpenCLIP',
  terms:'OpenCLIP license, https://github.com/mlfoundations/open_clip/blob/main/LICENSE',
  stats:{billionFlops:{name:'FLOPs',unit:'billions',note:'Floating-point operations per image inference, stored in billions.'}},
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    if (!records[0] || !['name','pretrained','Country211','params (M)','FLOPs (B)'].every(k => k in records[0])) throw new Error('Missing OpenCLIP columns');
    return checked(records.filter(r => r.Country211.trim() !== '').map(r => {
      const fraction = Number(r.Country211);
      if (!r.name || !r.pretrained || !Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new Error('Invalid Country211 result');
      return { model:r.name+' ('+r.pretrained+')',setting:'Zero-shot',score:100*fraction,
        params:r['params (M)'] ? Number(r['params (M)'])/1000 : undefined,
        metrics:r['FLOPs (B)'] ? {billionFlops:Number(r['FLOPs (B)'])} : undefined };
    }),121);
  },
} satisfies Leaderboard;
