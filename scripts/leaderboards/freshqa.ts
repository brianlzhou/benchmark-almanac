// FreshQA tests factual answers to questions whose answers can change over time.
// Table 2 of the ACL paper reports relaxed FreshEval accuracy on the February 5, 2024 release.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2024.findings-acl.813.pdf';
const parts = ['Valid premise','Fast-changing','Slow-changing','Never-changing','Valid premise before 2024','Valid premise since 2024','One-hop','Multi-hop','False premise','False premise before 2024'];
const models: Record<string,string> = {
  'GPT-4':'gpt-4-0125-preview','M IXTRAL (8 X 7B)':'Mixtral-8x7B-Instruct-v0.1','L LAMA -2 (70B)':'Llama-2-70b-chat-hf',
  'PPLX.AI’ S O NLINE LLM (70B)':'pplx-70b-online','YOU . COM ’ S W EB LLM':"You.com's Web LLM",
};
const board:Leaderboard = {
  benchmark:'freshqa',url:'https://aclanthology.org/2024.findings-acl.813/',feed,static:'paper',
  terms:'ACL Anthology distributes the paper under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  aliases:{'gpt-4-0125-preview':'gpt-4-turbo-jan-2024'},
  parts:Object.fromEntries(parts.map(name => [name,{name,unit:'%' as const}])),
  async fetch() {
    const paper = await pdfText(feed);
    const caption = 'Table 2: Accuracy of recent LLM';
    const page = paper.split('\f').find(p => p.includes(caption));
    if (!page || !page.includes('≥ 2024') || !page.includes('false premise')) throw new Error('Missing Table 2');
    const rows:LeaderboardRow[] = [];
    for (const line of page.split(caption)[0].split('\n')) {
      const m = line.trim().match(/^(.+?)\s+(Online|202[0-9]\/\d{2}\+)\s+([\d.\s]+)$/);
      if (!m) continue;
      const [label,method] = m[1].split(' + ');
      const model = models[label.trim()];
      const values = m[3].trim().split(/\s+/).map(Number);
      if (!model || values.length !== 11 || !values.every(Number.isFinite)) throw new Error('Unrecognized Table 2 row: ' + line);
      rows.push({model, score:values[0],date:'2024-02-05',setting:method ? 'Relaxed FreshEval with FreshPrompt' : 'Relaxed FreshEval',
        metrics:Object.fromEntries(parts.map((key,i) => [key,values[i+1]]))});
    }
    return checked(rows,8);
  },
};
export default board;
