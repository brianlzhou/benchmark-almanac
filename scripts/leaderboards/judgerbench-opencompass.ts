// OpenCompass evaluates models as judges of English and Chinese answers.
// The Space publishes the combined JudgerBench score and four component scores in overall.csv.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/opencompass/judgerbench_leaderboard/resolve/main/data/overall.csv";


const board: Leaderboard = {
  benchmark: "judgerbench-opencompass",
  url: "https://huggingface.co/spaces/opencompass/judgerbench_leaderboard",
  feed,
  terms: "The publisher links the board at https://huggingface.co/spaces/opencompass/judgerbench_leaderboard. Separate results licensing remains unverified. Hugging Face allows crawling.",
  aliases: { 'GPT-4o-0806': 'gpt-4o-aug-2024', 'Qwen2.5-72B-Chat': 'qwen2-5-72b', 'Qwen2.5-7B-Chat': 'qwen2-5-7b' },
  parts: { en: 'JDB-A EN', cn: 'JDB-A CN', accuracy: 'JDB-B Acc', correlation: 'JDB-B Corr' },
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    const fields = ['JDB-A EN','JDB-A CN','JDB-B Acc','JDB-B Corr'];
    if (!records[0] || ['Models','JudgerBench',...fields].some(k => !(k in records[0]))) throw new Error('Changed JudgerBench columns');
    const rows = records.filter(r => r.JudgerBench && r.JudgerBench !== '-').map(r => {
      if (!r.Models || ![...fields,'JudgerBench'].every(k => r[k].trim() && Number.isFinite(Number(r[k])))) throw new Error('Incomplete JudgerBench score');
      return { model: r.Models, score: Number(r.JudgerBench), metrics: { en:Number(r[fields[0]]), cn:Number(r[fields[1]]), accuracy:Number(r[fields[2]]), correlation:Number(r[fields[3]]) } };
    });
    if (rows.length < 9) throw new Error('Expected nine overall scores');
    return rows;
  },
};
export default board;
