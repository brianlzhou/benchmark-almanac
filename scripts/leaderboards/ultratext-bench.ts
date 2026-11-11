// UltraText Bench reported composite ratings on a 0–100 score scale.
// The bilingual composite is the score. Language/difficulty slices and dimensions are metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/LINs-lab/UltraText_Bench/main/data/leaderboard.json";
const board: Leaderboard = {
 benchmark: "ultratext-bench", url: "https://github.com/LINs-lab/UltraText_Bench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'FLUX.1 [Dev]':'flux-1-dev','SD3.5 Large':'stable-diffusion-3-5-large'},
 async fetch() {
const d=await fetchJson<{models:{model:string;composite:number;text_fidelity:number;text_clarity:number;spatial_quality:number;scene_quality:number;levels:Record<string,Record<string,number>>}[]}>(FEED);const rows:LeaderboardRow[]=[];
for(const r of d.models){const quality=r.model.match(/\[(Low|High)\]/i)?.[1];const model=r.model.replace(/\s*\[(Low|High)\]/i,'');
const metrics:Record<string,number>={fidelity:r.text_fidelity,clarity:r.text_clarity,spatial:r.spatial_quality,scene:r.scene_quality};
for(const [level,langs]of Object.entries(r.levels))for(const [language,value]of Object.entries(langs))if(Number.isFinite(value))metrics[`${level}_${language.toLowerCase()}`]=value;
rows.push({model,score:r.composite,setting:quality?'API quality '+quality:undefined,metrics});
}return rows;
 },
};
export default board;
