// Jester tests recognition of 27 human gestures in short videos.
// The score is top-1 recognition accuracy on the challenge test set.
// This importer reads the selected entries in Table 5 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://openaccess.thecvf.com/content_ICCVW_2019/papers/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.pdf';
const board: Leaderboard = {
  benchmark: 'jester-gesture-recognition', static: 'paper',
  url: 'https://openaccess.thecvf.com/content_ICCVW_2019/html/HANDS/Materzynska_The_Jester_Dataset_A_Large-Scale_Video_Dataset_of_Human_Gestures_ICCVW_2019_paper.html',
  feed,
  terms: 'The paper is publicly available from the CVF Open Access repository. Cite the authors when reusing its table.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    const wanted = [
      ['RFEEN, 20 Crops', 97.063013], ['Ford’s Gesture Recognition System', 96.771349],
      ['DRX3D', 96.601777], ['TSN two-stream aggregated with conv', 96.371159],
      ['Spatiotemporal Two Streams network', 96.282982], ['3D CNN Architecture', 96.242284],
      ['Motion Feature Network (MFNet)', 96.215153], ['RNP', 95.964186],
      ['SSNet RGB resnet', 95.787832], ['TVB', 95.71322],
      ['Temporal Pyramid Relation Network for Video-Based Gesture Recognition', 95.340161],
      ['DIN', 95.306247], ['TRN - 8 segments', 94.953537],
      ['3D CNN - Multi time scale evaluation', 94.845011], ['8frames rgb', 94.811097],
      ['TRN (CVPR’18 submission)', 94.783965], ['TRN + BNInception', 94.499084],
      ['slowfast res50', 94.458387], ['3D CNN for transfer learning', 94.261684],
      ['Besnet', 94.227769], ['3D GesNet', 93.990368], ['3D-GesNet(only rgb)', 93.990368],
      ['ECO', 93.820796], ['TRN-E', 93.576613], ['One Stream Modiﬁed-I3D', 93.407041],
      ['Modiﬁed C3D', 89.255918], ['CNN+LSTM', 86.305365], ['3D ResNet 101', 85.98657],
      ['VideoLSTM', 85.864478], ['3D convolutional neural network', 85.49142],
      ['ConvLSTM', 82.764702], ['3d+resnet18', 81.550566], ['3D ResNet', 68.127247],
    ];
    if (!text.includes('Table 5')) throw new Error('Jester results table missing');
    return checked(wanted.map(([model, score]) => ({ model: String(model), score: Number(score) })), 30);
  },
};
export default board;
