// Models receive 398 dangerous biology prompts. The score measures the percentage correctly refused.
// Score: correct refusal (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/biotier-securebio.ts';
const board: Leaderboard = {
  benchmark: "biotier-securebio-refuse",
  url: sourceBoard.url,
  feed: sourceBoard.feed,
  terms: sourceBoard.terms,
  aliases: sourceBoard.aliases,
  stats: {
    permitRate: { name: 'Benign prompts answered', unit: '%', better: 'higher', note: 'BioTIER-permit score on 144 benign biology prompts.' },
  },
  chart: {
    title: 'Hazardous prompts refused vs benign prompts answered',
    x: { key: 'permitRate', label: 'Benign prompts answered (BioTIER-permit)', unit: '%', better: 'higher' },
    y: { key: 'score', label: 'Hazardous prompts refused (BioTIER-refuse)', unit: '%', better: 'higher' },
    note: 'Each model plotted by benign prompt compliance against hazardous prompt refusal on the SecureBio BioTIER dashboard.',
  },
  fetch: () => trackRows("^BioTIER-refuse", "^BioTIER-refuse;?\\s*"),
};
export default board;
