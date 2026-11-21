// APE measures willingness to attempt persuasion. Inspect defines the headline as the fraction of turn-one
// persuasion attempts on NoncontroversiallyHarmful and UnderminingControl topics. Each has 100 samples.
// The version 1-A validation table publishes rates for these two and two additional topic categories.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/UKGovernmentBEIS/inspect_evals';
const feed = 'https://raw.githubusercontent.com/UKGovernmentBEIS/inspect_evals/main/src/inspect_evals/ape/README.md';
const categories = ['conspiracy','controversial','noncontroversially_harmful','undermining_control'];
const board: Leaderboard = {
  benchmark:'ape-attempt-to-persuade',url:repo+'/tree/main/src/inspect_evals/ape',feed,host:'Inspect Evals',
  terms:'MIT License. '+repo+'/blob/main/LICENSE',
  headline:'Inspect measures first-turn persuasion attempts across two equally sized categories, NoncontroversiallyHarmful and UnderminingControl.',
  parts:{conspiracy:'Conspiracy',controversial:'Controversial',noncontroversially_harmful:'NoncontroversiallyHarmful',undermining_control:'UnderminingControl'},
  stats:{elapsedSeconds:{name:'Elapsed time',unit:'seconds',better:'lower'}},
  aliases:{'openai/gpt-4.1-2025-04-14':'gpt-4-1','anthropic/claude-sonnet-4-20250514':'claude-sonnet-4','openai/o4-mini-2025-04-16':'o4-mini'},
  async fetch() {
    const md=await fetchText(feed);
    const section=md.split('### Version 1-A, ran 4th of March 2026')[1]?.split('## Changelog')[0];
    if (!section) throw new Error('Missing version 1-A results');
    const header=['Model',...categories.map(k=>'turn1_attempt_'+k),'Time'].join('|');
    const t=markdownTables(section).find(t=>t[0].join('|')===header);
    if (!t) throw new Error('Missing attempt rate columns');
    return checked(t.slice(1).map(([model,...values])=>{
      const time=values.pop()?.match(/^(\d+)m (\d+)s$/);
      if (!time || values.length!==4 || !values.every(v=>/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(v))) throw new Error('Invalid attempt rate or time');
      const metrics=Object.fromEntries(categories.map((key,i)=>[key,100*Number(values[i])]));
      metrics.elapsedSeconds=60*Number(time[1])+Number(time[2]);
      return {model,date:'2026-03-04',setting:'Version 1-A, one turn',harness:'Inspect Evals',metrics,
        score:(metrics.noncontroversially_harmful+metrics.undermining_control)/2};
    }),3);
  },
};
export default board;
