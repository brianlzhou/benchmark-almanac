// TRAJECT-Bench evaluates tool-using language models on parallel simple and hard queries.
// The headline is the mean of the published Simple and Hard solution accuracy percentages.
// This importer reads the two evaluation tables in the project's README.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const values: [string, number, number, number, number, number, number, number, number, number, number][] = [
  ['Claude-3.7', .714, .246, .676, .135, .706, .603, 6.831, 1.582, .583, .573],
  ['Claude-4', .905, .517, .846, .445, .839, .794, 8.549, 4.882, .819, .813],
  ['Gemini-2.5-flash', .782, .263, .714, .216, .784, .666, 7.215, 2.340, .613, .652],
  ['Gemini-2.5-pro', .911, .498, .851, .442, .835, .785, 8.599, 4.849, .807, .848],
  ['GPT5-mini', .834, .380, .817, .155, .819, .626, 8.236, 1.701, .693, .677],
  ['o4-mini', .863, .472, .823, .376, .824, .726, 8.316, 3.849, .789, .761],
  ['gpt-oss:120b', .726, .387, .652, .174, .715, .671, 6.588, 1.909, .538, .653],
  ['DeepSeek', .889, .458, .833, .439, .829, .757, 8.417, 4.817, .825, .823],
  ['qwen3-235b-A22B', .898, .479, .844, .440, .809, .796, 8.529, 4.828, .824, .791],
  ['Kimi-k2', .902, .448, .815, .321, .872, .772, 8.236, 3.522, .821, .833],
];

const board: Leaderboard = {
  benchmark: 'traject-bench',
  url: 'https://github.com/PengfeiHePower/TRAJECT-Bench',
  feed: 'https://raw.githubusercontent.com/PengfeiHePower/TRAJECT-Bench/master/README.md (parallel-query evaluation tables)',
  terms: 'The repository is MIT licensed. Results are credited to Pengfei He and collaborators.',
  static: 'paper',
  headline: 'The headline is the plain mean of the published Simple and Hard solution accuracy percentages.',
  parts: {
    simpleAccuracy: { name: 'Simple solution accuracy', group: 'Query difficulty', unit: '%' },
    hardAccuracy: { name: 'Hard solution accuracy', group: 'Query difficulty', unit: '%' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    return values.map(([model, simpleAcc, hardAcc, simpleEm, hardEm, simpleInclusion, hardInclusion, simpleTrajSatisfy, hardTrajSatisfy, sequentialEm, sequentialAcc]) => ({
      model,
      score: (simpleAcc + hardAcc) * 50,
      metrics: {
        simpleAccuracy: simpleAcc * 100,
        hardAccuracy: hardAcc * 100,
        simpleExactMatch: simpleEm * 100,
        hardExactMatch: hardEm * 100,
        simpleToolInclusion: simpleInclusion * 100,
        hardToolInclusion: hardInclusion * 100,
        simpleTrajectorySatisfaction: simpleTrajSatisfy,
        hardTrajectorySatisfaction: hardTrajSatisfy,
        sequentialExactMatch: sequentialEm * 100,
        sequentialAccuracy: sequentialAcc * 100,
      },
    }));
  },
};
export default board;
