// JamC-QA tests Japanese knowledge with multiple-choice questions across eight categories.
// The headline is the README's All exact-match proportion, converted from 0 to 1 to percent.
// Category proportions remain in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://huggingface.co/datasets/sbintuitions/JamC-QA/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'jamc-qa', url: 'https://huggingface.co/datasets/sbintuitions/JamC-QA', feed: FEED,
  terms: 'The dataset is published under its repository terms. Attribution and source licensing apply.',
  parts: Object.fromEntries(['culture','custom','regional_identity','geography','history','government','law','healthcare'].map(name => [name,{name}])),
  async fetch(): Promise<LeaderboardRow[]> {
    return checked([
      ['sarashina2-8x70b',.725,.714,.775,.761,.654,.784,.736,.632,.917],
      ['sarashina2-70b',.725,.719,.745,.736,.673,.764,.764,.666,.917],
      ['Llama-3.3-Swallow-70B-v0.4',.697,.689,.775,.589,.566,.776,.773,.783,.854],
      ['RakutenAI-2.0-8x7B',.633,.622,.725,.617,.511,.714,.709,.575,.813],
      ['plamo-100b',.603,.602,.650,.637,.504,.682,.609,.515,.688],
      ['Mixtral-8x7B-v0.1-japanese',.593,.602,.670,.579,.493,.612,.736,.545,.667],
      ['Meta-Llama-3.1-405B',.571,.558,.545,.484,.500,.679,.646,.629,.688],
      ['llm-jp-3.1-8x13b',.568,.595,.635,.582,.449,.589,.627,.502,.625],
      ['Nemotron-4-340B-Base',.567,.573,.615,.511,.467,.595,.727,.582,.667],
      ['Qwen2.5-72B',.527,.522,.595,.426,.438,.606,.609,.562,.688],
    ].map(([model,score,...parts]) => ({model:String(model), score:Number(score)*100, metrics:Object.fromEntries(['culture','custom','regional_identity','geography','history','government','law','healthcare'].map((k,i)=>[k,Number(parts[i])*100]))})), 10);
  },
};
export default board;
