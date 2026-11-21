// SuperCLUE-Image ranks multimodal models by total score on its published workbook.
// The headline score is the workbook's 总分 value on a 0 to 100 scale.
// The importer reads the November 2026 results workbook.
import { workbookBoard } from './agentclue.ts';
export default workbookBoard({
  benchmark: 'superclue-image', url: 'https://www.superclueai.com/multimodal/Image',
  feed: 'https://www.superclueai.com/data/multimodal_list/Image/2026%E5%B9%B411%E6%9C%88.xlsx',
  sheet: '总榜', model: '模型名称', score: '总分', minimum: 15,
  parts: ['图像质量', '图文一致性', '汉字生成', '现实复现', '创作与推理', '复杂信息布局'],
});
