// Evalita-LLM evaluates Italian language tasks with several prompts. The official leaderboard
// ranks by Average Combined Performance on a 0 to 100 scale. Some runs also cover two MAIA tasks.
// Retain each task's combined score and its prompt statistics.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://evalitahf-evalita-llm-leaderboard.hf.space/config';
const tasks = ['TE','SA','HS','AT','WIC','FAQ','LS','SU','NER','REL','MAIA-MC','MAIA-GEN'];
type Table = {headers:string[]; data:unknown[][]};
const board: Leaderboard = {
  benchmark:'evalita-llm', url:'https://huggingface.co/spaces/evalitahf/evalita_llm_leaderboard', feed,
  terms:'The official leaderboard uses Apache 2.0. https://huggingface.co/spaces/evalitahf/evalita_llm_leaderboard/blob/main/README.md',
  parts:Object.fromEntries(tasks.map(k => [k,k])),
  stats:Object.fromEntries(tasks.flatMap(k => [[k + ' Prompt Average', {name:k + ' prompt average', unit:'%', better:'higher'}], [k + ' Prompt Std', {name:k + ' prompt standard deviation', unit:'%'}], [k + ' Best Prompt', {name:k + ' best prompt', unit:'%', better:'higher'}], [k + ' Best Prompt Id', {name:k + ' best prompt ID', unit:'count'}]])),
  aliases:{'Mistral-Large-Instruct-2411':'mistral-large-2-nov-2024', 'Llama-3.1-Tulu-3-70B':'tulu-3-tulu-3-70b',
    'Mistral-Small-24B-Instruct-2501':'mistral-small-3', 'Phi-3.5-mini-instruct':'phi-3-5-mini',
    'gemma-3-270m':'gemma-3-270m-base','InternVL3_5-8B':'internvl3-5-8b'},
  async fetch() {
    const config = await fetchJson<{components:{type:string;props:{value?:Table}}[]}>(feed);
    const table = config.components.find(c => c.type === 'leaderboard' && tasks.every(k => c.props.value?.headers.includes(k)))?.props.value;
    if (!table) throw new Error('Missing Evalita-LLM task table');
    const rows = table.data.map(cells => {
      const fields = Object.fromEntries(table.headers.map((k,i) => [k,cells[i]]));
      const number = (k:string) => {
        const v = fields[k];
        if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Invalid Evalita-LLM value: '+k);
        return v;
      };
      const anchor = String(fields.Model).match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!anchor || typeof fields.IS_FS !== 'boolean') throw new Error('Missing model or shot setting');
      const metrics: Record<string,number> = {};
      for (const k of tasks) {
        if (k.startsWith('MAIA-') && fields[k] === null) continue;
        for (const suffix of ['', ' Prompt Average', ' Prompt Std', ' Best Prompt', ' Best Prompt Id']) metrics[k + suffix] = number(k+suffix);
      }
      const shots = fields.IS_FS ? '5-shot' : '0-shot';
      const setting = shots + (fields['MAIA-MC'] === null ? ', 10 text tasks' : ', 12 text and multimodal tasks');
      return {model:text(anchor[2]), link:anchor[1], score:number('Avg. Comb. Perf. ⬆️'), setting, metrics,
        params:typeof fields['#Params (B)'] === 'number' && number('#Params (B)')>0 ? number('#Params (B)') : undefined};
    });
    return checked(rows,90);
  },
};
export default board;
