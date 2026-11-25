// GerLayQA measures German legal document retrieval using nDCG@10.
// The VAGO leaderboard stores each model's scores and evaluation settings in a separate JSON file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const space = 'https://huggingface.co/spaces/VAGOsolutions/german-legal-embedding-leaderboard';
const feed = 'https://huggingface.co/api/spaces/VAGOsolutions/german-legal-embedding-leaderboard/tree/main/results?expand=false';
interface Result {
  model_name: string; model_type?: string; parameters?: number; date?: string;
  metrics: { gerlayqa?: { ndcg_at_10?: number } };
  protocol?: { date?: string; settings?: { dtype?: string; max_seq_length?: number; format?: string } };
}
const board: Leaderboard = {
  benchmark: 'gerlayqa', url: space, feed,
  host: 'VAGO Solutions',
  terms: "The authors restrict the dataset to noncommercial scientific research. https://github.com/trusthlt/eacl24-german-legal-questions VAGO gives no separate reuse license for submitted scores. https://github.com/VAGOsolutions/german-legal-embedding-leaderboard Hugging Face allows crawling.",
  async fetch() {
    const files = await fetchJson<{type: string; path: string}[]>(feed);
    const rows: LeaderboardRow[] = [];
    for (const {type, path} of files) {
      if (type !== 'file' || !path.endsWith('.json')) continue;
      await new Promise(resolve => setTimeout(resolve, 1000));
      const url = space + '/resolve/main/' + path.split('/').map(encodeURIComponent).join('/');
      const result = await fetchJson<Result>(url);
      if (!result.metrics) throw new Error('Missing metrics in ' + path);
      const score = result.metrics.gerlayqa?.ndcg_at_10;
      if (score == null) continue;
      if (!Number.isFinite(score) || !result.model_name) throw new Error('Invalid GerLayQA result in ' + path);
      const settings = result.protocol?.settings;
      const row: LeaderboardRow = { model: result.model_name, score, link: url };
      if (result.model_type === 'open') row.open = true;
      else if (result.model_type === 'proprietary') row.open = false;
      if (typeof result.parameters === 'number') row.params = result.parameters / 1e9;
      if (settings) row.setting = [settings.format, settings.dtype, settings.max_seq_length && settings.max_seq_length + ' tokens'].filter(Boolean).join(' / ');
      if (result.protocol?.date && /^\d{4}-\d\d-\d\d$/.test(result.protocol.date)) row.date = result.protocol.date;
      rows.push(row);
    }
    if (rows.length < 33) throw new Error('Expected at least 33 GerLayQA scores');
    return rows;
  },
};
export default board;
