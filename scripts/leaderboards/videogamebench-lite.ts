// Lite pauses the game during inference and therefore remains separate from real-time Full.
import board, {fetchVGrows} from './videogamebench.ts';
export default {...board, benchmark:'videogamebench-lite', feed:'https://vgbench.com/ (Lite table)', fetch:()=>fetchVGrows(1)};
