import {cekuraBoard} from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-stt','stt');
board.parts = {
  publicWerPercent: { name: 'Public', group: 'Split' },
  privateWerPercent: { name: 'Private', group: 'Split' },
};
board.chart = {
  title: 'Overall WER vs. final-text delay',
  x: { key: 'finalTextMedianMs', label: 'Final-text delay P50', unit: 'ms', better: 'lower' },
  y: { key: 'score', label: 'Overall WER', unit: '%', better: 'lower' },
  note: 'Cekura plots overall word error rate against median final-text delay in milliseconds.',
};
export default board;