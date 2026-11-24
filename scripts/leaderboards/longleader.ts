// LongLeader evaluates long-context reasoning across task types. Table 2 gives the
// authors' AVG for the whole 128K benchmark, including the shorter tasks.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://aclanthology.org/2025.naacl-long.439.pdf';
const models = ['Claude 3','Claude 2.1','Llama 2 13b-chat','Llama 2 7b-chat','Mixtral','Mistral v0.2-inst'];
const keys = ['SYR','F-QA','MC-QA','ICL','SUM','LGR'];
const board: Leaderboard = {
  benchmark:'longleader',static:'paper',url:'https://aclanthology.org/2025.naacl-long.439/',feed,
  terms:'ACL Anthology publishes the paper and license at https://aclanthology.org/2025.naacl-long.439/.',
  aliases:{'Claude 3':'claude-3-sonnet','Mistral v0.2-inst':'mistral-7b-instruct-v0-2'},
  parts:Object.fromEntries(keys.map(k=>[k,k])),
  async fetch() {
    const pdf = await pdfText(feed);
    const end = pdf.indexOf('Table 2: Test Results for the Whole 128K Benchmark');
    const block = pdf.slice(pdf.lastIndexOf('Task Type',end),end).trim().split('\n').map(l=>l.trim().replace(/\s+/g,' '));
    if (block[0]!=='Task Type '+models.join(' ')) throw new Error('Model columns changed');
    const columns = new Map(block.slice(1).map(line=>{const [key,...values]=line.split(' ');return [key,values]}));
    return checked(models.map((model,i)=>{
      const metrics: Record<string,number> = {};
      for (const key of [...keys,'AVG']) {
        const values = columns.get(key);
        if (values?.length!==models.length) throw new Error('Missing '+key);
        if (values[i]==='N/A' && key!=='AVG') continue;
        if (!/^\d+(?:\.\d+)?$/.test(values[i])) throw new Error('Unexpected '+key+' value');
        metrics[key] = Number(values[i]);
      }
      const {AVG:score,...parts} = metrics;
      return {model,score,metrics:parts};
    }),6);
  },
};
export default board;
