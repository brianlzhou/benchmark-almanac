// Each task produces one deck, so USD per deck is USD per task.
import { fireworksBoard } from '../lib/boards/fireworks.ts';
const board = fireworksBoard('genspark-slides-benchmark','slide-generation/genspark-slides-benchmark');
board.stats = { cost_per_deck: { name: 'Cost per deck', unit: 'usd', better: 'lower' }, layoutPenalty: { name: 'Layout penalty', unit: 'score', better: 'lower' }, qualityComposite: { name: 'Quality composite', unit: 'score', better: 'higher' }, tierARatio: { name: 'Tier A ratio', unit: '%', better: 'higher' } };
board.parts = {
  taskCompletion: { name: 'Task completion', group: 'Dimension' },
  contentQuality: { name: 'Content quality', group: 'Dimension' },
  visualDesign: { name: 'Visual design', group: 'Dimension' },
  processQuality: { name: 'Process quality', group: 'Dimension' },
};
export default board;
