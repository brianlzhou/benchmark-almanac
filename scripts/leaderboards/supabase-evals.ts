// Supabase Evals measures agent success across the Supabase developer journey. Each experiment's
// total is its successful runs divided by all runs. The page embeds its trial data in the site bundle.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://supabase.com/evals';
const parts = { build: 'Build', deploy: 'Deploy', investigate: 'Investigate', resolve: 'Resolve' };
interface Run {
  experiment: string; experimentDisplay: { modelId: string; agent: string; reasoningEffort?: string };
  stage: string; passed: boolean; skills?: { available: string[] }; experimentCreatedAt?: string;
  traceUsage?: { outputTokens?: number }; agentRunDurationMs?: number;
}
const names: Record<string,string> = { 'claude-opus-5-5':'Opus 5.5', 'claude-sonnet-5-5':'Sonnet 5.5',
  'gpt-6.1-sol':'GPT-6.1 sol', 'gpt-6-luna':'GPT-6 luna', 'grok-4.7':'Grok 4.7', 'moonshotai/kimi-k3':'Kimi K3' };
const agents: Record<string,string> = { 'claude-code':'Claude Code', codex:'Codex', opencode:'OpenCode', grok:'Grok Build' };
const board: Leaderboard = {
  benchmark: 'supabase-evals', url, feed: url, parts,
  stats: { seconds: { name: 'Average run time', unit: 'seconds', better: 'lower' } },
  terms: 'The Supabase Evals project publishes the data underlying its public benchmark page.',
  async fetch() {
    const html = await fetchText(url);
    const path = html.match(/src="(\/evals\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!path) throw new Error('Supabase Evals bundle missing');
    await new Promise(resolve => setTimeout(resolve,1000));
    const bundle = await fetchText(new URL(path,url).href);
    const literal = bundle.match(/JSON\.parse\(`(\[\{"experiment":[\s\S]*?\])`\)/)?.[1];
    if (!literal) throw new Error('Supabase experiment results missing');
    const runs: Run[] = JSON.parse(literal.replace(/\\([\\`$])/g,'$1'));
    const groups = new Map<string,Run[]>();
    for (const run of runs) {
      if (typeof run.passed !== 'boolean' || !run.experimentDisplay?.modelId || !(run.stage in parts)) throw new Error('Invalid Supabase result');
      const group = groups.get(run.experiment) ?? [];
      group.push(run);
      groups.set(run.experiment,group);
    }
    if (groups.size < 12) throw new Error('Incomplete Supabase experiment list');
    const rate = (group: Run[]) => group.filter(r => r.passed).length * 100 / group.length;
    return [...groups.values()].map(group => {
      const r = group[0], d = r.experimentDisplay;
      if (group.length < 69) throw new Error('Missing Supabase experiment runs');
      const metrics = Object.fromEntries(Object.keys(parts).map(k => {
        const stage = group.filter(v => v.stage === k);
        if (!stage.length) throw new Error('Missing Supabase stage');
        return [k,rate(stage)];
      }));
      if (group.every(v => typeof v.agentRunDurationMs === 'number')) metrics.seconds = group.reduce((a,v) => a + v.agentRunDurationMs!,0) / group.length / 1000;
      const tokens = group.every(v => typeof v.traceUsage?.outputTokens === 'number')
        ? group.reduce((a,v) => a + v.traceUsage!.outputTokens!,0) / group.length : undefined;
      return { model: names[d.modelId] ?? d.modelId, harness: agents[d.agent] ?? d.agent, score: rate(group), metrics, tokens,
        setting: [r.skills?.available.length ? 'Benchmark' : 'Without skills',d.reasoningEffort].filter(Boolean).join(' / '),
        trials: group.length, date: r.experimentCreatedAt?.slice(0,10) };
    });
  },
};
export default board;
