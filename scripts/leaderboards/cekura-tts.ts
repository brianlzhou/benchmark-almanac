// Cekura's whole-set round-trip WER, averaged over its two transcribers, lower is better.
import { cekuraBoard } from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-tts', 'tts');
board.terms = 'Cekura publishes benchmark results under CC BY 4.0, per its governance page. Robots.txt permits this path. Source: Cekura.';
export default board;
