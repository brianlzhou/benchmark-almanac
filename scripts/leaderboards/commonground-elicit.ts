// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CommonGround Elicit measures finding contradictions and asking useful questions. Both rewards range from zero to one.
// The authors' version 0.6.0 primary runs table reports five trials per task and separate uncertainty for each reward.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/doctor-gonzo/commonground-envs/master/docs/evaluation-report-0.6.0.md';
const board: Leaderboard = {
  benchmark: 'commonground-elicit', url: 'https://github.com/doctor-gonzo/commonground-envs/blob/master/docs/evaluation-report-0.6.0.md', feed,
  terms: 'Apache 2.0. https://github.com/doctor-gonzo/commonground-envs/blob/master/LICENSE',
  parts: { find: 'Find', ask: 'Ask' }, aliases: { 'Kimi K2 Instruct': 'kimi-k2-sep-2025', 'Qwen3 30B A3B Instruct': 'qwen3-30b-a3b-instruct-jul-2025' },
  stats: {
    findZeroRewardTasks: { name: 'Find zero-reward tasks', unit: 'count' },
    askZeroRewardTasks: { name: 'Ask zero-reward tasks', unit: 'count' },
    findRecovered: { name: 'Find recovered tasks', unit: 'count' },
    askRecovered: { name: 'Ask recovered tasks', unit: 'count' },
    find_localization: { name: 'Find localization', unit: 'score', better: 'higher' },
    find_type: { name: 'Find type', unit: 'score', better: 'higher' },
    find_diagnosis: { name: 'Find diagnosis', unit: 'score', better: 'higher' },
    find_relation: { name: 'Find relation', unit: 'score', better: 'higher' },
    ask_format: { name: 'Ask format', unit: 'score', better: 'higher' },
    ask_grounding: { name: 'Ask grounding', unit: 'score', better: 'higher' },
    ask_stance: { name: 'Ask stance', unit: 'score', better: 'higher' },
    ask_top_1_selection: { name: 'Ask top one selection', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const report = await fetchText(feed);
    const table = report.split('| Task | Model | Run ID | Reward mean ± rollout SD | 95% clustered bootstrap CI |')[1]?.split('\n\n')[0];
    if (!table || !report.includes('five rollouts')) throw new Error('Missing primary reward table');
    const models = new Map<string, Record<string, number>>();
    for (const line of table.split('\n').filter(s => /^\| (Find|Ask) \|/.test(s))) {
      const [, task, model, , reward, interval, diagnostics, zero, recovered] = line.split('|').map(c => c.trim());
      const key = task.toLowerCase();
      const [score, std] = reward.split(' ± ').map(Number);
      const [low, high] = JSON.parse(interval) as number[];
      const metrics = models.get(model) ?? {};
      Object.assign(metrics, { [key]: score, [key+'Std']: std, [key+'Low']: low, [key+'High']: high,
        [key+'ZeroRewardTasks']: Number(zero), [key+'Recovered']: Number(recovered) });
      for (const diagnostic of diagnostics.split('; ')) {
        const match = diagnostic.match(/^(.+) ([\d.]+)$/);
        if (!match) throw new Error('Unexpected diagnostic: ' + diagnostic);
        metrics[key + '_' + match[1].replaceAll(/[^a-z0-9]+/g, '_')] = Number(match[2]);
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid reward statistics');
      models.set(model, metrics);
    }
    return checked([...models].map(([model, metrics]) => ({
      model: model === 'Gemini 2.5 Flash' ? model + ' (snapshot unspecified)' : model, score: (metrics.find + metrics.ask)/2, metrics, trials: 5,
    })), 4);
  },
};
export default board;
