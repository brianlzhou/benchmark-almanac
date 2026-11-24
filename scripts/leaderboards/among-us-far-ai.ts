// FAR.AI measures deception and detection in games of Among Us. The headline is impostor Elo.
// The authors' one-on-one tournament notebook stores both bootstrap means in the final Elo scatterplot.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/7vik/AmongUs/HEAD/reports/2025_02_26_deception_ELO_v3_ci.ipynb';
type Figure = {layout: Record<string, {title?: {text: string}}>,
  data: {name?: string, text?: string[], x: number[], y: number[]}[]};
type Notebook = {cells: {outputs?: {data?: Record<string, Figure>}[]}[]};
const board: Leaderboard = {
  benchmark: 'among-us-far-ai', url: 'https://github.com/7vik/AmongUs#deception-elo', feed,
  terms: 'The authors publish the notebook at https://github.com/7vik/AmongUs under its repository terms.',
  stats: {detection: {name: 'Detection Elo', unit: 'elo', better: 'higher'}},
  aliases: {'o3-mini-high': 'o3-mini', 'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'claude-3.7-sonnet:thinking': 'claude-3-7-sonnet'},
  async fetch() {
    const notebook = await fetchJson<Notebook>(feed);
    const figures = notebook.cells.flatMap(cell => cell.outputs ?? [])
      .map(output => output.data?.['application/vnd.plotly.v1+json']);
    const figure = figures.findLast(f => f?.layout.xaxis?.title?.text === 'Detection ELO'
      && f.layout.yaxis?.title?.text === 'Deception ELO' && f.data.some(trace => trace.name === 'Models'));
    const means = figure?.data.find(trace => trace.name === 'Models');
    if (!means?.text || means.x.length !== means.text.length || means.y.length !== means.text.length)
      throw new Error('Missing tournament Elo coordinates');
    return checked(means.text.map((model, i) => {
      if (!Number.isFinite(means.x[i])) throw new Error('Missing detection Elo');
      return { model, score: means.y[i], setting: 'One-on-one tournament', metrics: {detection: means.x[i]} };
    }), 11);
  },
};
export default board;
