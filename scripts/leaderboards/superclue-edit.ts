// SuperCLUE-Edit evaluates models on Chinese image-editing instructions.
// The headline is 总分 from the current workbook's 总榜 sheet, with capability scores in metrics.
// This importer reads the workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: 'superclue-edit',
  url: 'https://www.superclueai.com/multimodal/Edit',
  feed: 'https://www.superclueai.com/data/multimodal_list/Edit/2026%E5%B9%B411%E6%9C%88.xlsx',
  sheet: '总榜',
  model: '模型名称',
  score: '总分',
  minimum: 13,
  parts: ['通用能力', '场景应用'],
  details: [
    { sheet: '通用能力', model: '模型名称', parts: ['分数', '对象编辑', '文本设计', '场景构建', '图像质量', '复杂视觉推理'] },
    { sheet: '场景应用', model: '模型名称', parts: ['分数', '创作能力', '工程能力'] },
  ],
});
