// TheoremQA: the Science Leaderboard source CSV, using the TheoremQA percentage rather than the
// multibenchmark average. The Space documents 5-shot chain-of-thought evaluation. Preserve base-model
// labels so they cannot be confused with instruction-tuned variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://huggingface.co/datasets/wenhu/science_leaderboard_submission/resolve/main/results.csv";
const board: Leaderboard = {
 benchmark: "theoremqa", url: "https://huggingface.co/spaces/TIGER-Lab/Science-Leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'GPT-4-turbo-0409':'gpt-4-turbo-apr-2024'},
 async fetch() {

const data=parseCsv(await fetchText(FEED));if(!data[0]||!('TheoremQA'in data[0]))throw new Error('TheoremQA column missing');const rows:LeaderboardRow[]=[];
for(const r of data){const cell=r['Model (CoT)']?.trim()??'';const m=cell.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);const model=m?m[1]:cell;const link=m?m[2]:undefined;const score=num(r.TheoremQA);if(model&&score!==undefined)rows.push({model,score,link,setting:'5-shot CoT'});}
return rows;
 },
};
export default board;
