// KoCommonGEN v2 measures Korean commonsense generation accuracy. This importer reads the official Hugging Face README table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
const PAGE='https://huggingface.co/datasets/nlpai-lab/ko_commongen_v2';
const FEED='https://huggingface.co/datasets/nlpai-lab/ko_commongen_v2/raw/main/README.md';
const board:Leaderboard={benchmark:'kocommongen-v2',url:PAGE,feed:FEED,terms:'The dataset README is published under the dataset repository terms.',async fetch(){const s=await fetchText(FEED);const rows:LeaderboardRow[]=[];for(const line of s.split('\n')){const m=line.match(/^\|\s*\*?\*?([^|]+?)\*?\*?\s*\|\s*[^|]+\|\s*([0-9.]+)\s*\|/);if(m&&m[1].trim()!=='Model'&&m[1].trim()!=='Human')rows.push({model:m[1].trim(),score:Number(m[2])*100});}if(rows.length<10)throw new Error('KoCommonGEN README results table missing');return rows;}};export default board;
