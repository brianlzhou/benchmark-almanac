// KilometerVision test split, top-1 accuracy.
import { kilometerBoard } from '../lib/boards/kilometervision.ts';
// The host's zero-shot random baseline submission is not a model, so the board leaves it out.
const board = kilometerBoard('kilometervision',7010);
board.notModels = /\/ zero-shot random baseline$/;
export default board;
