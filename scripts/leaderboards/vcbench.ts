// VCBench predicts founder success from information available at founding.
// The official board ranks models by F0.5 on 4,500 held-out founders and plots cost per 1,000 founders.
// The embedded leaderboard gives unrounded precision and recall, while chart labels give cost and token counts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://vcbench.com/';
interface Item { name: string; description: string }
interface List { '@id': string; numberOfItems: number; itemListElement: Item[] }
const board: Leaderboard = {
  benchmark: 'vcbench', url: feed, feed,
  stats: {inputTokens:{name:'Input tokens per founder',unit:'tokens'},outputTokens:{name:'Output tokens per founder',unit:'tokens'},precision:{name:'Precision',unit:'%',better:'higher'},recall:{name:'Recall',unit:'%',better:'higher'}},
  terms: 'Vela Research publishes and maintains the public leaderboard. https://vcbench.com/',
  chart: { title: 'Accuracy versus cost', x: { key: 'costPerThousand', label: 'Cost per 1,000 founders', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'F0.5', unit: '%' }, note: 'The chart uses the cost per 1,000 founders shown by VCBench, including its estimates.' },
  async fetch() {
    const html = await fetchText(feed);
    const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    const list = scripts.flatMap(m => JSON.parse(m[1])['@graph'] ?? []).find((node: List) => node['@id'] === feed + '#leaderboard') as List | undefined;
    if (!list || list.itemListElement.length !== list.numberOfItems) throw Error('Missing complete VCBench leaderboard');
    const labels = [...html.matchAll(/<circle\b[^>]*aria-label="([^"]+)"/g)].map(m => text(m[1]));
    const links = new Map([...html.matchAll(/<a href="(\/models\/[^"]+)">([^<]+)<\/a>/g)].map(m => [text(m[2]), new URL(m[1], feed).href]));
    const rows = list.itemListElement.flatMap(item => {
      const identity = item.name.match(/^(.+) \(([^()]+)\)$/);
      if (!identity) throw Error('Invalid VCBench model: ' + item.name);
      const [, model, submitter] = identity;
      if (['Humans', 'Baseline'].includes(submitter)) return [];
      const stats = item.description.match(/^Precision ([\d.]+)%, recall ([\d.]+)%, F0\.5 ([\d.]+)%$/);
      const label = labels.find(s => s.startsWith(model + ', '));
      if (!stats || !label) throw Error('Missing measures for ' + model);
      const pricing = label.match(/\$([\d.]+) per 1k founders/);
      if (!pricing && !label.includes('cost n/a')) throw Error('Invalid cost for ' + model);
      const metrics: Record<string, number> = { precision: Number(stats[1]), recall: Number(stats[2]) };
      if (pricing) metrics.costPerThousand = Number(pricing[1]);
      const counts = label.match(/([\d,]+) in \/ ([\d,]+) out tokens per founder/);
      if (counts) {
        metrics.inputTokens = Number(counts[1].replaceAll(',', ''));
        metrics.outputTokens = Number(counts[2].replaceAll(',', ''));
        if (label.includes('(estimated)')) metrics.estimatedTokens = 1;
      }
      const link = links.get(model);
      return [{ model, submitter, score: Number(stats[3]), metrics, link,
        cost: pricing ? metrics.costPerThousand / 1000 : undefined,
        tokens: counts ? metrics.inputTokens + metrics.outputTokens : undefined }];
    });
    return checked(rows, 31);
  },
};
export default board;
