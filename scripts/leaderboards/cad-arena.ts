// Read CAD Arena’s table and embedded platform results, including intervals, effort and per-trial resource use.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://normalfactory.com/leaderboard/cad-arena';

interface PlatformResult {
  modelId: string; platformId: string; score: number | null; meanGeometry: number | null;
  meanEditability: number | null; meanCostUsd: number | null; meanTokens: number | null; scored:number; scheduled:number;
}
interface Details {
  platforms: {id:string; name:string}[];
  models: {id:string; name:string; reasoning:string; interval?:number[]; meanMinutes:number | null;
    meanTokens:number | null; meanGeometry:number; meanEditability:number; meanTurns:number; scored:number; scheduled:number}[];
  cells: PlatformResult[];
}
function details(html:string): Details | undefined {
  for (const match of html.matchAll(/self\.__next_f\.push\((\[1,"(?:\\.|[^"\\])*"\])\)<\/script>/g)) {
    const chunk=JSON.parse(match[1])[1] as string;
    for (const line of chunk.split('\n')) {
      if (!line.includes('"board":{"benchmark"')) continue;
      const data=JSON.parse(line.slice(line.indexOf(':')+1))[3]?.board;
      if (data?.benchmark?.name==='CAD Arena') return data;
    }
  }
}
const board: Leaderboard = {
  benchmark: 'cad-arena',
  url: URL,
  feed: `${URL} (server-rendered HTML table, Score)`,
  terms: 'Server-rendered public page; robots.txt allows all paths (content signals: search yes, AI training no, use reference) and the site states no terms.',
  aliases: {
    // the board lists GPT-6 Astra by its short name
    Astra: 'gpt-6-astra',
    'DeepSeek V4': 'deepseek-v4-pro',
  },
  parts: {
    geometry: { name: 'Geometry', group: 'Dimension' },
    editability: { name: 'Editability', group: 'Dimension' },
    build123d: { name: 'Build123d', group: 'Platform' },
    nxOpen: { name: 'NX Open', group: 'Platform' },
    solidworks: { name: 'SolidWorks', group: 'Platform' },
    featurescript: { name: 'FeatureScript', group: 'Platform' },
    fusion: { name: 'Fusion', group: 'Platform' },
  },
  stats: {
    turns: { name: 'Turns', unit: 'count' },
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
    build123dGeometry: { name: 'Build123d geometry score', unit: 'score', better: 'higher' },
    build123dEditability: { name: 'Build123d editability score', unit: 'score', better: 'higher' },
    build123dCost: { name: 'Build123d cost', unit: 'usd', better: 'lower' },
    build123dTotalTokens: { name: 'Build123d total tokens', unit: 'tokens' },
    build123dScored: { name: 'Build123d scored trials', unit: 'count' },
    nxOpenGeometry: { name: 'NX Open geometry score', unit: 'score', better: 'higher' },
    nxOpenEditability: { name: 'NX Open editability score', unit: 'score', better: 'higher' },
    nxOpenCost: { name: 'NX Open cost', unit: 'usd', better: 'lower' },
    nxOpenTotalTokens: { name: 'NX Open total tokens', unit: 'tokens' },
    nxOpenScored: { name: 'NX Open scored trials', unit: 'count' },
    solidworksGeometry: { name: 'SolidWorks geometry score', unit: 'score', better: 'higher' },
    solidworksEditability: { name: 'SolidWorks editability score', unit: 'score', better: 'higher' },
    solidworksCost: { name: 'SolidWorks cost', unit: 'usd', better: 'lower' },
    solidworksTotalTokens: { name: 'SolidWorks total tokens', unit: 'tokens' },
    solidworksScored: { name: 'SolidWorks scored trials', unit: 'count' },
    featurescriptGeometry: { name: 'FeatureScript geometry score', unit: 'score', better: 'higher' },
    featurescriptEditability: { name: 'FeatureScript editability score', unit: 'score', better: 'higher' },
    featurescriptCost: { name: 'FeatureScript cost', unit: 'usd', better: 'lower' },
    featurescriptTotalTokens: { name: 'FeatureScript total tokens', unit: 'tokens' },
    featurescriptScored: { name: 'FeatureScript scored trials', unit: 'count' },
    fusionGeometry: { name: 'Fusion geometry score', unit: 'score', better: 'higher' },
    fusionEditability: { name: 'Fusion editability score', unit: 'score', better: 'higher' },
    fusionCost: { name: 'Fusion cost', unit: 'usd', better: 'lower' },
    fusionTotalTokens: { name: 'Fusion total tokens', unit: 'tokens' },
    fusionScored: { name: 'Fusion scored trials', unit: 'count' },
  },
  chart: {
    title: 'Score vs. cost',
    x: { key: 'cost', label: 'Mean cost per scored trial', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Score', better: 'higher' },
    note: 'Normal Factory plots CAD Arena score against mean cost per scored trial on a log scale with a Pareto frontier.',
  },
  async fetch() {
    const html = await fetchText(URL);
    const data = details(html);
    const platformKeys=new Map<string,string>();
    for (const p of data?.platforms ?? []) {
      const key=p.id.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase());
      platformKeys.set(p.id,key);
    }
    const t = tables(html).find((rows) => rows[0]?.some((c) => c.text === 'Score'));
    if (!t) throw new Error('CAD Arena table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore, iHarness, iCost, iTurns] = ['Model', 'Score', 'Harness', 'Cost', 'Turns'].map((h) => head.indexOf(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the name is the first text block. The maker follows in its own element
      const name = r[iModel]?.html.split(/<\/(?:span|div|p|a)>/i).map(text).find(Boolean);
      const score = num(r[iScore]?.text);
      if (!name || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const turns = num(r[iTurns]?.text);
      if (turns !== undefined) metrics.turns = turns;
      // aria-label "CAD Arena score 0.754, 95 percent interval 0.706 to 0.795, ..."
      const ci = r.map((c) => c.html).join('').match(/95 percent interval ([\d.]+) to ([\d.]+)/);
      const m=data?.models.find(m=>m.name===name);
      if (m) {
        if (m.meanMinutes!=null) metrics.latency=m.meanMinutes*60;
        if (m.meanTokens!=null) metrics.totalTokens=m.meanTokens;
        metrics.geometry=m.meanGeometry;
        metrics.editability=m.meanEditability;
        metrics.turns=m.meanTurns;
        for (const cell of data!.cells.filter(c=>c.modelId===m.id)) {
          const key=platformKeys.get(cell.platformId);
          if (!key) continue;
          for (const [field,suffix] of [['score',''],['meanGeometry','Geometry'],['meanEditability','Editability'],
            ['meanCostUsd','Cost'],['meanTokens','TotalTokens'],['scored','Scored']] as const) {
            const v=cell[field];
            if (v!=null) metrics[key+suffix]=v;
          }
        }
      }
      rows.push({
        model: name, trials:m?.scored, setting:m?.reasoning==='No effort setting' ? undefined : m?.reasoning,
        low:ci ? Number(ci[1]) : undefined, high:ci ? Number(ci[2]) : undefined,
        score,
        harness: r[iHarness]?.text || undefined,
        cost: num(r[iCost]?.text.replace('$', '')),
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
