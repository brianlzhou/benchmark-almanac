// OdysseyArena-Lite tests agents in four interactive environments. The authors report success rates for three and investment returns for AI Trading.
// The leaderboard puts Turn On Lights first. Use its average success across four trials as the headline and retain every environment.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { sourceBoard } from '../lib/boards/odysseyarena.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const parts = { turnOnLights: 'Turn On Lights', aiTrading: 'AI Trading return', energyDispatch: 'Energy Dispatch', repoSystem: 'Repo System' };
const board: Leaderboard = {
  benchmark: 'odysseyarena', url: sourceBoard.url, feed: sourceBoard.feed, parts,
  aliases: { 'Gemini 3 Pro Preview': 'gemini-3-pro' },
  terms: 'The authors publish the Lite leaderboard and metric definitions at https://yayayacc.github.io/Odyssey-Home/.',
  headline: 'The board reports no overall score. The headline is Turn On Lights average success over four trials, the first column.',
  async fetch() {
    const models = new Map<string, LeaderboardRow>();
    for (const r of await sourceBoard.fetch()) {
      const [suite,env,protocol,effort] = (r.setting ?? '').split('; ');
      if (suite !== 'OdysseyArena-Lite' || !(env in parts) || protocol !== 'Avg4' || !Number.isFinite(r.metrics?.passAt4)) {
        throw new Error('Unexpected environment or protocol');
      }
      const model = r.model === 'Gemini 3 Pro Preview [snapshot unspecified]' ? 'Gemini 3 Pro Preview' : r.model;
      const key = JSON.stringify([model,effort]);
      const row = models.get(key) ?? {model, setting:effort, open:r.open, trials:4, score:NaN, metrics:{}};
      if (Object.hasOwn(row.metrics!,env)) throw new Error('Duplicate environment score');
      row.metrics![env] = r.score;
      row.metrics![env === 'aiTrading' ? 'bestReturnAt4' : env+'PassAt4'] = r.metrics!.passAt4;
      if (env === 'turnOnLights') row.score = r.score;
      models.set(key,row);
    }
    for (const r of models.values()) if (Object.keys(r.metrics!).length !== 8) throw new Error('Incomplete environment set');
    return checked([...models.values()],15);
  },
};
export default board;
