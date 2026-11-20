// Lite pauses the game during inference and therefore remains separate from real-time Full.
import board, {fetchVGrows} from './videogamebench.ts';
export default {...board, benchmark:'videogamebench-lite', parts: {
  'Doom II': { name: 'Doom II', group: 'Environment' },
  'Kirby\'s Dream Land': { name: 'Kirby\'s Dream Land', group: 'Environment' },
  'Link\'s Awakening (DX)': { name: 'Link\'s Awakening (DX)', group: 'Environment' },
}, feed:'https://vgbench.com/ (Lite table)', fetch:()=>fetchVGrows(1)};
