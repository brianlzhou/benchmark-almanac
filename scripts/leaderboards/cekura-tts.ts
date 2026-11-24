// Cekura's whole-set round-trip WER, averaged over its two transcribers, lower is better.
import { cekuraBoard } from '../lib/boards/cekura.ts';
const board = cekuraBoard('cekura-tts', 'tts');
board.terms = 'Cekura publishes benchmark results under CC BY 4.0, per its governance page. Robots.txt permits this path. Source: Cekura.';
board.chart = {
  title: 'Word error rate vs. streaming latency',
  x: { key: 'firstAudioMedianMs', label: 'Streaming latency (median)', unit: 'ms', better: 'lower' },
  y: { key: 'score', label: 'Word error rate', unit: '%', better: 'lower' },
  note: 'Cekura plots accuracy (100 minus word error rate) against median time to first audio in milliseconds.',
};
export default board;
