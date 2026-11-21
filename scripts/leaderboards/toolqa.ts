// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// ToolQA tests question answering with external tools. Tables 3 and 4 give success rates for easy and hard questions.
// Each difficulty has its own domain columns and published average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://proceedings.neurips.cc/paper_files/paper/2023/file/9cb2a7495900f8b602cb10159246a016-Paper-Datasets_and_Benchmarks.pdf';
const domains = {
  Easy: ['Flight', 'Coffee', 'Agenda', 'Yelp', 'DBLP', 'SciREX', 'GSM8K', 'Airbnb'],
  Hard: ['Flight', 'Coffee', 'Agenda', 'Yelp', 'Airbnb', 'DBLP', 'SciREX'],
};
const identities: Record<string, Pick<LeaderboardRow, 'model' | 'setting' | 'harness'>> = {
  'LLaMA-2 (13B)': { model: 'LLaMA-2 (13B)' },
  'LLaMA-2 (70B)': { model: 'LLaMA-2 (70B)' },
  'Falcon (40B)': { model: 'Falcon (40B)' },
  ChatGPT: { model: 'gpt-3.5-turbo' },
  CoT: { model: 'gpt-3.5-turbo', setting: 'Chain of thought' },
  Chameleon: { model: 'gpt-3.5-turbo', harness: 'Chameleon' },
  'ReAct (GPT-3)': { model: 'text-davinci-003', harness: 'ReAct' },
  'ReAct (GPT-3.5)': { model: 'gpt-3.5-turbo', harness: 'ReAct' },
};
const board: Leaderboard = {
  benchmark: 'toolqa', url: feed, feed, static: 'paper',
  terms: 'The NeurIPS proceedings publish the authors’ paper. https://proceedings.neurips.cc/',
  headline: 'The paper reports easy and hard success rates separately, so the headline is their plain mean.',
  aliases: { 'LLaMA-2 (13B)': 'llama-2-13b', 'LLaMA-2 (70B)': 'llama-2-70b', 'Falcon (40B)': 'falcon-40b', 'text-davinci-003': 'davinci-003' },
  parts: Object.fromEntries(Object.entries(domains).flatMap(([level, names]) =>
    [[level, level], ...names.map(name => [level + name, level + ': ' + name])])),
  async fetch() {
    const text = await pdfText(feed);
    const byMethod = new Map<string, Record<string, number>>();
    for (const [level, names] of Object.entries(domains)) {
      const title = level === 'Easy' ? 'Table 3: Success rates on easy questions.' : 'Table 4: Success rate on hard questions.';
      const section = text.split(title)[1]?.split(level === 'Easy' ? 'Table 4:' : 'answering.')[0];
      if (!section?.replace(/\s+/g, ' ').includes(names.join(' ') + ' Average')) throw Error('Missing ' + title);
      for (const line of section.split('\n')) {
        const match = line.trim().match(/(LLaMA-2 \(\d+B\)|Falcon \(40B\)|ChatGPT|CoT|Chameleon|ReAct \(GPT-3(?:\.5)?\))\s+([\d.\s]+)$/);
        if (!match) continue;
        const values = match[2].trim().split(/\s+/).map(Number);
        if (values.length !== names.length + 1 || !values.every(Number.isFinite)) throw Error('Invalid ' + match[1]);
        const metrics = byMethod.get(match[1]) ?? {};
        if (level in metrics) throw Error('Duplicate ' + match[1]);
        metrics[level] = values.at(-1)!;
        names.forEach((name, index) => { metrics[level + name] = values[index]; });
        byMethod.set(match[1], metrics);
      }
    }
    const rows = Object.entries(identities).map(([method, identity]) => {
      const metrics = byMethod.get(method);
      if (!metrics || metrics.Easy === undefined || metrics.Hard === undefined) throw Error('Incomplete ' + method);
      return { ...identity, score: (metrics.Easy + metrics.Hard) / 2, metrics };
    });
    return checked(rows, 8);
  },
};
export default board;
