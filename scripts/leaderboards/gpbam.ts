// GPBam grades legal essays on 81 German public-law cases. Table 4 reports the 0 to 100 mean of per-case median judge scores.
// Table 8 reports essay scores under different retrieval settings. The authors' cost CSV gives no-retrieval resource use.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://arxiv.org/html/2611.18981';
const costsUrl = 'https://raw.githubusercontent.com/wendli01/gpbam/HEAD/experiments/analysis/out/cost_performance_norag.csv';
const board: Leaderboard = {
  benchmark:'gpbam', url:'https://github.com/wendli01/gpbam', feed, static:'paper', costPer:'run',
  terms:'The authors publish the scores and analysis files at https://github.com/wendli01/gpbam/blob/main/SUBMISSION.md.',
  aliases:{'deepseek/deepseek-chat-v3-0324':'deepseek-v3-mar-2025','deepseek/deepseek-r1-0528':'deepseek-r1-may-2025',
    'openai/gpt-4o-mini-2024-07-18':'gpt-4o-mini','mistralai/mistral-large-2512':'mistral-large-3',
    'mistralai/Mistral-Medium-3.5-128B':'mistral-medium-3-5','qwen/qwen3-235b-a22b-thinking-2507':'qwen3-235b-a22b-thinking-jul-2025',
    'Microsoft/Phi-4-mini-instruct':'phi-4-mini','qwen3-next-80b-a3b-instruct':'qwen3-next-80b-a3b-instruct'},
  stats:{
    judgeGPT:{name:'GPT-oss judge score',unit:'score',better:'higher'},
    judgeQwen:{name:'Qwen3.6 judge score',unit:'score',better:'higher'},
    judgeDeepSeek:{name:'DeepSeek-V4 judge score',unit:'score',better:'higher'},
    legalReferenceSimilarity:{name:'Legal reference similarity',unit:'score',better:'higher',note:'Jaccard overlap of unique law and section references.'},
    recitationGP:{name:'Article recitation ROUGE-L F1 on GPBam laws',unit:'%',better:'higher'},
    recitationCited:{name:'Article recitation ROUGE-L F1 on most-cited laws',unit:'%',better:'higher'},
    inputTokens:{name:'Input tokens',unit:'tokens'},
    outputTokens:{name:'Output tokens',unit:'tokens'},
    goldNormsCited:{name:'Gold norms cited by the essay',unit:'%',better:'higher'},
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const models = tables.find(t=>t[0].join('|')==='Family|Identifier|Short name|Size|Serving');
    const main = tables.find(t=>t[2]?.slice(0,9).join('|')==='Model|Median|Deb.|GPT-oss|Qwen3.6|DS-V4|Ref.|GP|Cited');
    const rag = tables.find(t=>t[6]?.[0]?.startsWith('Essay score (0–100)'));
    if (!models || !main || !rag || rag[0].length!==11 || rag[1].at(-1)!=='oracle') throw new Error('Missing GPBam score tables');
    const resources = parseCsv(await fetchText(costsUrl));
    const ids = new Map(models.slice(1).map(r=>[r[2].split(' [')[0].toLowerCase(),r[1].replace(/ ‡$/,'')]));
    const rows: LeaderboardRow[] = [];
    const short = (s:string) => s.replace(/ †$/,'').toLowerCase();
    for (const r of main.slice(3)) {
      const model = ids.get(short(r[0])), match = r[1].match(/^([\d.]+)\s*±\s*([\d.]+)$/);
      if (!model || !match) throw new Error('Unexpected GPBam no-retrieval result: '+r[0]);
      const cost = resources.find(c=>c.model.toLowerCase()===model.toLowerCase());
      const metrics: Record<string,number> = {stderr:numberCell(match[2]),judgeGPT:numberCell(r[3]),judgeQwen:numberCell(r[4]),
        judgeDeepSeek:numberCell(r[5]),legalReferenceSimilarity:numberCell(r[6]),recitationGP:numberCell(r[7].replace(' ‡','')),
        recitationCited:numberCell(r[8])};
      if (cost) {
        metrics.inputTokens=Number(cost.prompt_tokens)/81;
        metrics.outputTokens=Number(cost.completion_tokens)/81;
        metrics.costImputed=Number(cost.cost_source==='imputed');
      }
      rows.push({model,setting:'No retrieval',harness:r[0].includes('†')?'Claude Code':undefined,
        score:numberCell(match[1]),cost:cost?Number(cost.cost_usd):undefined,metrics});
    }
    const variants:Record<string,string>={'Gemma-4-31B':'Gemma-4-31B-I','Qwen3-Next-80B-A3B':'Qwen3-next-80b',
      'Magistral-Small':'Magistral-S','Mistral-Small-3.2':'Mistral-S-3.2-24B-I'};
    const settings=rag[1].map((v,i)=>(rag[0][i]+' '+v).trim().replace(/([+-]) /g,'$1'));
    for (const r of rag.slice(7,14)) {
      const model = ids.get(short(variants[r[0]] ?? r[0]));
      const cited = rag.slice(15).find(c=>c[0]===r[0]);
      if (!model || !cited) throw new Error('Missing GPBam retrieval row for '+r[0]);
      for (let i=2;i<r.length-1;i++) rows.push({model,setting:settings[i],score:numberCell(r[i]),metrics:{goldNormsCited:numberCell(cited[i])}});
    }
    return checked(rows,88);
  },
};
export default board;
