// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// GameXpert tests game creation, repair and improvement. The project site ranks all three on a 100-point scale.
// For GameFix we use the Claude Code runs shared by all models. The Codex comparison covers only repair.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://kwen-chen.github.io/GameXpert-Bench/';
const feed = url + 'static/js/index.js';
type Track = { columns: string[]; rows: (string|number)[][] };
const board: Leaderboard = {
  benchmark: 'gamexpert-bench', url, feed, terms: 'The authors publish the scores on their project website. ' + url,
  parts: { gen: 'GameGen', fix: 'GameFix', opt: 'GameOpt' },
  async fetch() {
    const source = await fetchText(feed);
    const start = source.indexOf('const leaderboards = {');
    if (start < 0) throw new Error('GameXpert leaderboard missing');
    const tracks = jsLiteral<Record<string, Track>>(source, source.indexOf('{',start));
    const expected = { gamegen: 'Rank|Model|Overall|Completeness|Richness|Player Exp.|Visual',
      gamefix: 'Rank|Model|Framework|Effort|Strict ↑|Cliff ↓', gameopt: 'Rank|Model|Overall|Gameplay|Level|Balance|Art|UI|Audio' };
    for (const [track, columns] of Object.entries(expected)) {
      if (tracks[track]?.columns.join('|') !== columns) throw new Error('Changed columns in ' + track);
    }
    const key = (v: string|number) => String(v).toLowerCase().replace(/[\s-]/g, '');
    return checked(tracks.gamegen.rows.map(gen => {
      const model = String(gen[1]);
      const fix = tracks.gamefix.rows.find(r => key(r[1]) === key(model) && r[2] === 'Claude Code');
      const opt = tracks.gameopt.rows.find(r => key(r[1]) === key(model));
      if (!fix || !opt) throw new Error('Track score missing for ' + model);
      const metrics = { gen: Number(gen[2]), fix: Number(fix[4]), opt: Number(opt[2]), cliff: Number(fix[5]),
        completeness: Number(gen[3]), richness: Number(gen[4]), playerExperience: Number(gen[5]), visual: Number(gen[6]),
        gameplay: Number(opt[3]), level: Number(opt[4]), balance: Number(opt[5]), art: Number(opt[6]), ui: Number(opt[7]), audio: Number(opt[8]) };
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid track components for ' + model);
      return { model, setting: 'GameFix: Claude Code, ' + fix[3], score: (metrics.gen + metrics.fix + metrics.opt)/3, metrics };
    }), 15);
  },
};
export default board;
