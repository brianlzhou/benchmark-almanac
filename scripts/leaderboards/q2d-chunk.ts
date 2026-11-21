// Q2D-Chunk ranks retrievers by Answer@10 on base queries. The Space serves its overall, language and domain tables in the Gradio configuration.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://perplexity-ai-q2d-chunk-leaderboard.hf.space/config";
interface Frame { headers: string[]; data: (string | number | null)[][] }
interface Component { type: string; props: { value: Frame } }

const board: Leaderboard = {
  benchmark: "q2d-chunk",
  url: "https://huggingface.co/spaces/perplexity-ai/q2d-chunk-leaderboard",
  feed: FEED,
  terms: "The Space lists mit for its repository. https://huggingface.co/spaces/perplexity-ai/q2d-chunk-leaderboard/blob/main/README.md",
  stats: {
    'nDCG@10': { name: 'Normalized discounted cumulative gain at 10', unit: 'score', better: 'higher' },
    'nDCG@10 Paraphrased': { name: 'nDCG@10 paraphrased', unit: 'score', better: 'higher' },
    'nDCG@10 Indirect': { name: 'nDCG@10 indirect', unit: 'score', better: 'higher' },
    'nDCG@10 Scenario': { name: 'nDCG@10 scenario', unit: 'score', better: 'higher' },
    'Document@10': { name: 'Document recall@10', unit: 'score', better: 'higher' },
    'Evidence@10': { name: 'Evidence recall@10', unit: 'score', better: 'higher' },
    'In-doc Evid.@10': { name: 'In-document evidence recall@10', unit: 'score', better: 'higher' },
    'All-Evid.@10': { name: 'All evidence recall@10', unit: 'score', better: 'higher' },
    'α-nDCG@10': { name: 'Alpha-nDCG@10', unit: 'score', better: 'higher' },
    'Tokens to coverage ↓': { name: 'Tokens to coverage', unit: 'tokens', better: 'lower' },
  },
  async fetch() {
    const config = await fetchJson<{ components: Component[] }>(FEED);
    const frames = config.components.filter(c => c.type === 'dataframe').map(c => c.props.value);
    const [overall, ...slices] = frames;
    if (overall?.headers.slice(0, 5).join('|') !== 'T|Model|Family|Params|Answer@10' || overall.data.length < 8
      || slices.length !== 2 || slices.some(f => f.headers[4] !== 'Overall' || f.data.length !== overall.data.length))
      throw new Error('Incomplete Q2D-Chunk leaderboard');
    board.parts = {};
    return overall.data.map(cells => {
      const label = String(cells[1]);
      const model = text(label);
      const metrics: Record<string, number> = {};
      for (const frame of frames) {
        const row = frame === overall ? cells : frame.data.find(r => r[1] === label);
        if (!row || row.length !== frame.headers.length) throw new Error('Missing scores for ' + model);
        for (const [i, header] of frame.headers.entries()) {
          if (i < 5) continue;
          const value = row[i];
          if (value == null) continue;
          if (typeof value !== 'number') throw new Error('Invalid score for ' + header);
          const key = header.replace(/ \([\d,]+\)$/, '');
          metrics[key] = value;
          if (frame !== overall || /^Answer@10 /.test(key)) board.parts![key] = key;
        }
      }
      if (typeof cells[4] !== 'number') throw new Error('Missing Answer@10 for ' + model);
      return { model, score: cells[4], params: /^\d+(?:\.\d+)?B$/.test(String(cells[3])) ? parseFloat(String(cells[3])) : undefined,
        link: label.match(/href="([^"]+)"/)?.[1], metrics };
    });
  },
};
export default board;
