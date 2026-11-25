// Flex-RSI evaluates models that improve themselves over rounds across computer, vision and robotics tasks.
// The overview averages each model's competition ranks across its completed tasks, including ties.
// Read the published results JSON and keep each hidden-test task score with the model's average rank.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://flex-rsi.github.io/leaderboard.html';
const FEED = 'https://flex-rsi.github.io/data/results.json';
const ON_100 = new Set(['rhae', 'rhae_starter', 'robolab_score', 'robolab_starter', 'score']);
const scale = (key: string) => ON_100.has(key) || ['speedup', 'tasks_run', 'tasks_nonzero', 'avg_steps'].includes(key) || key.startsWith('pts_') ? 1 : 100;

interface TaskRow {
  model: string;
  weights?: 'open' | 'closed';
  test: Record<string, number>;
  start?: number;
  best?: number;
  rounds?: number;
  ended?: string;
  extra?: boolean;
}
interface Task {
  id: string;
  track: string;
  primary: string;
  metrics: { key: string; label: string }[];
  rows: TaskRow[];
}
interface Results { updated: string; tasks: Task[] }

const board: Leaderboard = {
  benchmark: 'flex-rsi',
  url: PAGE,
  feed: FEED,
  terms: 'The Flex-RSI site publishes this JSON without a separate score reuse license. The robots.txt URL returned a GitHub error page. Results are credited to Flex-RSI with a link to the leaderboard.',
  parts: {},
  stats: {
    tasks: { name: 'Tasks completed', unit: 'count' },
    firstPlaces: { name: 'First-place finishes', unit: 'count', better: 'higher' },
    ...Object.fromEntries(([
      ['3d-tracking', '3D Tracking', 'score', [['t_sr', 'T-SR'], ['J', 'J'], ['F', 'F'], ['JF', 'J&F']]],
      ['visual-search', 'Visual Search', 'score', [['acc_vstar', 'V*Bench'], ['acc_hrbench8k', 'HR-Bench 8K']]],
      ['active-search', 'Active Search', 'score', [['success', 'Success'], ['hos_sr', 'Object SR'], ['hps_sr', 'Path SR'], ['avg_steps', 'Average steps', 'count']]],
      ['video-quality', 'Video Quality', 'score', [['quality_starter', 'Starter'], ['srcc', 'SRCC'], ['plcc', 'PLCC'], ['pair_accuracy', 'Pair accuracy']]],
      ['ego-exo-memory', 'Ego-Exo Memory', 'score', [['acc_starter', 'Starter'], ['acc_cooking', 'Cooking'], ['acc_bike', 'Bike repair']]],
      ['image-editing', 'Image Editing', 'score', [['overall_starter', 'Starter'], ['cat_A', 'Local'], ['cat_B', 'Global'], ['cat_C', 'Text'], ['cat_E', 'Retouch'], ['cat_F', 'Reasoning'], ['cat_G', 'Compound']]],
      ['quantiphy-kinematics', 'Kinematics', 'score', [['mra_starter', 'Starter']]],
      ['quantiphy-mass', 'Mass', 'score', [['mra_starter', 'Starter']]],
      ['scene-from-photo', 'Scene from Photo', 'score', [['scene_starter', 'Starter'], ['appearance_term', 'Appearance'], ['object_term', 'Objects'], ['geometry_term', 'Geometry']]],
      ['scene-from-video', 'Scene from Video', 'score', [['scene_starter', 'Starter'], ['geometry_term', 'Geometry'], ['appearance_term', 'Appearance'], ['physics_term', 'Physics']]],
      ['multi-turn-editing', 'Multi-turn Editing', 'score', [['mt_starter', 'Starter'], ['success_t1', 'Turn 1'], ['success_t3', 'Turn 3'], ['success_t5', 'Turn 5']]],
      ['robolab', 'RoboLab', 'score', [['success_rate', 'Success rate']]],
      ['libero-max', 'LIBERO-MAX', 'score', [['base_success_rate', 'Base success'], ['dsr_starter', 'Starter']]],
      ['libero-pro', 'LIBERO-PRO', 'score', [['sr_starter', 'Starter']]],
      ['video-generation', 'Video Generation', 'score', [['comp_starter', 'Starter']]],
      ['t2i', 'Text-to-Image', 'score', [['starter_mean', 'Starter'], ['score_t2i', 'Fixed'], ['score_t2i-unlimited', 'Any model']]],
      ['vae-decode', 'VAE Decode', 'speedup', []],
      ['robodojo', 'RoboDojo', 'score', [['pts_put-bottles-into-dustbin', 'Bottles'], ['pts_arrange-largest-number', 'Largest number'], ['pts_fold-clothes', 'Fold clothes'], ['pts_insert-tubes', 'Insert tubes'], ['pts_fill-egg-holder', 'Egg holder'], ['pts_pick-from-conveyor-by-image', 'Conveyor pick'], ['pts_play-tic-tac-toe', 'Tic-tac-toe'], ['pts_play-xylophone', 'Xylophone'], ['pts_push-t', 'Push-T'], ['pts_sort-nesting-dolls-by-size', 'Nesting dolls']]],
      ['robocasa', 'RoboCasa', 'score', [['sr_coffee-setup-mug', 'Coffee mug'], ['sr_kettle-boiling', 'Kettle'], ['sr_open-cabinet', 'Cabinet'], ['sr_open-drawer', 'Drawer'], ['sr_portion-hot-dogs', 'Hot dogs'], ['sr_turn-off-stove', 'Stove off'], ['sr_turn-on-microwave', 'Microwave'], ['sr_turn-on-sink-faucet', 'Faucet']]],
      ['embodied-swe', 'Embodied-SWE', 'score', [['rubric_starter', 'Starter']]],
      ['arc-agi-1', 'ARC-AGI-1', 'score', [['acc_starter', 'Starter']]],
      ['arc-agi-2', 'ARC-AGI-2', 'score', [['acc_starter', 'Starter']]],
      ['arc-agi-3', 'ARC-AGI-3', 'score', [['rhae_starter', 'Starter']]],
      ['spatial-vsi', 'Spatial-VSI', 'score', [['vsi_starter', 'Starter']]],
    ] as const).flatMap(([id, track, unit, extras]) => [
      [id + '.start', { name: track + ' start', unit, better: 'higher' }],
      [id + '.best', { name: track + ' best', unit, better: 'higher' }],
      ...extras.map(([k, label, u]) => [id + '.' + k, { name: track + ': ' + label, unit: u ?? 'score', ...(u === 'count' ? {} : { better: 'higher' }) }]),
    ])),
  },
  async fetch() {
    const data = await fetchJson<Results>(FEED);
    if (data.tasks.length < 24) throw new Error('Flex-RSI: missing tasks');
    const models = new Map<string, LeaderboardRow & { metrics: Record<string, number> }>();
    for (const task of data.tasks) {
      const primary = task.metrics.find((m) => m.key === task.primary)?.label ?? task.primary;
      board.parts![task.id] = { name: task.track, group: 'Task', better: 'higher', unit: task.primary === 'speedup' ? 'speedup' : 'score', note: `${primary} on the hidden test split.` };
      const standard = task.rows.filter(row => !row.extra);
      for (const source of standard) {
        const raw = source.test?.[task.primary];
        if (typeof raw !== 'number' || !Number.isFinite(raw)) throw new Error(`Flex-RSI: missing ${task.primary} for ${task.id} ${source.model}`);
        const row = models.get(source.model) ?? { model: source.model, open: source.weights === 'open',
          score: 0, metrics: { tasks: 0, firstPlaces: 0 } };
        const metrics = row.metrics;
        if (task.id in metrics) throw new Error('Duplicate task for ' + source.model);
        const rank = 1 + standard.filter(other => other.test[task.primary] > raw).length;
        row.score += rank;
        metrics.tasks++;
        metrics.firstPlaces += Number(rank === 1);
        for (const [key, value] of Object.entries(source.test)) {
          if (key === 'tasks_run' || key === 'tasks_nonzero') continue;
          if (typeof value === 'number' && Number.isFinite(value)) metrics[key === task.primary ? task.id : `${task.id}.${key}`] = value * scale(key);
        }
        if (typeof source.start === 'number') metrics[task.id + '.start'] = source.start * scale(task.primary);
        if (typeof source.best === 'number') metrics[task.id + '.best'] = source.best * scale(task.primary);
        models.set(source.model, row);
      }
    }
    if (models.size < 18) throw new Error('Flex-RSI: incomplete model overview');
    return Array.from(models.values(), row => ({
      ...row, score: Number((row.score / row.metrics.tasks).toFixed(2)),
      setting: row.metrics.tasks < 5 ? 'Unranked (fewer than five tasks)' : undefined,
    }));
  },
};

export default board;
