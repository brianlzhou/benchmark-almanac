// WinoGrande: the paper’s main comparison reports test accuracy, already in percent.
// Table 4 identifies the five RoBERTa training sizes. Stars in Table 3 mark zero-shot runs.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1907.10641";
const board: Leaderboard = {
  benchmark: "winogrande",

  url: "https://arxiv.org/html/1907.10641",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const source = tables(await fetchText(FEED));
    const t = source.find(t => t[0]?.map(c=>c.text).join('|') === 'Methods|dev acc. (%)|test acc.(%)');
    if (!t) throw new Error('WinoGrande main table missing');
    const training = source.find(table => table[0]?.[0]?.text === 'Training size');
    const configurations = (training?.slice(1) ?? []).flatMap(row => {
      const size = row[0]?.text.match(/^([A-Z]+)\s*\(([\d,]+)\)$/);
      const score = num(row[2]?.text), dev = num(row[1]?.text);
      if (!size || score === undefined || dev === undefined) return [];
      return [{ model: 'RoBERTa', score, setting: 'Training size ' + size[1], metrics: { dev, trainingExamples: Number(size[2].replace(/,/g, '')) } }];
    });
    const rows = t.slice(1).filter(row => !/^Human/.test(row[0].text)).map(row => ({
      model: row[0].text.replace(/ ⋆$/, ''), score: num(row[2].text)!, metrics: { dev: num(row[1].text)! },
      setting: row[0].text.endsWith('⋆') ? 'zero-shot' : undefined,
    }));
    return [...rows.filter(row => !configurations.some(config => row.model === config.model && row.score === config.score && row.metrics.dev === config.metrics.dev)), ...configurations];
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
