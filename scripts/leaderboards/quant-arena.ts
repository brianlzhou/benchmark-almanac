// The published table lists every effort. Keep each model's best iterative run and its metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts'
import { tables, text } from '../lib/html.ts'
import { fetchText } from '../lib/util.ts'

const PAGE = 'https://lab.einsia.ai/quant-arena/leaderboard/'
const columns = ['#', 'Model', 'Effort', 'Total', 'S in', 'S out', '2024 ARR', 'Excess', 'RankIC', 'Sharpe', 'MDD']

const board: Leaderboard = {
  benchmark: 'quant-arena',
  url: PAGE,
  feed: PAGE + ' (Iterative research leaderboard)',
  terms: 'Einsia publishes these results on its public research site. The Almanac credits and links the table.',
  parts: {
    inSample: { name: 'In-sample', group: 'Split' },
    outOfSample: { name: 'Out-of-sample', group: 'Split' },
  },
  async fetch() {
    const html = await fetchText(PAGE)
    const table = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)]
      .find(([markup]) => text(markup.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] ?? '') === 'Quant Arena Iterative research leaderboard')
    if (!table) throw new Error('Quant Arena iterative research table missing')
    const [header, ...rows] = tables(table[0])[0]
    const index = columns.map(name => header.findIndex(cell => cell.text === name))
    if (index.includes(-1)) throw new Error('Quant Arena iterative research columns changed')

    const best = new Map<string, LeaderboardRow>()
    for (const row of rows) {
      const model = text(row[index[1]].html.replace(/<span class="qa-tag">[^<]*<\/span>/g, ''))
      const values = index.slice(3).map(i => Number(row[i].text.replace('−', '-').replace(/%$/, '') || NaN))
      if (!model || !values.every(Number.isFinite)) throw new Error('Invalid Quant Arena result')
      const [score, inSample, outOfSample, oosReturn, excess, rankIC, oosSharpe, oosDrawdown] = values
      if (best.has(model) && best.get(model)!.score >= score) continue
      best.set(model, { model, score, metrics: { inSample, outOfSample, oosReturn, excess, rankIC, oosSharpe, oosDrawdown } })
    }
    if (!best.size) throw new Error('Quant Arena iterative research table is empty')
    return [...best.values()]
  },
}
export default board
