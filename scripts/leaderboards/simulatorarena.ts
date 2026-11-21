// SimulatorArena ranks assistants by the mean z-score of four ratings from simulated users.
// The Gradio table supplies the four ratings and average turns for each task.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://www.simulatorarena.ai/config";
type Table = { headers: string[]; data: (string | number)[][] };
const headers = ['Model', 'Org', 'Date', 'Math Turns', 'Math Interaction', 'Math Outcome', 'Doc Turns', 'Doc Interaction', 'Doc Outcome'];
const board: Leaderboard = {
  benchmark: "simulatorarena",
  url: "https://www.simulatorarena.ai/#assistant-leaderboard",
  feed: FEED,
  terms: "Microsoft licenses the repository under MIT. I found no separate terms for leaderboard scores. https://github.com/microsoft/SimulatorArena/blob/main/LICENSE The public results path is readable.",
  aliases: {
    'Claude 3.7 Sonnet (20250219)': 'claude-3-7-sonnet', 'Claude 4.1 Opus': 'claude-opus-4-1',
    'GPT-4 Turbo (20240409)': 'gpt-4-turbo-apr-2024', 'GPT-4o (20241120)': 'gpt-4o-nov-2024',
    'Claude 4 Sonnet': 'claude-sonnet-4', 'GPT-4.1 (20250414)': 'gpt-4-1',
    'Claude 3.5 Sonnet (20240620)': 'claude-3-5-sonnet', 'GPT-4o mini (20240718)': 'gpt-4o-mini',
    'Mistral Large 2 (202407)': 'mistral-large-2-jul-2024',
  },
  parts: {
    mathInteraction: 'Math Interaction', mathOutcome: { name: 'Math Outcome', unit: '%' },
    docInteraction: 'Doc Interaction', docOutcome: 'Doc Outcome',
  },
  stats: {
    mathTurns: { name: 'Math turns', unit: 'count' },
    docTurns: { name: 'Document turns', unit: 'count' },
  },
  async fetch() {
    const config = await fetchJson(FEED) as { components: { type: string; props: { value?: Table } }[] };
    const table = config.components.find(c => c.type === 'dataframe' && c.props.value?.headers?.includes('Math Turns'))?.props.value;
    if (!table || String(table.headers) !== String(headers) || table.data.length < 18) throw new Error('SimulatorArena assistant table changed');
    const rows = table.data;
    const zScores = [4, 5, 7, 8].map(column => {
      const values = rows.map(row => row[column] as number);
      if (!values.every(Number.isFinite)) throw new Error('Missing assistant rating');
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sd = Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length);
      if (!sd) throw new Error('Cannot standardize constant ratings');
      return values.map(x => (x - mean) / sd);
    });
    return rows.map(([model, , date, mathTurns, mathInteraction, mathOutcome, docTurns, docInteraction, docOutcome], i) => ({
      model: String(model), date: new Date(String(date) + ' UTC').toISOString().slice(0, 10), setting: 'Non-thinking',
      score: zScores.reduce((sum, column) => sum + column[i], 0) / 4,
      metrics: { mathTurns: Number(mathTurns), mathInteraction: Number(mathInteraction), mathOutcome: Number(mathOutcome),
        docTurns: Number(docTurns), docInteraction: Number(docInteraction), docOutcome: Number(docOutcome) },
    }));
  },
};
export default board;
