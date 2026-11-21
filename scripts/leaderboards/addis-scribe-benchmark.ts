// Addis AI compares speech recognition systems on 150 Afaan Oromo clips. Its dataset card gives word error rate by operating mode.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://huggingface.co/datasets/addisai/addis-scribe-benchmark/resolve/main/README.md";

const board: Leaderboard = {
  benchmark: "addis-scribe-benchmark",
  url: "https://addisassistant.com/benchmarks",
  feed,
  terms: "Eight systems on 150 Afaan Oromo clips. The transcript file includes eleven operating modes. The benchmark archive lists CC BY-SA 4.0. https://huggingface.co/datasets/addisai/addis-scribe-benchmark The feed host publishes robots.txt at https://huggingface.co/robots.txt.",
  parts: {"Male": "Male", "Female": "Female"},
  stats: {
    cer: { name: 'Character error rate', unit: '%', better: 'lower' },
    processingSeconds: { name: 'Processing per audio minute', unit: 'seconds', better: 'lower' },
    firstWordsSeconds: { name: 'Time to first words', unit: 'seconds', better: 'lower' },
    finalSeconds: { name: 'Time to finish after stopping', unit: 'seconds', better: 'lower' },
  },
  aliases: {"Google Gemini 4 Argon": "gemini-4-argon"},
  async fetch() {
    const required = ["System", "WER", "Male", "Female"];
    const table = markdownTables((await fetchText(feed)).split('**Afaan Oromo, 150 clips**')[1]?.split('**Amharic,')[0] ?? '')
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 11) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("System");
      const score = num(cell("WER"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.metrics = {};
      for (const name of Object.keys(board.parts!)) {
        const value = num(cell(name));
        if (value === undefined) throw new Error('Missing part score: ' + name);
        row.metrics[name] = value;
      }
      row.setting = cell('Mode');
      row.metrics!.cer = Number.parseFloat(cell('CER'));
      const processing = num(cell('Processing per audio minute'));
      if (processing !== undefined) row.metrics!.processingSeconds = processing;
      const latency = cell('Live: first words / done after you stop').split('/');
      if (latency.length === 2) {
        row.metrics!.firstWordsSeconds = Number.parseFloat(latency[0]);
        row.metrics!.finalSeconds = Number(latency[1].replace(/[^0-9.]/g, '')) / 1000;
      }
      return row;
    });
  },
};
export default board;
