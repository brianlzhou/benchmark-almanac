// MermaidSeqBench tests generation of Mermaid sequence diagrams. IBM's leaderboard
// defines Overall Avg as the mean of two judge averages, each across six criteria.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://huggingface.co/datasets/ibm-research/MermaidSeqBench';
const feed = url+'/raw/main/README.md';
const board: Leaderboard = {
  benchmark:'mermaidseqbench',url,feed,terms:'IBM releases this dataset under Apache 2.0 at '+url+'.',
  stats:{ deepseek:{name:'DeepSeek-V3 Avg',unit:'score',better:'higher'}, gptOss:{name:'GPT-OSS Avg',unit:'score',better:'higher'} },
  async fetch() {
    const section = (await fetchText(feed)).split('### Overall Ranking')[1];
    const lines = section?.match(/^\|.*\|$/gm);
    const cells = (line:string) => line.split('|').slice(1,-1).map(c=>c.trim());
    if (!lines || cells(lines[0]).join('|') !== 'Rank|Model|DeepSeek-V3 Avg|GPT-OSS Avg|Overall Avg') throw new Error('Ranking columns missing');
    return checked(lines.slice(2).map(line=>{
      const [rank,model,deepseek,gptOss,score] = cells(line);
      if (!/^\d+$/.test(rank)) throw new Error('Missing model rank');
      return {model,score:numberCell(score),metrics:{deepseek:numberCell(deepseek),gptOss:numberCell(gptOss)}};
    }),11);
  },
};
export default board;
