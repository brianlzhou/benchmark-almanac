// Models receive 144 benign biology prompts. The score measures the percentage correctly answered.
// Score: correct permission (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/biotier-securebio.ts';
const board: Leaderboard = {
  benchmark: "biotier-securebio-permit",
  url: sourceBoard.url,
  feed: sourceBoard.feed,
  terms: sourceBoard.terms,
  aliases: sourceBoard.aliases,
  stats: {
    refuseRate: { name: 'Hazardous prompts refused', unit: '%', better: 'higher', note: 'BioTIER-refuse score on 398 dangerous biology prompts.' },
  },
  chart: {
    title: 'Hazardous prompts refused vs benign prompts answered',
    x: { key: 'score', label: 'Benign prompts answered (BioTIER-permit)', unit: '%', better: 'higher' },
    y: { key: 'refuseRate', label: 'Hazardous prompts refused (BioTIER-refuse)', unit: '%', better: 'higher' },
    note: 'Each model plotted by benign prompt compliance against hazardous prompt refusal on the SecureBio BioTIER dashboard.',
  },
  fetch: () => trackRows("^BioTIER-permit", "^BioTIER-permit;?\\s*"),
};
export default board;
