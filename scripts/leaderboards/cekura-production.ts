// Cekura replaced the September study with a weighted, 12-metric voice quality score.
import type { Leaderboard, LeaderboardRow } from './types.ts'
import { tables } from '../lib/html.ts'
import { fetchText } from '../lib/util.ts'

const PAGE = 'https://benchmarks.cekura.ai/experiments/production-voice-agents'
const columns = ['Platform', 'Quality score / 100', 'Audio 20% weight', 'Turn-taking 40% weight',
  'Response 25% weight', 'Adaptation 15% weight', 'Latency lower is better', 'Stop time lower is better']

const board: Leaderboard = {
  benchmark: 'cekura-production',
  url: PAGE,
  feed: PAGE + ' (voice quality leaderboard)',
  terms: 'Cekura publishes these benchmark results under CC BY 4.0. The Almanac credits and links the study.',
  parts: {
    audio: { name: 'Audio quality', group: 'Dimension' },
    turnTaking: { name: 'Turn-taking and reliability', group: 'Dimension' },
    response: { name: 'Response quality', group: 'Dimension' },
    adaptation: { name: 'Conversational adaptation', group: 'Dimension' },
  },
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, stopTimeSeconds: { name: 'Stop time', unit: 'seconds', better: 'lower' }, phoneLines: { name: 'Phone lines', unit: 'count' } },
  async fetch() {
    const table = tables(await fetchText(PAGE)).find(t => t[0]?.some(c => c.text === 'Quality score / 100'))
    if (!table) throw new Error('Cekura voice quality table missing')
    const index = columns.map(name => table[0].findIndex(c => c.text === name))
    if (index.includes(-1)) throw new Error('Cekura voice quality columns or weights changed')

    const rows: LeaderboardRow[] = []
    for (const row of table.slice(1)) {
      if (row.some(cell => cell.text === 'Get scored')) continue
      const platform = row[index[0]]?.text.match(/^\d+\s+(.+?)\s+(\d+) lines?$/)
      const values = index.slice(1).map(i => Number(row[i]?.text.replace(/s$/, '') || NaN))
      if (!platform || !values.every(Number.isFinite)) throw new Error('Invalid Cekura platform result')
      const [score, audio, turnTaking, response, adaptation, latency, stopTimeSeconds] = values
      rows.push({ model: platform[1], score, setting: '12-metric voice quality study',
        metrics: { audio, turnTaking, response, adaptation, latency, stopTimeSeconds, phoneLines: Number(platform[2]) } })
    }
    if (!rows.length) throw new Error('Cekura voice quality table is empty')
    return rows
  },
}
export default board
