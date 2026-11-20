// EmbodiedBench EB-Manipulation. The score is the published environment average success rate (%); subsets stay metrics.
import { embodiedbenchBoard } from '../lib/boards/embodiedbench.ts';
const board = embodiedbenchBoard("manipulation");
board.parts = {
  base: { name: 'Base', group: 'Category' },
  common: { name: 'Common', group: 'Category' },
  complex: { name: 'Complex', group: 'Category' },
  visual: { name: 'Visual', group: 'Category' },
  spatial: { name: 'Spatial', group: 'Category' },
  long: { name: 'Long', group: 'Category' },
};
export default board;