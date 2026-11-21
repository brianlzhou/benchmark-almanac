// Cooper's report compares document accuracy with and without its insurance harness. The cost table includes both modes, and the report gives track scores for the harness.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "insurance-agent-benchmark-cooper",
  stats: { estimatedRunCost: { name: 'Estimated run cost', unit: 'usd', better: 'lower' }, totalTokens: { name: 'Total tokens', unit: 'tokens' }, p95Seconds: { name: '95th percentile latency', unit: 'seconds', better: 'lower' }, fieldF1: { name: 'Field F1', unit: '%', better: 'higher' }, hallucinationRate: { name: 'Hallucination rate', unit: '%', better: 'lower' }, reliability: { name: 'Reliability', unit: '%', better: 'higher' }, failures: { name: 'Failures', unit: 'count', better: 'lower' } },
  url: "https://www.askcooper.ai/labs/insurance-agent-benchmark",
  feed: "https://www.askcooper.ai/labs/insurance-agent-benchmark",
  terms: "Cooper limits use to personal, noncommercial purposes and prohibits scraping. https://www.askcooper.ai/terms Its robots.txt allows the report.",
  harnesses: "system",
  async fetch() {
    const tabs = tables(await fetchText(this.url));
    const find = (label:string) => tabs.find(t => t[0]?.some(c => c.text === label));
    const runs = find('Per doc'), tracks = find('What it tests'), split = find('11'), latency = find('With Cooper p95 (s)'), detail = find('Field F1');
    if (!runs || runs.length < 35 || !tracks || tracks.length !== 12 || !split || !latency || !detail) throw new Error('Missing IAB ranking or track tables');
    this.parts = Object.fromEntries(tracks.slice(1).map(r => ['track'+r[0].text,r[1].text]));
    const value = (s:string) => {const n = num(s); if(n === undefined) throw new Error('Missing IAB score'); return n;};
    return runs.slice(1).map(r => {
      const model = r[0].text, mode = r[1].text, harness = mode === 'harness';
      if (!['harness','plain'].includes(mode)) throw new Error('Unknown IAB mode');
      const p95 = latency.find(x => x[0].text===model);
      const metrics:Record<string,number> = {estimatedRunCost:value(r[3].text), totalTokens:value(r[5].text)*(/M$/.test(r[5].text)?1e6:/K$/i.test(r[5].text)?1e3:1)};
      if (!p95) throw new Error('Missing IAB p95');
      metrics.p95Seconds = value(p95[harness ? 1 : 2].text);
      if (harness) {
        const tr = split.find(x => x[0].text===model), d = detail.find(x => x[0].text===model);
        if (!tr || tr.length!==12 || !d) throw new Error('Missing IAB model details');
        tr.slice(1).forEach((v,i) => metrics['track'+(i+1)] = value(v.text));
        metrics.fieldF1=value(d[5].text); metrics.hallucinationRate=value(d[6].text); metrics.reliability=value(d[7].text); metrics.failures=value(d[8].text);
      }
      return {model,score:value(r[2].text),harness:harness?'Cooper':undefined,setting:harness?undefined:'Model alone',cost:value(r[4].text),metrics};
    });
  },
};
export default board;
