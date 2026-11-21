// AI Hub reports overall accuracy and five context-length bands for LG’s Korean long-context test.
// The combined column of its public HTML table covers every length.
import { htmlBoard } from './geomap-bench.ts';

const board = htmlBoard({
  benchmark: 'ko-longbench-lg', url: "https://www.aihub.or.kr/aihubdata/data/view.do?aihubDataSe=extrldata&currMenu=120&dataSetSn=71882&topMenu=100", feed: "https://www.aihub.or.kr/aihubdata/data/view.do?aihubDataSe=extrldata&currMenu=120&dataSetSn=71882&topMenu=100",
  terms: "AI Hub lists the dataset for Korean national applicants. The results page gives no separate license for the score table. https://www.aihub.or.kr/intrcn/guid/usagepolicy.do?currMenu=151&topMenu=105 Its robots.txt restricts two other paths for Googlebot.",
  model: '모델명', score: '통합', minimum: 5,
  parts: { k8: '4K-8K', k16: '-16K', k32: '-32K', k64: '-64K', k128: '-128K' },
});
export default {
  ...board, reference: ['vLLM'],
  async fetch() { return (await board.fetch()).map(row => ({ ...row, harness: 'vLLM' })); },
};
