// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Apple reports how quickly models identify a hidden entity in the Things and Celebrities README tables.
import type { Leaderboard, BoardStat } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/apple-aiml-research/ml-entity-deduction-arena/HEAD/README.md';
const parts = ['Things','Celebrities'];
const fields = ['Turns','Success','Yes answers','Score'];
const stats: Record<string,BoardStat> = {};
for (const part of parts) for (const field of fields) {
  const name = part+' '+field.toLowerCase();
  const unit = field === 'Turns' || field === 'Yes answers' ? 'count' : 'score';
  if (field !== 'Score') stats[name] = {name,unit};
  stats[name+' SD'] = {name:name+' standard deviation',unit};
}
const board: Leaderboard = {
  benchmark:'entity-deduction-arena',url:'https://github.com/apple-aiml-research/ml-entity-deduction-arena',feed,
  terms:'The repository lists its license at https://github.com/apple-aiml-research/ml-entity-deduction-arena/blob/main/LICENSE.',
  parts:{Things:'Things',Celebrities:'Celebrities'},stats,
  headline:'The headline is the plain mean of the Things and Celebrities game scores.',
  aliases:{'Vicuna 13B (v1.3)':'vicuna-13b-v1-3','Mistral 7B Inst v0.2':'mistral-7b-instruct-v0-2'},
  async fetch() {
    const source = await fetchText(feed);
    const models = new Map<string,Record<string,number>>();
    for (const part of parts) {
      const table = source.split('### '+part+'\n')[1]?.trimStart().split('\n\n')[0];
      if (!table || !/Model.*#Turns.*Success.*#Yes.*Score/.test(table.split('\n')[0])) throw new Error('Missing '+part);
      for (const line of table.split('\n').slice(2)) {
        const [label,...cells] = line.split('|').slice(1,-1).map(c => c.replaceAll('*','').trim());
        const model = label.match(/^\[([^\]]+)\]/)?.[1] ?? label;
        const metrics = models.get(model) ?? {};
        if (cells.length !== 4 || part in metrics) throw new Error('Unexpected '+part+' row');
        cells.forEach((cell,i) => {
          const pair = cell.match(/^([\d.]+)±([\d.]+)$/);
          if (!pair) throw new Error('Missing estimate or deviation');
          const key = part+' '+fields[i].toLowerCase();
          metrics[i === 3 ? part : key] = Number(pair[1]);
          metrics[key+' SD'] = Number(pair[2]);
        });
        models.set(model,metrics);
      }
    }
    return checked([...models].filter(([,m]) => parts.every(p => p in m)).map(([model,metrics]) =>
      ({model, metrics, trials:5, score:(metrics.Things+metrics.Celebrities)/2})),7);
  },
};
export default board;
