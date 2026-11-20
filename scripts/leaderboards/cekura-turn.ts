import {cekuraBoard} from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-turn','turn');
board.parts = {
  cleanPercent: { name: 'Clean', group: 'Environment' },
  telephonePercent: { name: 'Telephone', group: 'Environment' },
  'noise-10dbPercent': { name: 'Noise 10 dB', group: 'Environment' },
  'noise-20dbPercent': { name: 'Noise 20 dB', group: 'Environment' },
  reverbPercent: { name: 'Reverb', group: 'Environment' },
  dropoutsPercent: { name: 'Dropouts', group: 'Environment' },
};
export default board;