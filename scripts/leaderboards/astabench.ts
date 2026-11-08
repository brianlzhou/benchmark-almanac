// AstaBench: the public Space configuration contains its default test-set Overall leaderboard.
// Overall Score is the published macro-average of four categories, converted from fractions to percentages.
// Only agents attempting all four categories belong on this whole-suite board. Category scores remain metrics.
// The source explains: "Overall score: A macro-average of the four category-level averages (equal weighting)".
// We read that published score directly. Full-precision tooltip values avoid rounding from the displayed cells.
// Overall Cost is the board's category-macro-averaged cost per problem. Multi-model agents retain their system name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://allenai-asta-bench-leaderboard.hf.space/config";

const board: Leaderboard = {
  benchmark: "astabench",
  url: "https://huggingface.co/spaces/allenai/asta-bench-leaderboard",
  feed: FEED,
  terms: "Ai2 publishes the public Space data and evaluation logs. Robots rules permit its configuration endpoint.",
  chart: {
    title: 'Score against cost',
    x: { key: 'cost', label: 'Average cost per problem', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall score', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    interface Frame {headers:string[];data:string[][]}
    const config=await fetchJson<{components:{type:string;props:{value?:Frame}}[]}>(FEED);
    const t=config.components.find(c=>c.type==='dataframe'&&c.props.value?.headers?.includes('Overall Score'))?.props.value;
    if(!t)throw new Error('AstaBench overall table missing');
    const col=(name:string)=>{const i=t.headers.indexOf(name);if(i<0)throw new Error('AstaBench column missing: '+name);return i;};
    const scalar=(cell:string)=>{const full=cell?.match(/data-tooltip="(?:Score|Cost \(USD\)): ([\d.eE+-]+)"/);return full?Number(full[1]):num(text(cell??''));};
    const names:Record<string,string>={'GPT-5 (2025-08)':'gpt-5-2025-08-07','GPT-5 Mini (2025-08)':'gpt-5-mini-2025-08-07','o3 (2025-04)':'o3-2025-04-16','GPT-4.1 (2025-04)':'gpt-4.1-2025-04-14','Claude Sonnet 4 (2025-05)':'claude-sonnet-4-20250514','Claude 3.5 Haiku (2024-10)':'claude-3-5-haiku-20241022','GPT-4o (2024-08)':'gpt-4o-2024-08-06','Gemini 2.5 Flash (2024-05)':'Gemini 2.5 Flash (board date inconsistent)'};
    const rows:LeaderboardRow[]=[];
    for(const r of t.data){
      if(text(r[col('Categories Attempted')])!=='4/4')continue;
      const score=scalar(r[col('Overall Score')]);if(score===undefined||score<0||score>1)throw new Error('AstaBench score invalid');
      const harness=text(r[col('Agent')]).replace(/\s*🔗\s*/g,'').trim();
      const raw=text(r[col('Models Used')]);const multi=/\(\+ \d+\)/.test(raw);
      const model=multi?harness+' (multiple models)':names[raw]??raw;
      const metrics:Record<string,number>={};
      for(const [key,label] of Object.entries({literature:'Literature Understanding',code:'Code & Execution',dataAnalysis:'Data Analysis',discovery:'End-to-End Discovery'})){
        const v=scalar(r[col(label+' Score')]);if(v===undefined)throw new Error('AstaBench complete category missing');metrics[key]=v*100;
      }
      rows.push({model,harness,score:score*100,cost:scalar(r[col('Overall Cost')]),date:r[col('Date')],metrics});
    }
    if(rows.length<18)throw new Error('AstaBench lost complete agents');return rows;
  },
};
export default board;
