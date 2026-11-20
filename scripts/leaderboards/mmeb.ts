// MMEB image leaderboard. Image-Overall is the percentage aggregate; embedding model identities and all category metrics remain intact.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard/resolve/main/rankings/image_ranking.csv";
const board: Leaderboard = {
 benchmark: "mmeb",
 parts: {
   VOC2007: { name: 'VOC2007', group: 'Category' },
   N24News: { name: 'N24News', group: 'Category' },
   SUN397: { name: 'SUN397', group: 'Category' },
   ObjectNet: { name: 'ObjectNet', group: 'Category' },
   Place365: { name: 'Place365', group: 'Category' },
   'ImageNet-1K': { name: 'ImageNet-1K', group: 'Category' },
   HatefulMemes: { name: 'HatefulMemes', group: 'Category' },
   'ImageNet-A': { name: 'ImageNet-A', group: 'Category' },
   'ImageNet-R': { name: 'ImageNet-R', group: 'Category' },
   'OK-VQA': { name: 'OK-VQA', group: 'Category' },
   'A-OKVQA': { name: 'A-OKVQA', group: 'Category' },
   DocVQA: { name: 'DocVQA', group: 'Category' },
   InfographicsVQA: { name: 'InfographicsVQA', group: 'Category' },
   ChartQA: { name: 'ChartQA', group: 'Category' },
   Visual7W: { name: 'Visual7W', group: 'Category' },
   ScienceQA: { name: 'ScienceQA', group: 'Category' },
   GQA: { name: 'GQA', group: 'Category' },
   TextVQA: { name: 'TextVQA', group: 'Category' },
   VizWiz: { name: 'VizWiz', group: 'Category' },
   VisDial: { name: 'VisDial', group: 'Category' },
   NIGHTS: { name: 'NIGHTS', group: 'Category' },
   WebQA: { name: 'WebQA', group: 'Category' },
   FashionIQ: { name: 'FashionIQ', group: 'Category' },
   'Wiki-SS-NQ': { name: 'Wiki-SS-NQ', group: 'Category' },
   OVEN: { name: 'OVEN', group: 'Category' },
   EDIS: { name: 'EDIS', group: 'Category' },
   MSCOCO: { name: 'MSCOCO', group: 'Category' },
   RefCOCO: { name: 'RefCOCO', group: 'Category' },
   'RefCOCO-Matching': { name: 'RefCOCO-Matching', group: 'Category' },
   'Visual7W-Pointing': { name: 'Visual7W-Pointing', group: 'Category' },
   'I-CLS': { name: 'Image classification', group: 'Task type' },
   'I-QA': { name: 'Image QA', group: 'Task type' },
   'I-RET': { name: 'Image retrieval', group: 'Task type' },
   'I-VG': { name: 'Image visual grounding', group: 'Task type' },
   VisualNews_t2i: { name: 'VisualNews text to image', group: 'Category' },
   VisualNews_i2t: { name: 'VisualNews image to text', group: 'Category' },
   MSCOCO_t2i: { name: 'MSCOCO text to image', group: 'Category' },
   MSCOCO_i2t: { name: 'MSCOCO image to text', group: 'Category' },
 },
 url: "https://huggingface.co/spaces/TIGER-Lab/MMEB-Leaderboard",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return parseCsv(await fetchText(FEED)).filter(r=>r.Models&&num(r['Image-Overall'])!==undefined).map(r=>({model:text(r.Models),score:num(r['Image-Overall'])!,date:r.Date,metrics:Object.fromEntries(Object.entries(r).filter(([k])=>!['Rank','Date','Models','Image-Overall'].includes(k)).map(([k,v])=>[k,num(v)]).filter((p):p is [string,number]=>typeof p[1]==='number'))}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
